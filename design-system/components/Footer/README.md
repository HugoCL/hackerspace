# Footer

El pie de página, y el único lugar donde el nombre se mueve: "hacker" muta a otras palabras ("builders space", "dreamers space", "ai+humans space"…) y cada tres vuelve a juntarse en "hackerspace".

## La mutación
- Arranca junto ("hackerspace"), se separa al mutar y cada tres palabras vuelve a juntarse. Junto se sostiene 4s; cada palabra, unos 3s.
- **Solo aquí.** En la barra superior, la portada y cualquier otro lugar el nombre es siempre "Hackerspace", quieto.
- **Cada palabra entra a su manera**, con un gráfico en una ficha lima que la acompaña. La animación cuenta lo que la palabra significa:

| Palabra | Cómo entra | Gráfico |
| --- | --- | --- |
| builders | las letras caen y se apilan | bloques apilados |
| dreamers | salen del desenfoque, flotando | luna que flota |
| ai+humans | "ai" se teclea en seco, el "+" gira, "humans" entra suave | dos anillos que se cruzan |
| never settlers | entra corriendo y no se queda quieta | flecha que sigue avanzando |
| tinkerers | cada letra se atornilla girando | engranaje que rota |
| first-timers | las letras saltan con rebote | destello |
| night owls | se encienden de a una, como ventanas | ojos de búho que parpadean |
| misfits | caen torcidas y una se queda chueca | un cuadrado entre círculos |
| makers | se imprimen de abajo hacia arriba | martillo que golpea |
| weekend founders | se voltean como hojas de calendario | calendario con el fin de semana marcado |
| what-if | parpadean con duda | signo de pregunta que se balancea |

- La vuelta a "hackerspace" es siempre un decodificado: las letras se resuelven de izquierda a derecha y el espacio se cierra.
- Todo esto vive en `bundle.css`, por palabra (`data-word`). El código solo cambia la palabra y separa las letras.

## Sumar una palabra
- Criterio: nombra a la gente que viene a una hackathon, en plural, en inglés y minúsculas, de 16 caracteres como máximo. Sin cargos ("engineers") ni tecnologías.
- Agrégala a `words` y dale en `bundle.css` su entrada (`.hs-footer-mark[data-word="…"] .hs-footer-ch`) y su gráfico (`--hs-glyph`, un SVG de 24×24 usado como máscara). La animación debe decir algo sobre la palabra; si no se te ocurre cuál, quizás la palabra no es la indicada.
- Una palabra sin animación propia entra con un deslizamiento simple y sin gráfico.
- `joinEvery` define cada cuántas vuelve a "hackerspace" (3).

## Accesibilidad
- Para lectores de pantalla el nombre es siempre "Hackerspace"; la animación está oculta.
- Con `prefers-reduced-motion` no hay mutación: queda "hackerspace".
- Se pausa con el botón "Pausar animación", al alcance del teclado y del tacto.

## Contenido
- `tagline`: una frase que diga qué es Hackerspace.
- `columns`: 2 a 4 grupos de enlaces (`{title, links: [{label, href}]}`), con los mismos nombres que la navegación. Solo enlaces que existen.
- `note`: la línea legal; por defecto "© año Hackerspace".
- Va en el `footer` del AppShell, una vez por página.
