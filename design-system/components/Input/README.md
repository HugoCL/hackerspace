# Input

Campo de texto con etiqueta, ayuda y error. `icon="search"` para el buscador.

- Siempre con `label` visible, salvo el buscador del AppShell (usa `aria-label`).
- `hint` explica el formato; `error` lo reemplaza y pinta el borde en `ui-destructive`. Errores que dicen qué hacer: "Escribe una URL que empiece con https://".
- Placeholders son ejemplos, no instrucciones: "Santiago, Valparaíso…".
- Lo que el consumidor provee: `value`/`onChange` o `defaultValue`, `name`, `type`.
