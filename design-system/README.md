# Hackerspace

Un lugar en vivo para descubrir hackathones, formar equipos y compartir proyectos.

Hackerspace se tiene que sentir como entrar a una sala llena: ves quién más está mirando una hackathon, qué equipos se están armando ahora mismo y qué se acaba de publicar. El sistema es sobrio a propósito (papel, tinta, una lima de marca) para que lo único que "se mueve" sea la gente.

> **Estado:** primera versión, creada sin marca previa. No hay logo todavía: el nombre se escribe en Space Grotesk 600. Los tokens están nombrados como los de UI SDK (`--ui-*`) del stack de `hackathon-toolbox` (Next.js + Convex + Clerk + UI SDK + Tailwind 4), así que `tokens.css` reemplaza directamente `app/tokens.css`.

## Principios

1. **Lo vivo es naranja, y solo lo vivo.** `hs-live` marca presencia y actividad en tiempo real (punto de presencia, "23 viendo", alguien se unió a un equipo). Si no está pasando ahora, no es naranja.
2. **Lo redondo es una persona.** `radius-full` solo para avatares, puntos de presencia y la píldora de presencia. Todo lo demás usa `radius-sm` (controles) o `radius-md` (tarjetas).
3. **Humano vs. agente, siempre visible.** Todo lo que crea o hace un agente IA (el scout de hackathones con Firecrawl, el agente de un usuario vía API) lleva la etiqueta `hs-agent` en monoespaciada con borde punteado: "agente scout". Nunca se disfraza de persona.
4. **Bordes, no sombras.** Las tarjetas (`hs-surface`) se separan del fondo con `ui-border`. Sin gradientes. La única sombra, `shadow-overlay`, es para lo que flota sobre la página: Dialog, Drawer, Menu, Popover y Toast.
5. **Una acción primaria por vista** en `ui-primary` (bloque de tinta). La lima `hs-signal` se reserva para el único llamado que más importa (p. ej. "Abierto a equipo").

## Voz y contenido

- Español neutro, tuteo, frases cortas. "Únete al equipo", no "Solicitar incorporación".
- Fechas y lugares primero: **Valparaíso · 14–16 mar**. La modalidad como chip: *Presencial* (tinta) o *Virtual* (`hs-virtual`).
- Mayúscula solo al inicio de la frase, también en etiquetas y botones: "En vivo", "23 viendo", "2 lugares libres". Nada en MAYÚSCULAS sostenidas.
- Cifras que cambian en vivo siempre con números tabulares (`.live`) para que no salten.
- La monoespaciada significa "esto lo hizo o lo mide una máquina": solo en la etiqueta de agente y en el reloj del Countdown (`02:14:09`).
- Estados vacíos que invitan: "Nadie está buscando equipo aún. Sé el primero."
- Perfiles generados por el scout dicen de dónde salieron: "Creado por agente scout desde devpost.com, revisado por 2 personas".

## Fundamentos visuales

### Color

| Rol | Token | Uso |
| --- | --- | --- |
| Papel / tinta | `ui-background`, `ui-foreground` | Base de todo. 16.5:1. |
| Tarjeta | `hs-surface` + `ui-border` | Hackathon, equipo, proyecto. |
| Secundario | `ui-muted`, `ui-muted-foreground` | Metadatos, hover, chips neutros. |
| Marca | `hs-signal` + `hs-signal-ink` | Relleno lima con tinta encima. Nunca texto lima. |
| En vivo | `hs-live`, `hs-live-ink`, `hs-live-soft` | Presencia y actividad en tiempo real. |
| Virtual | `hs-virtual`, `hs-virtual-soft` | Modalidad virtual. |
| Agente | `hs-agent` | Etiquetas de acciones automatizadas. |
| Error | `ui-destructive` | Solo estados. |

Contraste verificado en ambos temas: texto ≥4.5:1, bordes de control y punto en vivo ≥3:1. Excepción conocida: `hs-signal` sobre papel claro es 1.2:1, por eso solo se usa como relleno con `hs-signal-ink` encima (13.8:1).

### Tipografía

- **Space Grotesk** (display, 600): títulos y el nombre.
- **Geist** (sans): texto y controles; `ui` = 13px como `--ui-font-size`.
- **Geist Mono**: solo lo que es de máquina: etiquetas de agente y el reloj del Countdown.

Las tres vienen de Google Fonts; no hay archivos de fuente en el sistema.

### Espacio y forma

Rejilla de 4px (`space-1` = `--ui-spacing`). Tarjetas con `space-4` de padding y `space-6` de gap. Radios: `radius-sm` 4px (controles, = `--ui-radius`), `radius-md` 8px (tarjetas), `radius-full` (personas y "ahora").

## Patrones en vivo

- **Píldora de presencia:** fondo `hs-live-soft`, punto `hs-live` 8px `radius-full` con pulso suave (respeta `prefers-reduced-motion`), texto `.live` en `hs-live-ink`.
- **Pila de avatares:** hasta 5 avatares solapados `space-2`, borde 2px `hs-surface`, y "+18" en `.caption`.
- **Feed de actividad:** filas con hora, actor (persona o etiqueta de agente) y acción. Las nuevas entran arriba con un destello `hs-live-soft` que se desvanece.
- **Cupos de equipo:** ranuras vacías como círculos con borde punteado `ui-input`; ocupadas con avatar.

