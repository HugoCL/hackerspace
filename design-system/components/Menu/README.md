# Menu

Un botón que abre una lista de acciones: el menú del usuario, "más opciones" de una tarjeta, acciones de un equipo.

- Es el "dropdown menu" del sistema. `label` es el texto del botón; para solo ícono pasa `trigger={{ icon: 'more', 'aria-label': 'Más opciones' }}` sin `label`.
- `items`: `{label, icon, onSelect, href, danger, disabled}` o `'separator'`. Verbos cortos: "Editar equipo", "Copiar enlace".
- Lo destructivo va al final, tras un separador, con `danger`, y abre un Dialog de confirmación.
- No escondas aquí la acción principal de la vista. Hasta ~7 acciones.
- `align="end"` cuando el botón está a la derecha. Flechas, Inicio, Fin y Escape funcionan.
- En la app: `@ui-sdk/react/menu`.
