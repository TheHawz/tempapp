// flattenPath.js — lógica pura, sin DOM.
// Como flatten.js, pero cada Phase incluye además un campo `path` con la
// cadena de niveles de repetición (de más externo a más interno) en la que
// se encuentra esa fase, en el momento exacto de esa repetición concreta.
// Ver la issue #15 para las reglas exactas.

export function flattenWithPath(group, parentPath = []) {
  const phases = [];

  for (let i = 0; i < group.repeat; i++) {
    const path = [...parentPath, { index: i + 1, total: group.repeat }];

    for (const child of group.children) {
      if (child.children !== undefined) {
        // Es un Group anidado.
        phases.push(...flattenWithPath(child, path));
      } else if (child.type === "work") {
        phases.push({ type: "work", duration: child.duration, path });
      } else if (child.type === "rest") {
        const prep = child.prep || 0;
        if (prep > 0) {
          phases.push({ type: "rest", duration: child.duration - prep, path });
          phases.push({ type: "prep", duration: prep, path });
        } else {
          phases.push({ type: "rest", duration: child.duration, path });
        }
      }
    }
  }

  return phases;
}
