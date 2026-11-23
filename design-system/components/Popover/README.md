# Popover

Un panel pequeño anclado a un botón, para contenido que no es una lista de acciones: quién está viendo, un filtro rápido, compartir.

- `label` es el botón; `title` nombra el panel. El contenido es libre, hasta ~320px de ancho.
- Se cierra con Escape o al hacer clic fuera. Si el contenido es una función, recibe `close()`.
- Para acciones usa Menu; para algo que exige decisión, Dialog; para una etiqueta de una línea, Tooltip.
- En la app: `@ui-sdk/react/popover` (o `hover-card` para vistas previas de personas).
