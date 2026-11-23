# Hackerspace

Hackerspace helps people discover in-person and virtual hackathons, form or find teams, and explore a project gallery. The experience should be live, including presence that shows who is viewing a hackathon. An AI Scout will use Firecrawl to find events and create missing hackathon profiles with their official guidelines and rules. Users' agents should be able to use most site features through MCP or an API, subject to rate limits.

Use the vocabulary in [`GLOSSARY.md`](GLOSSARY.md): code, identifiers, and file names in English; UI copy in Spanish.

The bootstrap runs on a fresh clone and includes 100+ skills in `.agents/skills/` (catalog and limits: `docs/skills.md`). In [Capy](https://capy.ai), a Captain coordinates agent threads; pick skills with `$`.

## Stack and commands

Next.js 16 (App Router, Turbopack), Convex, Clerk, Tailwind 4, [UI SDK](https://ui-sdk.dev) (`@ui-sdk/react` + `@ui-sdk/core`, beta), Vercel AI SDK with OpenRouter, Biome, TypeScript, and Vitest. pnpm 11.22.0 only, never npm for project deps. Node 22.12+.

| Command | What it does |
| --- | --- |
| `pnpm install` | Install deps. The hardened pnpm config lives in `pnpm-workspace.yaml`; see Rules. |
| `pnpm dev` | Seeds empty Convex tables, then Convex plus Next.js on http://localhost:3000. Anonymous local Convex unless you switched to real accounts. `DEV_SEED=0` skips seeding. To stop one running in the background, send SIGINT to the `scripts/dev.mjs` process (`pkill -INT -f scripts/dev.mjs`): on Linux a signal sent to `pnpm` does not reach it, and other signals can leave `next dev` and the Convex backend running. |
| `pnpm dev:cloud` | Plain `convex dev --start 'next dev'`: no seed, and it does not force anonymous mode (Convex itself picks an anonymous deployment when you are not logged in or stdin is not a TTY). Needs `npx convex login`, which a human runs. |
| `pnpm lint`, `pnpm format` | `biome check .`, `biome check --write .`. Markdown is not linted. |
| `pnpm typecheck`, `pnpm build` | `next typegen` and `tsc --noEmit`; build runs both before `next build`. `pnpm start` serves the build and needs `NEXT_PUBLIC_CONVEX_URL`. |
| `pnpm test` | Runs the Vitest suite with a local Convex test harness (no accounts or credentials). |
| `pnpm seed`, `pnpm seed:reset`, `pnpm migrate` | `convex run seed:ensure` (idempotent), a wipe plus reseed (local deployments only), and `convex run migrations:runAll`. They talk to the running deployment, so start `pnpm dev` first. |
| `pnpm smoke` | Playwright smoke test. Starts `pnpm dev` itself, bootstraps `.venv` and Chromium on first run, saves `artifacts/smoke.png` and `artifacts/dev.log`. With a server already running: `SMOKE_REUSE=1 pnpm smoke`. `PORT` changes the port. |
| `pnpm browser:install` | Download Chrome for `agent-browser`. |
| `pnpm skills:sync [ids] [--update]` | Install or refresh vendored skills from `scripts/skills/sources.json` (staged, prunes orphans, regenerates `docs/skills.md`). |
| `pnpm skills:check` | Validate skill names and frontmatter, the lock, content hashes (a hand-edited vendored skill fails), no symlinks, and that `docs/skills.md` is fresh. |
| `pnpm skills:link` | Claude Code only: symlink `.agents/skills` into `.claude/skills` (gitignored). |

Code lives in `app/` (UI), `components/`, and `convex/` (backend). Before touching `convex/`, read `convex/_generated/ai/guidelines.md`.

## UI: UI SDK primitives, your design system

The UI uses [UI SDK](https://ui-sdk.dev) (Vercel): unstyled, accessible primitives built from behaviors (focus, keyboard, selection, popups, ARIA). There is no shadcn and no component kit. Each team's agents design the system on top of the primitives.

- Before using UI SDK, follow `$ui-sdk` and read `node_modules/@ui-sdk/react/docs/llms.txt`, then only the component pages you need. To build a component it does not ship, search `node_modules/@ui-sdk/react/docs/core.md` by heading (it is large) and read `rendering.md` next to it.
- Import each component from its entry (`@ui-sdk/react/button`), never from a package root. Components already say `"use client"`, so server components can render them.
- Use a UI SDK component wherever one exists (Button, Dialog, Select, Field...). Do not hand-roll `role=` widgets.
- `app/globals.css` declares `@layer ui-sdk;` above Tailwind and imports `@ui-sdk/core/web.css` (the default look) into `layer(components)`. Keep that order.
- `web.css` also restyles bare `a`, `code`, `hr` and `kbd` app-wide, and gives buttons a filled look with `data-variant="solid"` (a `web.css` hook, not a component prop; its sizes and icons are only written down in `node_modules/@ui-sdk/core/dist/web.css`).
- Tokens live in `app/tokens.css`: neutral `--ui-*` placeholders at UI SDK's defaults (except `--ui-ring`, raised to 3:1 so keyboard focus shows), mapped to Tailwind colors (`bg-muted`, `text-muted-foreground`, `border-border`) in `globals.css`. The design system starts there: set the team's palette, type, radius and spacing with `$frontend-design`, then style parts by `data-slot` and state attributes (`data-pressed`, `data-open`). Check contrast in a real browser.
- The packages are pinned to `0.1.0-beta.7`, the newest beta past `minimumReleaseAge` on 2026-11-20. Bump `@ui-sdk/react`, `@ui-sdk/core` and the `ui-sdk` skill commit in `scripts/skills/sources.json` together.

Convex conventions (details in the file headers):

- New table in `convex/schema.ts`: add its seeder in `convex/seed.ts`. `pnpm typecheck` fails until every table has one.
- Destructive schema change or backfill: write a migration in `convex/migrations.ts`, add it to `runAll`, run `pnpm migrate`.
- Components: `@convex-dev/migrations`, `@convex-dev/rate-limiter`, `@convex-dev/presence`, and `@convex-dev/workpool` mounted as `backgroundWork` (see `convex/jobs.ts`).

Smoke checks the home page's `h1` ("Hackathones cerca de ti"), waits for the browser's Convex health query to resolve, and opens a sample hackathon from the catalog. Update `check()` in `scripts/smoke.py` in the same PR if these conditions change.

## Local dev with no accounts

`pnpm dev` needs no Convex or Clerk login.

- **Convex.** A local deployment runs as a subprocess of `convex dev` (`CONVEX_AGENT_MODE=anonymous`, set by `scripts/dev.mjs`). State is in `.convex/` and `.env.local`, both gitignored. `pnpm dev` stays anonymous unless `CONVEX_DEPLOY_KEY` or `CONVEX_DEPLOYMENT_TOKEN` is set, or `.env.local` or `.env` selects a deployment (`CONVEX_DEPLOYMENT=` that does not start with `anonymous:`, or `CONVEX_SELF_HOSTED_*`). In anonymous mode every Convex deployment variable is removed from the children's environment, and cloud mode refuses a production key or deployment (`pnpm dev` pushes and seeds).
- **Clerk.** The SDK is pinned to 7.7.9 for automatic keyless mode, which provisions temporary dev keys on first load outside CI. The prompt "Configure your application" is expected.
- `pnpm dev` sets `CLERK_JWT_ISSUER_DOMAIN` to the Hackerspace Clerk development issuer on anonymous Convex deployments before pushing. Keyless sessions are signed out in Convex unless their issuer and audience match the configured provider.

### Switch to real accounts (a human does this once)

1. `npx convex login`, then point `.env.local` at a cloud dev deployment: use `npx convex init` to set up a new project without pushing, or `npx convex deployment select dev` for an existing one. `pnpm dev` detects the non-anonymous `.env.local` by itself.
2. Use the Hackerspace Clerk development instance, or claim a separate instance from the "Configure your application" prompt (or the claim link in the `pnpm dev` log).
3. For a separate instance, activate the Convex integration in its Clerk Dashboard and copy the Frontend API URL (the session token issuer).
4. With your dev deployment selected, run `npx convex env set CLERK_JWT_ISSUER_DOMAIN <Clerk Frontend API URL>`. Set it on the Convex deployment, not in `.env.local`. `convex/auth.config.ts` reads this variable and expects the audience `convex`. For production and previews, see [the deploy guide](docs/deploy.md).
5. Configure the Clerk keys for the same instance. On Capy, use the project variables (`docs/capy.md`).

Convex Auth is the account-free alternative to Clerk. Clerk stays the default here.

## Tickets

Local Markdown tracker, committed so teammates see them: `.scratch/<feature>/spec.md` and `.scratch/<feature>/issues/NN-<slug>.md`. `$to-tickets` writes them and mirrors each to the available tracker. Conventions and tracker order: `docs/agents/issue-tracker.md`. Do not add `.scratch/` to `.gitignore`.

## Rules

- No merge, deploy, publish, or `npx convex deploy` without a human.
- No claiming the Clerk app and no `npx convex login` from an agent.
- Do not hand-edit vendored skills in `.agents/`, `skills-lock.json`, or `licenses/`: `pnpm skills:check` fails on drift. Change `scripts/skills/sources.json`, then `pnpm skills:sync`. The first-party `toolbox` skills (`harness-map`, `subagent-routing`, `git-conventions`) are the exception and are edited in place.
- Do not disable pnpm's security settings (in `pnpm-workspace.yaml`). Fix a failing install by pinning an older version or adding a documented exception there.
- Commits, branches and PR bodies follow `$git-conventions`. Before a PR, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm smoke` pass. Open a PR for each ticket with `$file-pr`. Keep changes small.
- Subagents and model choices follow `$subagent-routing`: defaults are in its editable table, effort `high`.
- When a skill names a tool you do not have, use `$harness-map`.

## Phase to skill

| Phase | Skills |
| --- | --- |
| Plan | `$gstack` (then its `/office-hours` or `/autoplan` workflow), `$how` |
| Tickets | `$to-tickets`. The Captain fans out with `$dispatching-parallel-agents`. |
| Implement | `$poteto-mode` (Feature playbook), `$tdd`, `$ponytail`. For the stack: `$convex`, `$clerk-nextjs-patterns`, `$ai-sdk`, `$ui-sdk`. |
| Design | UI SDK primitives (`$ui-sdk`) plus `$frontend-design` for the design system (tokens in `app/tokens.css`). Capy built-in: `$make-a-prototype`. |
| QA | `$webapp-testing` (run its scripts with `.venv/bin/python`; `pnpm smoke` creates it), `$agent-browser` (outside Capy run `pnpm exec agent-browser`; on Capy `initialize` writes a wrapper script at `~/.local/bin/agent-browser`, UNCONFIRMED on a real Capy VM), `$ponytail-review`. gstack `/qa` through `$gstack`. |
| Before review | `$deslop`, then `$make-pr-easy-to-review` |
| Review | `$thermo-nuclear-code-quality-review` as the maintainability lens, seats and models per `$subagent-routing` |
| PR | `$git-conventions` (commits, PR body, evidence; template in `.github/pull_request_template.md`), `$file-pr`, `$babysit-pr` |
| Hand off a feature | The giver runs `$poteto-mode` "Pause safely". The receiver runs `$takeover`. |

Capy machine setup is `.capy/setup.json`. Human-only Capy steps: `docs/capy.md`.

## Use outside Capy

- T3 Code, Codex, Cursor and Gemini/Antigravity read `.agents/skills` directly.
- Claude Code needs `pnpm skills:link` once.
- Setup: `pnpm install`, then `pnpm smoke` (bootstraps `.venv` and Chromium), and `pnpm browser:install` for `agent-browser`.
- gstack is Capy-oriented: its installer writes into `$HOME`. Do not run it on a laptop unless you mean to.
- Tool names differ per harness: `$harness-map`.

<!-- convex-ai-start -->
Always read `convex/_generated/ai/guidelines.md` before writing Convex code. It overrides what you may remember about Convex APIs.
<!-- convex-ai-end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
