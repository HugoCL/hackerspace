# Button

Acciones. Variantes: `primary` (tinta), `signal` (lima), `secondary` (por defecto), `ghost` y `danger`. Tamaños `sm`, `md`, `lg`.

## Reglas
- **Una `primary` por vista.** Es la acción para la que existe la página ("Inscribirme", "Publicar proyecto").
- **`signal` es el llamado social**: "Busco equipo", "Unirme". Como máximo una por vista y no junto a otra primary en el mismo grupo.
- `ghost` para acciones terciarias y de navegación ("Ver todos →").
- `danger` solo para salir de un equipo o eliminar; siempre con confirmación.
- Verbo primero, en tuteo: "Unirme al equipo", "Crear perfil". Nada de "Aceptar".
- Se encoge apenas al presionar y su área táctil llega a 40px aunque mida 32px.
- Solo ícono: pasa `aria-label` y ningún texto; se vuelve cuadrado.
- Con `href` se renderiza como enlace con el mismo aspecto.
