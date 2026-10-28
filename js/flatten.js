// flatten.js — lógica pura, sin DOM.
// Expande un Group (con sus children, que pueden ser Interval o Group anidados)
// a una lista plana de Phase, aplicando repeticiones y el split rest/prep.
// Ver SPEC.md, sección "Phase", para las reglas exactas.

export function flatten(group) {
  const phases = [];

  for (let i = 0; i < group.repeat; i++) {
    for (const child of group.children) {
      if (child.children !== undefined) {
        // Es un Group anidado.
        phases.push(...flatten(child));
      } else if (child.type === "work") {
        phases.push({ type: "work", duration: child.duration });
      } else if (child.type === "rest") {
        const prep = child.prep || 0;
        if (prep > 0) {
          phases.push({ type: "rest", duration: child.duration - prep });
          phases.push({ type: "prep", duration: prep });
        } else {
          phases.push({ type: "rest", duration: child.duration });
        }
      }
    }
  }

  return phases;
}
