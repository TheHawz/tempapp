// phaseHierarchy.js — lógica pura, sin DOM.
// A partir de un Phase[] con `path` (tal como lo produce flattenWithPath, ver
// flattenPath.js e issue #15), calcula los "corchetes" de jerarquía de bucles:
// un corchete = un grupo que se repite (total > 1), abarcando TODAS sus
// repeticiones de una vez. Ver la issue #26 para las reglas exactas.
//
// Esta función alimenta dos visualizaciones futuras (horizontal en "en
// marcha", vertical en "configurar") que reutilizan esta misma lógica — no
// la dupliques en ningún otro sitio.

export function buildBrackets(phases) {
  const brackets = [];

  // Escanea el rango [lo, hi] de `phases` buscando corchetes en `depth`.
  // Dentro del rango puede haber varios grupos hermanos en la misma
  // profundidad; cada uno forma su propio corchete independiente.
  function scanLevel(lo, hi, depth) {
    let i = lo;
    while (i <= hi) {
      if (phases[i].path.length <= depth) {
        // Fase que no pertenece a ningún grupo en esta profundidad
        // (p.ej. el descanso directo de un grupo externo).
        i++;
        continue;
      }

      const total = phases[i].path[depth].total;
      let prevIndex = phases[i].path[depth].index;
      let j = i + 1;

      while (j <= hi) {
        const p = phases[j];
        if (p.path.length <= depth) break;
        const idx = p.path[depth].index;
        if (idx < prevIndex) break; // empieza un grupo hermano nuevo
        prevIndex = idx;
        j++;
      }

      const start = i;
      const end = j - 1;

      if (total > 1) {
        brackets.push({ depth, start, end, total });
      }

      recurseSubPasses(start, end, depth);
      i = j;
    }
  }

  // Dentro de [start, end] (todo en la misma profundidad `depth`), separa
  // cada pasada individual (cada valor de path[depth].index) y escanea la
  // siguiente profundidad por separado dentro de cada una, de forma que
  // cada pasada del bucle externo genere su propio corchete en depth + 1.
  function recurseSubPasses(start, end, depth) {
    let i = start;
    while (i <= end) {
      const idx = phases[i].path[depth].index;
      let j = i;
      while (j <= end && phases[j].path[depth].index === idx) j++;
      scanLevel(i, j - 1, depth + 1);
      i = j;
    }
  }

  if (phases.length > 0) {
    scanLevel(0, phases.length - 1, 0);
  }

  brackets.sort((a, b) => a.depth - b.depth || a.start - b.start);

  return brackets;
}
