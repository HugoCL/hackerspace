# Progress

Una barra de avance con etiqueta y valor: perfil completo, cupos ocupados, pasos de una postulación.

- `value` sobre `max` (100 por defecto). `valueLabel` reemplaza el porcentaje por algo más útil: "38 de 50 cupos".
- `tone="live"` (naranja) solo si el valor cambia en tiempo real, como los cupos que se van llenando.
- Para tiempo restante usa Countdown, no una barra.
- En la app: `@ui-sdk/react/progress`.
