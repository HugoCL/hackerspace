# Textarea

Texto de varias líneas con etiqueta, ayuda y error: el pitch de un equipo, la descripción de un proyecto, un mensaje al postular.

- Mismas reglas que Input para `label`, `hint` y `error`.
- Di el largo esperado en la ayuda ("Una o dos frases") en vez de un contador, salvo que haya un límite real.
- `rows` define la altura inicial (4 por defecto); se puede agrandar hacia abajo.
- En la app: `@ui-sdk/react/field` + `@ui-sdk/react/textarea`.
