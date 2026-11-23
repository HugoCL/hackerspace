#!/usr/bin/env python3
"""Smoke test: start the dev server (scripts/dev.mjs, what `pnpm dev` runs) and open the
Hackerspace home page in headless Chromium.

Run with `pnpm smoke`. It asserts the page renders and waits for the Convex query to resolve.
It writes artifacts/smoke.png (also when the check fails) and the server log to artifacts/dev.log,
and prints the end of that log on failure.

The first run creates .venv, installs requirements-dev.txt and Chromium, then writes
.venv/.smoke-ready with the sha256 of requirements-dev.txt. Later runs skip that while the stamp
matches. `--bootstrap-only` does just that and exits (`--with-deps` also installs Chromium's system
libraries, Linux only: .capy/setup.json uses it). Set PORT to change the port. If the port is
already in use it stops, because that server may come from another checkout. Set SMOKE_REUSE=1 to
test the server already running there instead.

Stopping the server: scripts/dev.mjs runs in its own session and gets one SIGINT, which convex turns
into a clean stop of `next dev` and the local backend (see scripts/dev.mjs). SIGINT, SIGTERM or
SIGHUP sent to this script go through the same teardown, and further signals during it are
ignored so the fallback below always runs. smoke starts `node scripts/dev.mjs` directly instead of
`pnpm dev`: on Linux pnpm runs the script through `sh -c` (dash) and a SIGINT sent to pnpm never
reaches it. If the dev server is still alive after the grace period,
the whole process group is SIGKILLed, plus every process that was a descendant when the stop
began and is still the same process (`next dev` can sit in its own group and outlive the rest).
"""

import hashlib
import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENV = ROOT / ".venv"
VENV_PYTHON = VENV / "bin" / "python"
REQUIREMENTS = ROOT / "requirements-dev.txt"
STAMP = VENV / ".smoke-ready"
ARTIFACTS = ROOT / "artifacts"
PORT = int(os.environ.get("PORT", "3000"))
URL = f"http://localhost:{PORT}"
CATALOG_DATE = "2027-03-01T12:00:00Z"


def port_open(port):
    try:
        with socket.create_connection(("localhost", port), timeout=1):
            return True
    except OSError:
        return False


def in_venv():
    return Path(sys.prefix).resolve() == VENV.resolve()


def requirements_hash():
    return hashlib.sha256(REQUIREMENTS.read_bytes()).hexdigest()


def bootstrap_ready():
    try:
        return VENV_PYTHON.exists() and STAMP.read_text().strip() == requirements_hash()
    except OSError:
        return False


def bootstrap(with_deps=False):
    """Create .venv, install requirements-dev.txt and Chromium. Skipped while the stamp matches."""
    if bootstrap_ready() and not with_deps:
        print("smoke: .venv is up to date, skipping pip and Chromium install", flush=True)
        return
    if not VENV_PYTHON.exists():
        subprocess.run([sys.executable, "-m", "venv", str(VENV)], check=True)
    subprocess.run(
        [str(VENV_PYTHON), "-m", "pip", "install", "-q", "-r", str(REQUIREMENTS)],
        check=True,
    )
    install = [str(VENV_PYTHON), "-m", "playwright", "install"]
    subprocess.run([*install, *(["--with-deps"] if with_deps else []), "chromium"], check=True)
    STAMP.write_text(requirements_hash() + "\n")


