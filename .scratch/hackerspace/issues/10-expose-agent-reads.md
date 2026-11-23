# 10: Dar acceso de lectura a agentes de usuarios

Status: open
Checkpoint: 5. Agentes de usuarios
Bloqueado por: [06](06-publish-projects.md), que se apoya en el catálogo y los equipos.

Exponer una API versionada para descubrir hackathones, ver sus perfiles, consultar equipos y explorar proyectos desde un cliente externo.

- [ ] Una cuenta emite y revoca una clave de lectura. El secreto se muestra una vez. Una clave vencida o revocada se rechaza.
- [ ] Un cliente externo puede consultar y paginar datos de las tres áreas. No obtiene la presencia identificable ni datos privados, incluso con una clave válida.
- [ ] Probar rechazo por falta de permiso y agotamiento de cuota por titular y operación. Dos claves del mismo titular no duplican la cuota. Registrar resultados en una auditoría sin secretos.
