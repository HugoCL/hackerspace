# Plan de Hackerspace

Una persona descubre una hackathon, ve quién más está mirando su perfil, encuentra equipo y puede compartir lo que construyó. La primera entrega prioriza eventos presenciales. Los eventos virtuales siguen disponibles mediante un filtro. El Scout amplía el catálogo con fuentes oficiales. Los agentes de usuarios pueden realizar las operaciones habituales sin controlar el navegador, con los mismos permisos que sus titulares y límites propios.

## Checkpoints

| Checkpoint | Qué validar antes de ampliar el alcance | Tickets |
| --- | --- | --- |
| 0. Componentes y prototipo | Revisar el diseño de Claude integrado en `main` como referencia en `design-system/`. Mostrar el recorrido catálogo → perfil en móvil y escritorio. Validar con Hugo el estilo y la información visible. | [01](issues/01-review-merged-components.md) |
| 1. Descubrimiento en vivo | Encontrar un evento presencial, activar el filtro virtual y leer sus bases y reglas. Abrir el perfil en dos sesiones y comprobar entradas y salidas sin recargar. | [02](issues/02-browse-hackathons.md), [03](issues/03-show-live-presence.md) |
| 2. Equipos | Una persona crea un equipo. Otra lo encuentra, solicita ingreso y ve el resultado sin recargar. | [04](issues/04-find-and-create-teams.md), [05](issues/05-join-teams.md) |
| 3. Galería | Publicar un proyecto asociado a una hackathon y encontrarlo como visitante. Validar la presentación y la atribución a participantes. | [06](issues/06-publish-projects.md) |
| 4. Scout | Revisar un candidato de Firecrawl con enlaces oficiales. Aprobarlo para crear un perfil, rechazar otro y repetir la ejecución para comprobar que no crea duplicados. Habilitar la búsqueda periódica tras validar la cola y acordar su presupuesto. | [07](issues/07-collect-scout-candidates.md), [08](issues/08-review-scout-candidates.md), [09](issues/09-schedule-scout-runs.md) |
| 5. Agentes de usuarios | En un cliente externo, buscar eventos y equipos con una clave de lectura, después solicitar ingreso o publicar un proyecto con una clave autorizada. Completar las operaciones cotidianas de los titulares. Demostrar revocación, cuota y rechazo de acciones ajenas. | [10](issues/10-expose-agent-reads.md), [11](issues/11-expose-scoped-agent-writes.md), [12](issues/12-expose-agent-owner-operations.md) |

Los tickets declaran sus dependencias técnicas. Scout puede avanzar con datos de prueba una vez listo el catálogo. La API de lectura puede avanzar en paralelo tras quedar disponibles las consultas de las áreas que expone.

## Modelo de datos propuesto

Los identificadores de tablas, campos e índices están en inglés. En los índices compuestos, el orden de la lista es el orden de los campos. Los índices de Convex no imponen unicidad: verificar e insertar en una misma mutación para las claves que deben ser únicas. Agregar un seeder al introducir una tabla; usar migraciones para backfills y cambios destructivos.

| Tabla | Campos y relaciones principales | Índices para las consultas previstas |
| --- | --- | --- |
| `users` | `identityKey` a partir de la identidad verificada, `displayName`, `avatarUrl?`. No exponer identificadores de Clerk ni correo. | `by_identityKey` para localizar la cuenta. |
| `hackathons` | `slug`, `canonicalEventKey`, `title`, `organizerName`, `modality` (`inPerson`, `virtual`, `hybrid`), `city?`, `country?`, `startsAt`, `endsAt?`, `timeZone?`, `officialUrl`, `eventGuidelines?`, `rules?`, `provenance?`. La tabla contiene perfiles publicados. | `by_slug`, `by_modality_startsAt`, `by_canonicalEventKey` para una edición, e índice de búsqueda de `title` con filtro de `modality`. Las ediciones anuales pueden compartir un sitio oficial. |
| `teams` | `hackathonId`, `ownerId`, `name`, `description`, `rolesWanted`, `recruitingStatus`. | `by_hackathonId_recruitingStatus`, `by_ownerId`. |
| `teamMembers` | `teamId`, `userId`, `joinedAt`. El equipo guarda el titular; esta tabla contiene a los miembros, incluido el titular. | `by_teamId_userId`, `by_userId`. |
| `teamJoinRequests` | `teamId`, `requesterId`, `message?`, `status` (`pending`, `accepted`, `rejected`), `decidedAt?`, `decidedBy?`. | `by_teamId_status`, `by_teamId_requesterId`, `by_requesterId`. Solo una solicitud pendiente por persona y equipo. |
| `projects` | `hackathonId`, `teamId?`, `authorId`, `title`, `description`, `links`, `publishedAt`. El equipo, si existe, pertenece a la misma hackathon. | `by_publishedAt`, `by_hackathonId_publishedAt`, `by_authorId`. |
| `scoutCandidates` | `canonicalEventKey`, `reviewStatus` (`pending`, `approved`, `rejected`), campos propuestos, `provenance`, `discoveredAt`, `lastSeenAt`, `reviewedBy?`, `reviewedAt?`, `hackathonId?`. | `by_canonicalEventKey`, `by_reviewStatus_discoveredAt`. |
| `scoutRuns` | `runKey`, `status` (`queued`, `running`, `completed`, `failed`), `startedAt?`, `finishedAt?`, conteos de fuentes y candidatos, `errorCode?`. | `by_runKey` para evitar encolar dos veces el mismo turno, `by_status_startedAt` para operación. |
| `agentKeys` | `ownerId`, `keyDigest`, `label`, `scopes`, `createdAt`, `expiresAt`, `revokedAt?`. Mostrar el secreto una vez; guardar solo su digest. | `by_keyDigest`, `by_ownerId`. |
| `agentAuditEvents` | `keyId?`, `actorId?`, `operation`, `resourceId?`, `outcome`, `occurredAt`, `requestId`. No incluir secretos, cuerpos de peticiones ni datos privados del usuario. | `by_actorId_occurredAt`, `by_keyId_occurredAt`. |
| `agentWriteRequests` | `actorId`, `operation`, `idempotencyKey`, `inputDigest`, `resourceId`, `expiresAt`. Guardar el resultado de creación en la misma mutación que el recurso. | `by_actorId_operation_idempotencyKey`, `by_expiresAt`. |

