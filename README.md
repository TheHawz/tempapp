<img src="icons/logo.svg" alt="Tempapp" height="48">

Timer de entrenos por intervalos (series y repeaters) — sin anuncios, sin pago, 100% adaptado a cómo entrenas.

Instalable como PWA en iPhone directamente desde Safari ("Compartir" → "Añadir a pantalla de inicio"). No requiere App Store ni cuenta de desarrollador.

## Stack

Vanilla HTML/CSS/JS + [Alpine.js](https://alpinejs.dev/) vía CDN. Sin build step: lo que está en el repo es lo que se sirve en GitHub Pages.

## Desarrollo local

No hace falta servidor ni instalar nada — basta con abrir `index.html` en el navegador. Si algo necesita servirse por HTTP (p.ej. `fetch` del manifest), usa:

```
python3 -m http.server
```

## Modelo de datos

Ver [`SPEC.md`](./SPEC.md).
