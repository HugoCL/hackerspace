# Skeleton

El hueco de algo que está cargando: líneas de texto, un círculo (avatar) o un bloque (imagen, tarjeta).

- Dibuja la forma real de lo que viene, con sus medidas, para que nada salte al llegar.
- Solo en la primera carga. Los datos en vivo que ya están en pantalla se actualizan en su lugar, sin volver al esqueleto.
- Variantes: `text` (por defecto), `circle`, `block`. `width` y `height` aceptan cualquier valor CSS.
- El pulso se apaga con `prefers-reduced-motion`. Marca el contenedor con `aria-busy="true"`.
