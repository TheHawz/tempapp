# Tempapp — modelo de datos

Timer de entrenos por intervalos. Sin anuncios, sin pago, 100% adaptado a cómo entrena el usuario (series y repeaters).

## Stack

- Vanilla HTML / CSS / JS. **Sin build step.** Lo que hay en el repo es lo que se sirve.
- [Alpine.js](https://alpinejs.dev/) vía CDN para reactividad de UI (no hace falta instalar nada).
- Hosteado gratis en GitHub Pages, servido directamente desde `main`.
- Pensado para instalarse como PWA en iPhone ("Compartir" → "Añadir a pantalla de inicio").

## Restricción de plataforma importante

iOS Safari **congela el JS cuando la pantalla se bloquea o cambias de app**. No hay forma de evitarlo sin una app nativa. Por eso el motor del timer NUNCA debe depender de ticks acumulados (p.ej. "restar 1 cada segundo"). Debe:

1. Guardar un timestamp absoluto (`Date.now()`) de cuándo termina la fase actual.
2. Recalcular el tiempo restante comparando contra ese timestamp cada vez que se pinta (cada tick visual, y también en el evento `visibilitychange` al volver de background).
3. Usar la [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) para intentar que la pantalla no se apague sola mientras el usuario está mirando el timer activamente (esto NO resuelve el caso de pantalla bloqueada, solo evita que se bloquee mientras se usa).

Esto afecta al diseño del motor del timer, no es un detalle de implementación a posteriori.

## El modelo: `Interval` y `Group`

No hay tipos especiales "Serie" o "Repeater" en el código. Todo se construye con dos bloques recursivos. Las distintas "plantillas" de entreno (serie, repeater...) son solo formularios de UI que generan esta misma estructura.

### `Interval` — un tramo de tiempo atómico

```ts
type Interval = {
  type: "work" | "rest";
  duration: number;   // segundos, duración TOTAL de este intervalo
  prep?: number;        // segundos, SOLO válido si type === "rest". Default 0.
};
```

`prep` se resta del final de `duration` y se reproduce como aviso de "prepárate" justo antes de que empiece el siguiente trabajo. Es un campo por intervalo (no una opción global), así que puedes tener descansos cortos dentro de un ciclo sin aviso, y un descanso más largo entre sets con aviso, en la misma estructura.

### `Group` — un bloque repetible

```ts
type Group = {
  repeat: number;              // >= 1
  children: (Interval | Group)[];
};
```

Un workout entero es, en el fondo, un único `Group` raíz. Se anida `Group` dentro de `Group` tantas veces como haga falta.

### `Phase` — la unidad que consume el motor del timer

El timer no entiende `Interval`/`Group` directamente. Una función pura `flatten(group) -> Phase[]` expande toda la estructura (incluyendo repeticiones y el split rest/prep) a una lista plana:

```ts
type Phase = {
  type: "work" | "rest" | "prep";
  duration: number;   // segundos
};
```

Reglas de `flatten`:

- Cada `Group` expande sus `children`, en orden, `repeat` veces.
- Un `Interval` de tipo `"work"` siempre produce exactamente una `Phase`: `{ type: "work", duration }`.
- Un `Interval` de tipo `"rest"`:
  - si `prep` no está definido o es `0` → una `Phase`: `{ type: "rest", duration }`.
  - si `prep > 0` → DOS `Phase` consecutivas: `{ type: "rest", duration: duration - prep }` seguida de `{ type: "prep", duration: prep }`.

## Ejemplos

### Ejemplo 1 — "serie": 1min trabajo / 2min descanso, con 30s de preparación, una sola vez

```json
{ "repeat": 1, "children": [
  { "type": "work", "duration": 60 },
  { "type": "rest", "duration": 120, "prep": 30 }
]}
```

`flatten` →
```json
[
  { "type": "work", "duration": 60 },
  { "type": "rest", "duration": 90 },
  { "type": "prep", "duration": 30 }
]
```

### Ejemplo 2 — "repeater": 5×(10s trabajo / 20s descanso), repetido en M sets, con D de descanso (+prep) entre sets

```json
{ "repeat": "M", "children": [
  { "repeat": 5, "children": [
    { "type": "work", "duration": 10 },
    { "type": "rest", "duration": 20 }
  ]},
  { "type": "rest", "duration": "D", "prep": 30 }
]}
```

### Ejemplo 3 — solo trabajo, sin descanso

```json
{ "repeat": 1, "children": [
  { "type": "work", "duration": 40 }
]}
```

## Estructura del repo (en construcción)

```
index.html          # UI, carga Alpine.js desde CDN
style.css
js/
  flatten.js         # flatten(group) -> Phase[] — lógica pura, sin DOM
  flatten.test.js     # tests de flatten, ejecutables con `node js/flatten.test.js`
  engine.js           # (futuro) motor del timer: consume Phase[], usa Date.now()
icons/
  icon.svg            # placeholder, pendiente de diseño real
manifest.json
SPEC.md              # este archivo
```
