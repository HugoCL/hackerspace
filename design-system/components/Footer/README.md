# Footer

El pie de página, y el único lugar donde el nombre se mueve: "hacker" muta a otras palabras ("builders space", "dreamers space", "ai+humans space"…) y cada tres vuelve a juntarse en "hackerspace".

## La mutación
- Arranca junto ("hackerspace"), se separa al mutar y cada tres palabras vuelve a juntarse. Junto se sostiene 4s; cada palabra, unos 3s.
- **Solo aquí.** En la barra superior, la portada y cualquier otro lugar el nombre es siempre "Hackerspace", quieto.
- **Cada palabra entra a su manera**, y unos gráficos pequeños toman parte de la animación, sobre y alrededor de la palabra. Juntos cuentan lo que la palabra significa:

| Palabra | Cómo entra el texto | Qué lo acompaña |
| --- | --- | --- |
| builders | las letras caen y se apilan | tres bloques caen y se apilan encima |
| dreamers | salen del desenfoque, flotando | una luna sube y se queda flotando; dos estrellas titilan |
| ai+humans | "ai" se teclea en seco, el "+" gira, "humans" entra suave | dos anillos llegan desde cada lado y se cruzan sobre el "+" |
| never settlers | entra corriendo y no se queda quieta | una flecha con estela pasa por encima una y otra vez |
| tinkerers | cada letra se atornilla al pasar el engranaje | un engranaje rueda sobre la palabra y queda girando con otro más chico |
| newcomers | las letras saltan con rebote | destellos alrededor |
| night owls | se encienden de a una, como ventanas | unos ojos de búho se abren arriba y parpadean |
| misfits | caen torcidas y la "f" se queda chueca | tres círculos en fila y un cuadrado que cae torcido |
| makers | se imprimen de abajo hacia arriba | un martillo da tres golpes y la palabra se sacude |
| weekend founders | se voltean como hojas de calendario | aparece un calendario y "weekend" queda marcado en lima |
| what-if | parpadean con duda | signos de pregunta suben y se desvanecen |

- Los gráficos van en tinta, sin ficha ni fondo, y ocupan el aire que queda sobre el nombre. No hay ícono fijo al final.
- La vuelta a "hackerspace" es siempre un decodificado: las letras se resuelven de izquierda a derecha y el espacio se cierra.
- Todo esto vive en `bundle.css`, por palabra (`data-word`). El código solo cambia la palabra y separa las letras.

## Sumar una palabra
- Criterio: nombra a la gente que viene a una hackathon, en plural, en inglés y minúsculas, de 16 caracteres como máximo. Sin cargos ("engineers") ni tecnologías.
- Agrégala a `words` y dale en `bundle.css` su entrada (`.hs-footer-mark[data-word="…"] .hs-footer-ch`) y sus gráficos: hay cuatro elementos vacíos (`.hs-footer-fx i`) que se posicionan sobre la palabra y toman forma con una máscara SVG de 24×24 (`--g`). La animación debe decir algo sobre la palabra; si no se te ocurre cuál, quizás la palabra no es la indicada.
- Una palabra sin animación propia entra con un deslizamiento simple y sin gráficos.
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
