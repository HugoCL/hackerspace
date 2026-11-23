# 11: Permitir escrituras acotadas a agentes de usuarios

Status: open
Checkpoint: 5. Agentes de usuarios
Bloqueado por: [10](10-expose-agent-reads.md) y [05](05-join-teams.md).

Ampliar la API con permisos de escritura explícitos para crear equipos, solicitar ingreso y publicar proyectos en nombre de la cuenta titular.

- [ ] Una clave de lectura no puede escribir. Una clave con un permiso de escritura no habilita las demás operaciones.
- [ ] Las escrituras pasan por las mismas reglas de negocio que la web. Probar una solicitud de ingreso y una publicación desde un cliente externo, junto a rechazos por recursos ajenos y atribución indebida.
- [ ] Reintentar una escritura con la misma clave de idempotencia no crea datos duplicados. La auditoría atribuye la operación y su resultado al titular y a su clave.
- [ ] Documentar las operaciones, los permisos y la recuperación ante errores. Ninguna clave expone acciones administrativas ni el Scout.
