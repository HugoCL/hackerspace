# HackathonCard

Una hackathon en un listado: modalidad, quién está viendo, nombre, fecha y lugar, temas, cuántos equipos buscan gente y, si el perfil lo creó el scout, su AgentTag.

- Orden de lectura fijo: modalidad → nombre → cuándo/dónde → de qué trata → lo social.
- `viewers` muestra un PresencePill compacto solo si es > 0.
- `description` se corta a 2 líneas; `tags` hasta 3.
- `source` (p. ej. `"scout"`) cuando el perfil no lo creó un organizador ni una persona.
- En Grid con `min={280}`.
