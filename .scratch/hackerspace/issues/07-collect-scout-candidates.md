# 07: Descubrir candidatos con Firecrawl

Status: closed (PR #12)
Checkpoint: 4. Scout
Bloqueado por: [02](02-browse-hackathons.md).

Ejecutar el Scout internamente. Limitar la concurrencia con Workpool y guardar candidatos sin exponerlos en el catálogo.

- [x] Firecrawl obtiene fuentes públicas. El Scout guarda campos validados y la URL oficial, fecha de consulta y evidencia por campo. Si no encuentra las bases o reglas, deja el dato sin completar.
- [x] Una nueva observación de la misma edición actualiza el candidato pendiente sin duplicarlo. Un perfil publicado no se sobrescribe. Una coincidencia dudosa queda para revisión.
- [x] Probar, con respuestas guardadas de Firecrawl, un candidato válido, otro incompleto, un duplicado y una fuente fallida. El fallo no publica ni altera perfiles.