def check():
    from playwright.sync_api import expect, sync_playwright

    ARTIFACTS.mkdir(exist_ok=True)
    page_errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.clock.set_fixed_time(CATALOG_DATE)
            page.on("pageerror", lambda err: page_errors.append(str(err)))
            try:
                page.goto(URL, wait_until="domcontentloaded", timeout=120_000)
                heading = page.get_by_role(
                    "heading", name="Hackathones cerca de ti", level=1, exact=True
                )
                heading.wait_for(state="visible", timeout=60_000)
                expect(page.get_by_test_id("connection-status")).to_have_text(
                    "Conexión activa", timeout=60_000
                )
                expect(page.get_by_role("heading", name="Santiago Hacks 2027")).to_be_visible()
                search = page.get_by_role("searchbox", name="Buscar hackathones")
                search.fill("santiago")
                expect(page.get_by_role("heading", name="Santiago Hacks 2027")).to_be_visible()
                expect(page.get_by_role("heading", name="Hack Puerto")).not_to_be_visible()
                page.get_by_role("tab", name="Virtuales").click()
                expect(page.get_by_role("heading", name="Santiago Hacks 2027")).not_to_be_visible()
                search.fill("codigo")
                expect(page.get_by_role("heading", name="Código sin Fronteras")).to_be_visible()
                search.fill("evento inexistente")
                expect(page.get_by_role("heading", name="No encontramos hackathones")).to_be_visible()
                page.get_by_role("button", name="Limpiar búsqueda").click()
                event_card = page.get_by_role("link", name="Código sin Fronteras", exact=False)
                expect(event_card.get_by_text("0 mirando", exact=True)).to_be_visible()
                expect(event_card.locator("[data-filled]")).to_have_count(8)
                event_card.click()
                expect(
                    page.get_by_role("heading", name="Código sin Fronteras", level=1)
                ).to_be_visible()
                sidebar = page.get_by_role("complementary")
                expect(sidebar.get_by_role("region", name="Datos del evento")).to_contain_text(
                    "En línea"
                )
                presence = page.get_by_role("region", name="Presencia en vivo")
                count = presence.locator("[aria-live=polite]")
                cells = presence.locator("[data-filled=true]")
                expect(count).to_have_text("0 mirando")
                expect(presence.get_by_text("+1 visitante", exact=True)).to_be_visible()
                expect(cells).to_have_count(0)
                expect(presence.get_by_role("button", name="Ver quién está mirando")).to_have_count(0)
                teams = sidebar.get_by_role("region", name="Equipos", exact=True)
                expect(teams.get_by_role("listitem")).to_have_count(2)
                expect(teams.get_by_role("button", name="Inicia sesión para participar")).to_be_visible()
                recruiting_filter = teams.get_by_role("checkbox", name="Solo equipos que buscan integrantes")
                recruiting_filter.click()
                expect(recruiting_filter).to_be_checked()
                expect(teams.get_by_role("listitem")).to_have_count(2)
                teams.screenshot(path=str(ARTIFACTS / "teams-recruiting.png"))
                page.get_by_role("link", name="Ver bases", exact=True).click()
                expect(page).to_have_url(f"{URL}/hackathons/codigo-sin-fronteras#bases")
                navigations = []
                page.on(
                    "framenavigated",
                    lambda frame: navigations.append(frame.url) if frame == page.main_frame else None,
                )
                other_context = browser.new_context(
                    viewport={"width": 390, "height": 844}, reduced_motion="reduce"
                )
                try:
                    catalog_page = browser.new_page()
                    catalog_page.clock.set_fixed_time(CATALOG_DATE)
                    catalog_page.on("pageerror", lambda err: page_errors.append(str(err)))
                    catalog_page.goto(URL, wait_until="domcontentloaded")
                    catalog_page.get_by_role("tab", name="Virtuales").click()
                    catalog_card = catalog_page.get_by_role("link", name="Código sin Fronteras", exact=False)
                    expect(catalog_card.get_by_text("+1 visitante", exact=True)).to_be_visible()
                    other_page = other_context.new_page()
                    other_page.on("pageerror", lambda err: page_errors.append(str(err)))
                    other_page.goto(page.url, wait_until="domcontentloaded")
                    expect(presence.get_by_text("+2 visitantes", exact=True)).to_be_visible()
                    expect(count).to_have_text("0 mirando")
                    expect(cells).to_have_count(0)
                    expect(catalog_card.get_by_text("+2 visitantes", exact=True)).to_be_visible()
                    expect(catalog_card.get_by_text("0 mirando", exact=True)).to_be_visible()
                    expect(catalog_card.locator("[data-filled=true]")).to_have_count(0)
                    clean_capture = "#clerk-components, nextjs-portal { visibility: hidden; }"
                    catalog_card.screenshot(
                        path=str(ARTIFACTS / "catalog-live-viewers.png"),
                        style=clean_capture,
                    )
                    catalog_page.screenshot(
                        path=str(ARTIFACTS / "catalog-desktop.png"), full_page=True, style=clean_capture
                    )
                    presence.screenshot(path=str(ARTIFACTS / "presence-two-viewers.png"))
                    other_presence = other_page.get_by_role("region", name="Presencia en vivo")
                    expect(other_presence.get_by_text("+2 visitantes", exact=True)).to_be_visible()
                    expect(other_presence.locator("[data-filled=false]").first).to_have_css(
                        "transition-property", "none"
                    )
                    other_presence.screenshot(path=str(ARTIFACTS / "presence-mobile.png"))
                    page.screenshot(
                        path=str(ARTIFACTS / "profile-desktop.png"), full_page=True, style=clean_capture
                    )
                    other_page.screenshot(
                        path=str(ARTIFACTS / "profile-mobile.png"), full_page=True, style=clean_capture
                    )
                    other_page.goto("about:blank", wait_until="domcontentloaded")
                    expect(presence.get_by_text("+1 visitante", exact=True)).to_be_visible(timeout=5_000)
                finally:
                    other_context.close()
                expect(cells).to_have_count(0)
                expect(catalog_card.get_by_text("+1 visitante", exact=True)).to_be_visible()
                extra_contexts = []
                try:
                    for _ in range(8):
                        extra_context = browser.new_context()
                        extra_contexts.append(extra_context)
                        extra_context.new_page().goto(page.url, wait_until="domcontentloaded")
                    expect(presence.get_by_text("+9 visitantes", exact=True)).to_be_visible(timeout=20_000)
                    expect(count).to_have_text("0 mirando")
                    expect(cells).to_have_count(0)
                    expect(catalog_card.get_by_text("+9 visitantes", exact=True)).to_be_visible()
                    expect(catalog_card.get_by_text("0 mirando", exact=True)).to_be_visible()
                finally:
                    for extra_context in extra_contexts:
                        extra_context.close()
                expect(presence.get_by_text("+1 visitante", exact=True)).to_be_visible(timeout=20_000)
                assert not navigations, f"Presence updated after navigation: {navigations}"
                presence.screenshot(path=str(ARTIFACTS / "presence-after-close.png"))
            finally:
                # Always keep the screenshot, and never let a failure here hide the real error.
                try:
                    page.screenshot(path=str(ARTIFACTS / "smoke.png"), full_page=True)
                except Exception as err:
                    print(f"smoke: could not save the screenshot: {err}")
        finally:
            browser.close()
    if page_errors:
        print("FAIL: uncaught page errors", *page_errors, sep="\n  ")
        return 1
    print(
        f"PASS: {URL} connected to Convex, filtered events and opened a hackathon profile; "
        "profile and catalog visitors changed 1 → 2 → 1 without filling the account grid; "
        "screenshot at artifacts/smoke.png"
    )
    return 0


