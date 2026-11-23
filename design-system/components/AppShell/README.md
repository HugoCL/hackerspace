# AppShell

El marco de toda vista: barra superior con el nombre, navegación principal y acciones, y un cuerpo de 1200px como máximo con columna lateral opcional.

## Cuándo usarlo
- Una vez por página, en la raíz. Todas las vistas (Explorar, perfil de hackathon, equipos, galería, perfil de usuario) viven dentro.
- `aside` solo cuando el contenido lateral es **vivo o de contexto** (quién está viendo, feed de actividad, tu equipo). Bajo 900px el aside cae debajo del contenido principal.
- `banner` para un aviso global en vivo ("● SANTIAGO HACKS COMIENZA EN 02:14:09"). Uno a la vez.

## Navegación
Orden recomendado: **Explorar · Equipos · Proyectos · Mis hackathones**. `count` en la nav solo para cosas en vivo (p. ej. invitaciones pendientes) y se pinta con `hs-live-ink`.

## Qué pone quien lo usa
- `actions`: búsqueda compacta, campana y el Avatar del usuario (con `online`). Un solo botón primario como máximo.
- Los enlaces reales (`href`) — el shell no enruta.
