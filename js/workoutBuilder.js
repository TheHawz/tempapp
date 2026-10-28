// workoutBuilder.js
//
// Funciones puras que convierten campos simples de un formulario (números)
// en la estructura `Group` descrita en SPEC.md, que consume js/flatten.js.
//
// No implementan UI ni el prepend de la fase de preparación inicial —
// eso es tarea de quien use `initialPrepSeconds`.

function isPositiveNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) && value > 0;
}

/**
 * @param {{ initialPrep?: number, work: number, rest?: number, restPrep?: number, rounds?: number }} fields
 * @returns {{ initialPrepSeconds: number, group: Group }}
 */
export function buildSeriesWorkout(fields) {
  const {
    initialPrep = 0,
    work,
    rest = 0,
    restPrep = 0,
    rounds = 1,
  } = fields;

  if (!isPositiveNumber(work)) {
    throw new Error("buildSeriesWorkout: 'work' debe ser un número > 0");
  }

  const children = [{ type: "work", duration: work }];

  if (rest > 0) {
    children.push({ type: "rest", duration: rest, prep: restPrep });
  }

  return {
    initialPrepSeconds: initialPrep,
    group: { repeat: rounds, children },
  };
}

/**
 * @param {{ initialPrep?: number, work: number, rest?: number, cycleRounds: number, betweenRest?: number, betweenRestPrep?: number, sets?: number }} fields
 * @returns {{ initialPrepSeconds: number, group: Group }}
 */
export function buildRepeaterWorkout(fields) {
  const {
    initialPrep = 0,
    work,
    rest = 0,
    cycleRounds,
    betweenRest = 0,
    betweenRestPrep = 0,
    sets = 1,
  } = fields;

  if (!isPositiveNumber(work)) {
    throw new Error("buildRepeaterWorkout: 'work' debe ser un número > 0");
  }

  if (!Number.isInteger(cycleRounds) || cycleRounds < 1) {
    throw new Error(
      "buildRepeaterWorkout: 'cycleRounds' debe ser un entero >= 1"
    );
  }

  const cycleChildren = [{ type: "work", duration: work }];
  if (rest > 0) {
    cycleChildren.push({ type: "rest", duration: rest });
  }

  const innerGroup = { repeat: cycleRounds, children: cycleChildren };

  const outerChildren = [innerGroup];
  if (betweenRest > 0) {
    outerChildren.push({
      type: "rest",
      duration: betweenRest,
      prep: betweenRestPrep,
    });
  }

  return {
    initialPrepSeconds: initialPrep,
    group: { repeat: sets, children: outerChildren },
  };
}