def print_log_tail(log, lines=40):
    """Show the end of the dev server log, where the real error usually is."""
    try:
        tail = log.read_text(errors="replace").splitlines()[-lines:]
    except OSError:
        return
    print(f"--- last {len(tail)} lines of {log.relative_to(ROOT)} ---", *tail, sep="\n")


def process_table():
    """{pid: (ppid, start time)} for every process. The start time tells a pid from a reused one."""
    table = {}
    try:
        out = subprocess.run(
            ["ps", "-axo", "pid=,ppid=,lstart="],
            capture_output=True,
            text=True,
            env={**os.environ, "LC_ALL": "C"},
        ).stdout
    except OSError:
        # No ps (slim images): the SIGINT and process group kill still run, only the safety net is lost.
        return table
    for line in out.splitlines():
        fields = line.split(None, 2)
        if len(fields) == 3 and fields[0].isdigit() and fields[1].isdigit():
            table[int(fields[0])] = (int(fields[1]), fields[2].strip())
    return table


def descendants(root_pid):
    """{pid: start time} of every process below root_pid, whatever process group it is in."""
    table = process_table()
    found = {}
    todo = [root_pid]
    while todo:
        parent = todo.pop()
        for pid, (ppid, started) in table.items():
            if ppid == parent and pid not in found:
                found[pid] = started
                todo.append(pid)
    return found