### Presencia

Una sala por evento: `hackathon:<hackathonId>`. Usar el componente Convex Presence, sin duplicar sus tablas de sesiones o latidos. Cada pestaña tiene su propia sesión. El servidor deriva la identidad de la sesión de Clerk o emite un identificador anónimo temporal. No acepta un ID de usuario arbitrario para registrar presencia.

Los visitantes ven solo el conteo. Las personas que iniciaron sesión ven nombres y caras de otras cuentas presentes; los visitantes anónimos cuentan, pero no tienen identidad visible. Contar una cuenta una sola vez aunque abra varias pestañas. Una salida limpia termina esa sesión; los latidos vencidos cubren una pérdida de conexión. La consulta para visitantes devuelve solo un agregado, no una lista que el navegador oculta. No exponer presencia identificable por la API de agentes.

### Procedencia del Scout

`provenance` vincula cada campo extraído con su `sourceUrl`, `retrievedAt` y, si hay evidencia textual, un `evidenceExcerpt` breve. Registrar `discoveredFromUrl` cuando el enlace usado para descubrir el evento difiera de la fuente oficial. Identificar la edición mediante URL oficial normalizada y fecha de inicio, o mediante un identificador de edición que publique el organizador. Enviar coincidencias dudosas a revisión, sin publicar ni sobrescribir un perfil existente.

Firecrawl obtiene contenido externo. Tratarlo como datos, limitar la entrada a páginas públicas y validar la salida estructurada antes de escribir. Los campos sin respaldo quedan sin dato; no generar bases o reglas. Solo una aprobación humana crea el perfil. El servidor autoriza a un grupo explícito de revisores; ese permiso no se delega. Al aprobar, la mutación verifica nuevamente que no exista esa edición y copia la procedencia.

### Acceso para agentes

Comenzar con una API versionada de lectura y ampliar a escrituras específicas. Completar los flujos de equipos y proyectos que el titular ya puede hacer en la web. Un adaptador MCP posterior puede llamar las mismas operaciones si se necesita para los clientes elegidos; no requiere otro modelo de permisos. Las claves delegadas vencen, son revocables y tienen permisos explícitos. Verificar identidad, cuota por titular y operación, y acceso al recurso en el servidor. Reutilizar las reglas de negocio de la web para que una clave no amplíe los permisos de su titular. No exponer acciones administrativas, emisión de claves ni la cola del Scout.

## Verificación y alcance

`pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm smoke` son los controles previos a PR. Cada ticket incluye su comprobación de producto. Si la nueva portada cambia el encabezado o deja de mostrar el estado de conexión, actualizar la comprobación de Playwright al mismo tiempo. Las pruebas de backend deben cubrir permisos y datos entre cuentas; la presencia requiere dos sesiones reales del navegador. Scout usa respuestas guardadas de Firecrawl en pruebas y una prueba de integración autorizada para el servicio real.

El arranque local sigue sin requerir cuentas. Validar Clerk con un entorno de desarrollo configurado por una persona antes de aceptar la demo de identidades reales. No se incluye chat ni replicar las funciones de Devpost fuera de este recorrido.
