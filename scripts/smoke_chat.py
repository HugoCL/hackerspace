import time
from uuid import uuid4

from playwright.sync_api import expect


def sign_in(page, identifier):
    page.wait_for_function("window.Clerk?.loaded && !!window.Clerk.client")
    status = page.evaluate(
        """async (identifier) => {
            const clerk = window.Clerk;
            const signIn = await clerk.client.signIn.create({ identifier });
            const factor = signIn.supportedFirstFactors?.find((item) => item.strategy === "email_code");
            if (!factor) return "missing email code factor";
            await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
            const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: "424242" });
            if (result.status === "complete") await clerk.setActive({ session: result.createdSessionId });
            return result.status;
        }""",
        identifier,
    )
    assert status == "complete", f"Clerk test sign-in did not complete: {status}"
    expect(page.get_by_role("button", name="Crear equipo")).to_be_visible()


def check_chat(browser, url, owner_identifier, applicant_identifier):
    owner_context = browser.new_context(viewport={"width": 390, "height": 530})
    applicant_context = browser.new_context()
    try:
        owner = owner_context.new_page()
        applicant = applicant_context.new_page()
        for page, identifier in [(owner, owner_identifier), (applicant, applicant_identifier)]:
            page.goto(f"{url}/hackathons/santiago-hacks?tab=equipos")
            sign_in(page, identifier)

        presence = owner.get_by_role("region", name="Presencia en vivo")
        pill = presence.get_by_role("button", name="Ver quién está mirando")
        expect(pill.locator(".hs-avatar")).to_have_count(2)
        expect(pill.locator("button")).to_have_count(0)
        expect(presence.get_by_role("status").get_by_role("button")).to_have_count(0)
        pill.press("Enter")
        roster = owner.get_by_role("dialog", name="Personas mirando")
        expect(roster.get_by_role("listitem")).to_have_count(2)
        owner.keyboard.press("Escape")
        expect(pill).to_be_focused()

        team_name = f"Equipo de prueba {uuid4().hex[:8]}"
        owner.get_by_role("button", name="Crear equipo").click()
        form = owner.get_by_role("form", name="Crear equipo")
        form.get_by_role("textbox", name="Nombre del equipo").fill(team_name)
        form.get_by_role("textbox", name="Descripción").fill("Equipo de prueba del chat.")
        form.get_by_role("textbox", name="Qué buscan").fill("Alguien que disfrute contar historias.")
        form.get_by_role("button", name="Publicar equipo").click()

        def card(page):
            return page.locator(".hs-tcard").filter(has=page.get_by_role("heading", name=team_name, exact=True))

        card(applicant).get_by_role("button", name="Conversar", exact=True).click()
        applicant_chat = applicant.get_by_role("dialog", name=team_name)
        owner_chat = owner.get_by_role("dialog", name=team_name)

        def send(dialog, number):
            composer = dialog.get_by_role("textbox", name="Mensaje")
            composer.fill(f"Mensaje de prueba {number:02d}")
            composer.press("Enter")
            expect(composer).to_have_value("")

        send(applicant_chat, 1)
        inbox = card(owner).get_by_role("button", name="Conversaciones (1)", exact=True)
        inbox.press("Enter")
        row = owner_chat.get_by_role("button").filter(has_text="Mensaje de prueba 01")
        row.press("Enter")
        back = owner_chat.get_by_role("button", name="Volver a conversaciones")
        expect(back).to_be_focused()
        back.press("Enter")
        expect(row).to_be_focused()
        row.press("Enter")
        expect(back).to_be_focused()

        for number in range(2, 22):
            if number in (17, 19, 21):
                time.sleep(3.1)
            send(owner_chat if number % 2 == 0 else applicant_chat, number)

        history = owner_chat.get_by_role("region", name="Historial de mensajes")
        items = history.get_by_role("listitem")
        expect(items).to_have_count(20)
        expect(owner_chat).to_have_css("overflow-y", "clip")
        expect(history).to_have_css("overflow-y", "auto")
        history.evaluate("el => el.scrollTop = 0")
        earlier = history.get_by_role("button", name="Ver mensajes anteriores")
        expect(earlier).to_be_in_viewport()
        earlier.click()
        expect(items).to_have_count(21)
        expect(history.get_by_text("Mensaje de prueba 01", exact=True)).to_be_visible()

        time.sleep(3.1)
        history.evaluate("el => el.scrollTop = 0")
        send(applicant_chat, 22)
        newest = history.get_by_text("Mensaje de prueba 22", exact=True)
        unread = owner_chat.get_by_role("button", name="Nuevos mensajes ↓")
        expect(unread).to_be_visible()
        expect(newest).not_to_be_in_viewport()
        unread.click()
        expect(newest).to_be_in_viewport()
        expect(unread).to_have_count(0)
        owner.keyboard.press("Escape")
        expect(inbox).to_be_focused()
        print("PASS: Clerk avatar stack; inbox and thread keyboard focus; a single scroll area; history pagination and new-message button")
    finally:
        applicant_context.close()
        owner_context.close()
