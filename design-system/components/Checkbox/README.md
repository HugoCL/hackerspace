# Checkbox

Una casilla con su etiqueta y una ayuda opcional, para opciones independientes: aceptar las bases, filtros múltiples, preferencias.

- La etiqueta dice lo que pasa al marcarla, en afirmativo: "Acepto las bases de la hackathon", no "No rechazo…".
- Para elegir una entre varias usa RadioGroup; para algo que se aplica al instante (sin botón Guardar), Switch.
- Acepta los atributos nativos (`checked`, `defaultChecked`, `onChange`, `disabled`, `required`, `name`).
- En la app: `@ui-sdk/react/checkbox` con las clases `hs-check` y `hs-check-input`.
