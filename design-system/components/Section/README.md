# Section

Un bloque titulado dentro de una vista: título en display 20px, un contador opcional y una acción a la derecha ("Ver todos").

- Separadas por `space-12` (lo hace AppShell). Dentro, el contenido va a `space-4` del título.
- `count` en mono para totales ("12"). Si el número es en vivo, usa un `PresencePill` en `action` en lugar de `count`.
- La acción es un `Button` `ghost` con `iconEnd="arrow"`, nunca primary.
