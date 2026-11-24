# 08: Revisar candidatos y crear perfiles

Status: open
Checkpoint: 4. Scout
Bloqueado por: [07](07-collect-scout-candidates.md) y [03](03-show-live-presence.md), por la identidad necesaria para autorizar y registrar la revisión.

Permitir que una persona revisora consulte la cola, contraste las fuentes oficiales y decida si corresponde crear el perfil.

- [ ] La cola muestra datos propuestos, campos faltantes y fuentes. Solo las cuentas revisoras autorizadas pueden consultarla, aprobar o rechazar.
- [x] Aprobar crea un perfil visible con procedencia, registra la decisión y vincula ambos registros. Rechazar registra la decisión sin publicar.
- [ ] Probar aprobaciones repetidas y dos revisiones de la misma edición. Solo se crea un perfil. Demostrar ambos desenlaces con la cola y acordar el criterio humano de publicación antes de automatizar la búsqueda periódica.

## Criterio de publicación

Aprobar un candidato solo si se cumple todo lo siguiente:

- La URL oficial pertenece a quien organiza el evento, no a un agregador, una nota de prensa ni una red social de terceros.
- Es un único evento de construcción con fecha, en Chile, que todavía no termina.
- Las bases y reglas coinciden con la fuente o quedan vacías. Nunca se escriben a mano.

- [x] Criterio confirmado con Hugo (2026-11-23).

Pendiente: mostrar ambos desenlaces en `/scout` con una sesión de revisor iniciada en el navegador. Clerk pidió un desafío de Cloudflare al registrar una cuenta de prueba, así que esa demostración queda para una persona.