## Iconografía

Set lineal de 1.5px en `currentColor` (componente `Icon`: search, pin, calendar, users, heart, plus, bell, bot, trophy, globe, arrow, menu, code, check, x, chevron, info, alert, more). 16px en controles, 14px en metadatos, 20–28px en estados vacíos. Para ampliar, Lucide con el mismo trazo. `pin` = presencial, `globe` = virtual, `bot` = agente. El único ícono relleno es el punto en vivo.

## Componentes

43 componentes (cada uno con guía y preview en vivo):

- **Layout:** `AppShell`, `PageHeader`, `Section`, `Stack`, `Grid`, `Footer`.
- **Acciones:** `Button`, `Tabs`.
- **Formularios:** `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`, `SegmentedControl`.
- **Display:** `Icon`, `Badge`, `Card`, `Avatar`, `AvatarStack`, `EmptyState`, `Separator`, `Skeleton`, `Progress`, `Table`, `Accordion`.
- **Feedback:** `Alert`, `Toaster` (con `toast()`), `Tooltip`.
- **Navegación:** `Breadcrumb`, `Pagination`.
- **Superpuestos:** `Dialog`, `Drawer`, `Menu`, `Popover`.
- **En vivo:** `PresencePill`, `Countdown`, `AgentTag`, `ActivityFeed`, `TeamSlots`.
- **Tarjetas de dominio:** `HackathonCard`, `TeamCard`, `ProjectCard`.

Los componentes solo pintan: reciben datos ya resueltos (conteos, nombres, fechas formateadas) por props y no saben de dónde vienen.

## Layouts y vistas

Toda vista es la misma columna vertebral:

```
AppShell (nav · acciones · banner en vivo opcional · aside opcional · Footer)
└─ PageHeader (eyebrow en vivo · título · meta · acciones)
   └─ Tabs (opcional, para subvistas)
      └─ Section × n (título · count · acción "Ver todos")
         └─ Grid de tarjetas | ActivityFeed | contenido | EmptyState
```

**Reglas de composición**

- Ancho máximo 1200px; margen lateral `space-4`. Entre Sections `space-12`; dentro, `space-4`; entre tarjetas `space-6`.
- Un **aside** (320px) solo cuando hay algo vivo o de contexto que acompañar: presencia, feed, tu equipo. Bajo 900px cae debajo del contenido.
- Una acción `primary` por vista, y como máximo una `signal`.
- Lo vivo arriba: si algo pasa ahora (gente viendo, cuenta regresiva), va en el eyebrow del PageHeader o en el banner, no enterrado.
- Grillas homogéneas: un tipo de tarjeta por Grid. `min` 280 para hackathones y equipos, 260 para proyectos.
- Toda lista puede quedar vacía: diseña su EmptyState con una acción.

**Vistas base**

| Vista | Estructura |
| --- | --- |
| **Explorar** (inicio) | PageHeader "Hackathones cerca de ti" + Input de búsqueda y Selects (modalidad, fecha) · Tabs Presenciales / Virtuales · Section "Esta semana" y "Próximas" con Grid de HackathonCard · aside: PresencePill global + ActivityFeed. |
| **Perfil de hackathon** | PageHeader con PresencePill (con caras) y AgentTag si la creó el scout, meta fecha/lugar/modalidad, acciones "Ver bases" + `signal` "Busco equipo" · Countdown en el banner · Tabs Resumen / Bases y reglas / Equipos / Proyectos · aside: ActivityFeed de esa hackathon. |
| **Equipos** | PageHeader + filtros · Section "Buscan gente ahora" (Grid de TeamCard con `activeNow` primero) · Section "Personas buscando equipo" (Avatares + roles en Badge `signal`). |
| **Galería de proyectos** | PageHeader + Tabs (Destacados / Recientes / Premiados) · Grid de ProjectCard `min=260`. |
| **Perfil de equipo** | PageHeader con nombre, hackathon y TeamSlots · pitch · roles buscados · acción `signal` "Postular" · aside: ActivityFeed del equipo. |
| **Perfil de persona** | PageHeader con Avatar `lg` + `online` · Badges de habilidades · Sections "Hackathones" y "Proyectos". |

**Responsive**

- Móvil primero: Grid colapsa a una columna sola; la nav del AppShell hace scroll horizontal; las acciones del PageHeader bajan debajo del título.
- Nada se oculta en móvil que sea en vivo: PresencePill y Countdown siempre visibles.

## Cómo se siente

Detalles pequeños que hacen que la interfaz responda. Ya están en `components/bundle.css`; al crear componentes nuevos, respétalos:

