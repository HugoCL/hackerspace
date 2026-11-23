# PresencePill

La señal de que esto está vivo: un punto naranja que late, "En vivo" y cuántas personas están viendo ahora, con sus caras opcionales.

## Reglas
- **Solo para presencia real en tiempo real.** Si el número no se actualiza solo, no uses este componente.
- Muéstralo cuando `count ≥ 1`; con 0, no muestres nada (no "0 viendo").
- En PageHeader del perfil de hackathon: tamaño normal con `people` (caras de quienes conoces primero).
- En tarjetas: `size="sm"` y `live={false}` (solo punto y número), para no saturar la grilla.
- `label` cambia el verbo: "viendo", "en la sala", "editando".
- Cuando el número cambia entra con un deslizamiento corto. El pulso y esa entrada se desactivan con `prefers-reduced-motion`. El número se anuncia con `aria-live="polite"`; no lo actualices más de una vez cada pocos segundos.
