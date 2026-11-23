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

Si ya tienes equipos con roles, sincroniza primero este esquema compatible con ambos formatos y luego ejecuta `pnpm migrate` en ese mismo entorno. Hasta que termine, el listado muestra los roles anteriores, pero la búsqueda solo encuentra equipos ya migrados. Elimina los campos anteriores del esquema únicamente después de verificar que la migración terminó en todos los entornos que se vayan a actualizar.

La misma migración rellena el contador de integrantes de los equipos existentes. Al iniciar en Convex anónimo local o en un despliegue dev, `pnpm dev` siembra los datos y espera a que terminen las migraciones pendientes. `DEV_SEED=0` omite ambos pasos. El listado omite el contador de un equipo hasta que se haya rellenado, en lugar de consultar su membresía. Haz obligatorio `memberCount` en el esquema solo después de verificar que el backfill terminó en cada entorno que se vaya a actualizar.

- [`AGENTS.md`](AGENTS.md): stack, comandos y skills por fase.
- [`GLOSSARY.md`](GLOSSARY.md): vocabulario del producto.
- [`design-system/`](design-system/README.md): marca, tokens (`tokens.json`, `tokens.css`), guías de layouts y vistas, y 23 componentes de referencia con su preview.
- [`docs/capy.md`](docs/capy.md): configuración de Capy.
- [`docs/skills.md`](docs/skills.md): catálogo completo de skills.
