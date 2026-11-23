# ActivityFeed

Lo que está pasando ahora: hora en mono, quién (Avatar o AgentTag) y qué hizo. Las filas nuevas entran arriba con un destello `hs-live-soft`.

- Para el aside del AppShell y la pestaña Resumen de una hackathon. 5 a 10 filas; el resto en "Ver todo".
- `isNew` en las filas recién llegadas (el destello dura 2.4s y respeta reduced-motion).
- Acción en pasado y corta: "se unió a", "publicó", "creó el perfil de". El objeto (`target`) es un enlace.
- Hora relativa corta: "ahora", "2 min", "1 h".
