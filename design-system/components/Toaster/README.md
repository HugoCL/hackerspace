# Toaster

La pila de avisos breves (toasts) en la esquina inferior derecha: confirmaciones y, sobre todo, lo que pasa en vivo mientras miras otra cosa.

## Uso
- Monta `<Toaster />` una vez en el AppShell y lanza avisos con `Hackerspace.toast({ title, description, tone, actor, action, duration })`.
- `tone="live"` (fondo naranja suave) para actividad de otras personas en tiempo real: "Camila se unió a tu equipo". Pasa `actor` para mostrar su Avatar; si fue un agente, `actor: { name, agent: true }` muestra el AgentTag.
- Sin tono para confirmaciones propias ("Proyecto publicado"). `danger` para fallos que no bloquean.

## Reglas
- Una frase. El aviso usa el mismo verbo que el botón que lo causó: "Publicar" → "Proyecto publicado".
- Desaparece a los 5 segundos; con `action` o `danger`, dale más tiempo o `duration: 0`.
- Máximo 4 a la vez. No anuncies cada cambio de presencia: solo lo que le importa a esta persona.
- Lo que requiere una decisión va en Dialog o Alert, no aquí.
- En la app: `@ui-sdk/react/toast`.
