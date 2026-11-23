# PageHeader

El encabezado de cada vista: un eyebrow opcional, el título en display, una descripción breve, metadatos y las acciones de la página.

- **Título**: un sustantivo o el nombre de la cosa ("Santiago Hacks 2027", "Equipos buscando gente"). Nunca una pregunta.
- **Eyebrow**: contexto en texto pequeño: la sección o el estado en vivo (`PresencePill`, `Countdown`, `AgentTag` si el perfil lo creó el scout).
- **Meta**: fecha, lugar, modalidad. Con íconos `calendar`, `pin`, `globe`.
- **Acciones**: máximo una `primary` (o una `signal` si es *el* llamado de la página, como "Busco equipo") más secundarias.
- Uno por vista, siempre debajo del AppShell y antes de la primera Section.