- **Responde al toque.** Botones y tarjetas enlazadas se encogen apenas al presionar (`scale(.97)` y `.99`). Transiciones de 100–150ms sobre propiedades concretas, nunca `transition: all`.
- **Área táctil de 40px.** Los controles miden 32px pero su zona clicable se extiende a 40px; en pantallas táctiles (`pointer: coarse`) crecen de verdad a 40px.
- **Los números no saltan.** `tabular-nums` en todo conteo; cuando el número de presencia cambia, entra con un deslizamiento de 3px.
- **Lo nuevo llega, no aparece.** Una fila nueva del feed baja 6px con fundido y un destello `hs-live-soft`. Es el único movimiento no iniciado por la persona, junto al pulso del punto en vivo.
- **Texto cuidado.** Suavizado de fuente, títulos con `text-wrap: balance`, párrafos con `text-wrap: pretty`.
- **Imágenes con borde.** Fotos de avatar y portadas llevan un contorno interior del 12% de la tinta para no fundirse con el fondo.
- **Alineación óptica.** Un botón con ícono lleva 2px menos de relleno del lado del ícono.
- **Radios concéntricos.** Lo que va dentro de una tarjeta (`radius-md`) usa `radius-sm`; nunca el mismo radio anidado.
- **El nombre muta solo en el pie.** En el `Footer`, "hacker" se transforma en otras palabras ("builders space", "dreamers space"…) y vuelve a juntarse en "hackerspace". En cualquier otro lugar el nombre está quieto.
- Todo movimiento se apaga con `prefers-reduced-motion`.

## Primitivas de UI SDK

Los componentes de este sistema son la referencia visual. En la app, el comportamiento (teclado, foco, ARIA) viene de UI SDK y las clases `hs-*` solo lo visten. No armes widgets con `role=` a mano.

| Componente | En la app |
| --- | --- |
| `Button` | `@ui-sdk/react/button` con `className="hs-btn hs-btn--…"` |
| `Tabs` | `@ui-sdk/react/tabs` (`TabsList` → `hs-tabs`, `TabsTab` → `hs-tab`; el estado llega por `data-selected`) |
| `Input` | `@ui-sdk/react/field` + `@ui-sdk/react/input` (`hs-field`, `hs-input-control`) |
| `Select` | `@ui-sdk/react/select` |
| `Textarea` | `@ui-sdk/react/field` + `@ui-sdk/react/textarea` |
| `Checkbox`, `RadioGroup`, `Switch` | `checkbox`, `radio`, `switch` (`hs-check`, `hs-check-input`, `hs-radio-input`, `hs-switch-input`) |
| `SegmentedControl` | `@ui-sdk/react/segmented-control` |
| `Avatar` | `@ui-sdk/react/avatar` con las clases `hs-avatar` |
| `Separator`, `Progress`, `Accordion`, `Pagination` | `separator`, `progress`, `accordion`, `pagination` |
| `Dialog` | `dialog`; confirmaciones destructivas con `alert-dialog` (`hs-dialog*`) |
| `Drawer` | `drawer` (`hs-dialog hs-dialog--drawer`) |
| `Menu`, `Popover`, `Tooltip` | `menu`, `popover` (o `hover-card`), `tooltip` |
| `Toaster` | `toast` (`hs-toaster`, `hs-toast`) |
| `Skeleton`, `Alert`, `Breadcrumb`, `Table` | Sin primitiva: marcado semántico propio (`nav`, `table`, `role="status"`) con clases `hs-*` |
| `PresencePill`, `ActivityFeed`, `TeamSlots`, `AgentTag`, `Countdown`, tarjetas, layout | Sin primitiva: son marcado propio con clases `hs-*` |

Todavía no hay versión `hs-*` de: calendario y selector de fecha, combobox, paleta de comandos, carrusel, slider y gráficos. Si una vista los necesita, parte de la primitiva de UI SDK y agrégala aquí.

**Cuál superpuesto usar**

| Necesito… | Usa |
| --- | --- |
| Nombrar un botón de solo ícono | `Tooltip` |
| Una lista de acciones | `Menu` |
| Un panel pequeño de contenido junto a su botón | `Popover` |
| Una tarea corta o una confirmación | `Dialog` |
| Contenido largo o filtros, sin perder la página | `Drawer` |
| Avisar algo breve que puede desaparecer | `toast()` |
| Un mensaje que debe quedarse en la página | `Alert` |

## Contenido hecho por agentes

- Todo perfil, mensaje o acción creada por un agente lleva `AgentTag` junto al contenido: en tarjetas (prop `source`), en el eyebrow del PageHeader y en cada fila del feed.
- Un perfil creado por el scout muestra de dónde salió ("Encontrado en devpost.com") en el `title` del AgentTag o en la meta.
- Los agentes nunca tienen Avatar, nunca cuentan en PresencePill como personas, y nunca usan `hs-live` ni `hs-signal`.

## En el código

El `tokens.css` generado por este sistema reemplaza `app/tokens.css` del toolbox (mismos nombres `--ui-*`). Para Tailwind, mapear los `hs-*` en `@theme inline` (`--color-signal: var(--hs-signal)`, `--color-live: var(--hs-live)`, …). Los componentes de este sistema son la referencia visual y de API; las clases `hs-*` de `components/bundle.css` se pueden portar tal cual.
