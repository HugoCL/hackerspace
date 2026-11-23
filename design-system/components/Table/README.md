# Table

Datos en filas y columnas: participantes, equipos inscritos, resultados, las llaves de API de un agente.

- `columns`: `{key, label, align, width, numeric, render}`. `render(fila)` devuelve cualquier contenido (Avatar, Badge, AgentTag, Button).
- Números a la derecha con `align: 'right'` y `numeric: true` (cifras tabulares).
- `caption` da título a la tabla; `empty` es el texto cuando no hay filas.
- En móvil la tabla hace scroll horizontal. Si las filas son "cosas" con imagen o acciones, usa tarjetas en un Grid.
- Hasta ~50 filas; más, con Pagination.
