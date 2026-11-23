# Footer

El pie de página, y el único lugar donde el nombre se mueve: "hacker" muta a otras palabras ("builders space", "dreamers space", "ai+humans space"…) y cada tres vuelve a juntarse en "hackerspace".

## La mutación
- Las letras se decodifican de izquierda a derecha hacia la palabra nueva (0.7s) mientras se abre un espacio antes de "space". Al volver a "hacker" el espacio se cierra y queda una sola palabra, que se sostiene más tiempo (4s) que las demás (2.4s).
- **Solo aquí.** En la barra superior, la portada y cualquier otro lugar el nombre es siempre "Hackerspace", quieto.
- Palabras por defecto: builders, dreamers, ai+humans, never settlers, tinkerers, first-timers, night owls, misfits, makers, weekend founders, what-if. Cámbialas con `words`; `joinEvery` define cada cuántas vuelve a "hackerspace" (3).
- Criterio para sumar palabras: nombran a la gente que viene a una hackathon, en plural, en inglés y minúsculas, de 16 caracteres como máximo. Sin cargos ("engineers") ni tecnologías.

## Accesibilidad
- Para lectores de pantalla el nombre es siempre "Hackerspace"; la animación está oculta.
- Con `prefers-reduced-motion` no hay mutación: queda "hackerspace".
- Se pausa con el botón "Pausar animación", al alcance del teclado y del tacto.

## Contenido
- `tagline`: una frase que diga qué es Hackerspace.
- `columns`: 2 a 4 grupos de enlaces (`{title, links: [{label, href}]}`), con los mismos nombres que la navegación. Solo enlaces que existen.
- `note`: la línea legal; por defecto "© año Hackerspace".
- Va en el `footer` del AppShell, una vez por página.
