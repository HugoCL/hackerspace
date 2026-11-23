# 03: Mostrar quién mira una hackathon en vivo

Status: open
Checkpoint: 1. Descubrimiento en vivo
Bloqueado por: [02](02-browse-hackathons.md).

Mostrar presencia en el perfil con Convex Presence y una sala por hackathon. Vincular las cuentas a la identidad de Clerk validada por Convex.

- [ ] Con dos sesiones del navegador, abrir y cerrar el perfil actualiza la presencia sin recargar. También se elimina una sesión que deja de enviar latidos.
- [ ] Una cuenta con dos pestañas cuenta una vez. Las salas de eventos distintos no se mezclan.
- [ ] La respuesta para visitantes solo contiene el conteo. Una persona autenticada ve caras y nombres de las cuentas presentes, sin correo ni identidad de visitantes anónimos.
- [ ] Probar que un cliente no puede registrar la identidad de otra cuenta. Demostrar las identidades reales en un entorno de desarrollo con Clerk configurado por una persona.
