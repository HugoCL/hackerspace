# 01: Revisar los componentes integrados

Status: in-progress
Checkpoint: 0. Componentes y prototipo
Bloqueado por: ninguno. El trabajo de Claude se integró en `main` en `b329bb9`.

Probar el recorrido catálogo → perfil con datos de muestra. Revisar primero los componentes y pantallas de referencia de `design-system/` para no duplicar decisiones de diseño.

- [x] Registrar el commit de `main` revisado y qué componentes, tokens y estados se pueden reutilizar.
- [x] Mostrar el catálogo y un perfil de hackathon en móvil y escritorio. Incluir un evento presencial y uno virtual.
- [ ] Hugo valida la dirección visual y el contenido prioritario. Registrar los cambios acordados antes de implementar el catálogo.

## Comments

Referencia revisada en `cc9fde1`, que incluye el diseño de Claude de `b329bb9`. El prototipo reutiliza los tokens, las clases de AppShell, PageHeader, HackathonCard, Badge y EmptyState, y adapta la composición de Cover. Usa UI SDK para la búsqueda y las pestañas. No muestra PresencePill, Countdown ni ActivityFeed porque no hay datos en vivo en este checkpoint.
