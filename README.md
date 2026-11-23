# Hackerspace

Hackerspace será un lugar para descubrir hackathones presenciales y virtuales, encontrar o formar equipo y explorar una galería de proyectos. La idea es que se sienta en vivo: por ejemplo, podrás ver quién más está mirando una hackathon.

Un Scout usará Firecrawl para encontrar eventos y crear perfiles con sus bases y reglas cuando no existan. Los agentes de los usuarios podrán usar la mayoría de las funciones vía MCP o API, con límites de uso.

Este arranque prepara Next.js, Convex y Clerk. Las funcionalidades de producto todavía no están implementadas.

## Desarrollo local

```
pnpm install    # Node 22.12+, pnpm 11.22.0
pnpm dev        # http://localhost:3000, sin cuentas de Convex ni Clerk
pnpm lint
pnpm typecheck
pnpm test       # Vitest
pnpm smoke      # Playwright; inicia el servidor si no está corriendo
```

`pnpm smoke` requiere Python 3 e instala Chromium en el primer arranque. Con el servidor ya iniciado, usa `SMOKE_REUSE=1 pnpm smoke`. Si usas Claude Code, ejecuta `pnpm skills:link` una vez para enlazar las skills.

- [`AGENTS.md`](AGENTS.md): stack, comandos y skills por fase.
- [`GLOSSARY.md`](GLOSSARY.md): vocabulario del producto.
- [`docs/capy.md`](docs/capy.md): configuración de Capy.
- [`docs/skills.md`](docs/skills.md): catálogo completo de skills.
