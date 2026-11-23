# Dialog

Una ventana modal para una tarea corta que necesita toda la atención: postular a un equipo, confirmar que sales, crear un equipo.

## Reglas
- El título es la acción ("Postular a Los Compiladores"); el botón principal repite el verbo ("Enviar postulación"). Nada de "Aceptar".
- Pie con cancelar a la izquierda y la acción a la derecha. Una sola `primary` o `signal`.
- **Confirmaciones destructivas:** título en pregunta ("¿Salir del equipo?"), descripción con la consecuencia, y el botón de la acción en `danger`. Úsalas solo cuando no se puede deshacer.
- Se cierra con Escape, con la ✕ y al hacer clic fuera. El foco vuelve al control que lo abrió.
- Contenido largo o que se consulta mientras se mira la página: usa Drawer.

## Qué pone quien lo usa
`open` y `onClose` (el estado vive fuera), `title`, `description` opcional, el contenido y `footer`.

En la app: `@ui-sdk/react/dialog` (y `alert-dialog` para confirmaciones) con las clases `hs-dialog*`.