def stop_server(proc, grace=45):
    """SIGINT scripts/dev.mjs, which sends one SIGINT to convex, and
    convex stops `next dev` and the local backend. If that takes longer than grace, SIGKILL the
    process group and every process that was below the dev server when we started, if it is still the
    same process (`next dev` can be in its own group and survive with the port open)."""
    state["phase"] = "stopping"
    if proc.poll() is not None:
        return
    tree = descendants(proc.pid)
    proc.send_signal(signal.SIGINT)
    try:
        proc.wait(timeout=grace)
        return
    except subprocess.TimeoutExpired:
        pass
    print(f"smoke: the dev server ignored SIGINT for {grace}s, killing its process group")
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except OSError:
        pass
    now = process_table()
    for pid, started in tree.items():
        if pid in now and now[pid][1] == started:
            try:
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
    proc.wait()


def wait_for_server(proc, timeout=180):
    """Wait until the port accepts connections. False if the dev server exits first or time runs out."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            return False
        if port_open(PORT):
            return True
        time.sleep(0.5)
    return False


# "start": a signal is remembered until the dev server is running. "run": a signal raises SystemExit so
# the `finally` below stops the server. "stopping": signals are ignored, so a second Ctrl-C cannot
# skip the SIGKILL fallback in stop_server.
state = {"phase": "start", "pending": None}


def on_signal(signum, _frame):
    if state["phase"] == "stopping":
        return
    if state["phase"] == "start":
        state["pending"] = signum
        return
    state["phase"] = "stopping"
    raise SystemExit(128 + signum)


def run_check():
    try:
        return check()
    except Exception as err:
        print(f"FAIL: {type(err).__name__}: {err}")
        return 1


def launch():
    if port_open(PORT):
        if os.environ.get("SMOKE_REUSE") == "1":
            print(f"SMOKE_REUSE=1: testing the server already on port {PORT}")
            return run_check()
        print(
            f"FAIL: port {PORT} is already in use, possibly by another checkout. Stop that server,"
            f" set PORT to a free port, or set SMOKE_REUSE=1 to test the running server."
        )
        return 1
    ARTIFACTS.mkdir(exist_ok=True)
    log = ARTIFACTS / "dev.log"
    # Handlers go in before the server starts, so no signal can arrive while it runs unhandled.
    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, on_signal)
    proc = None
    code = 1
    try:
        # Its own session, so a Ctrl-C at this terminal reaches only this script, which then stops
        # the server once. No stdin: scripts/dev.mjs must not depend on a terminal.
        with log.open("wb") as out:
            proc = subprocess.Popen(
                ["node", str(ROOT / "scripts" / "dev.mjs")],
                cwd=ROOT,
                env={**os.environ, "PORT": str(PORT)},
                stdin=subprocess.DEVNULL,
                stdout=out,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        state["phase"] = "run"
        if state["pending"] is not None:
            on_signal(state["pending"], None)
        if wait_for_server(proc):
            code = run_check()
        else:
            print(f"FAIL: the dev server did not open port {PORT} (exit code {proc.poll()})")
        if code != 0:
            print_log_tail(log)
        return code
    finally:
        if proc is not None:
            stop_server(proc)


def main():
    args = sys.argv[1:]
    if "--bootstrap-only" in args:
        bootstrap(with_deps="--with-deps" in args)
        sys.exit(0)
    if not in_venv():
        bootstrap()
        os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), __file__, *args])
    sys.exit(launch())


if __name__ == "__main__":
    main()
