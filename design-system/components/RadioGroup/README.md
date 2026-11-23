# RadioGroup

Elegir una opción entre pocas (2 a 5), todas visibles, con ayuda por opción si hace falta.

- `label` es la pregunta; cada opción, una respuesta corta.
- Más de 5 opciones: usa Select. Dos o tres opciones cortas que cambian una vista: SegmentedControl.
- Controlado (`value` + `onChange`) o no controlado (`defaultValue`). Siempre con una opción elegida por defecto cuando haya una razonable.
- En la app: `@ui-sdk/react/radio`.
