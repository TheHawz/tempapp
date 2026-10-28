import assert from "node:assert";
import { buildSeriesWorkout, buildRepeaterWorkout } from "./workoutBuilder.js";

// Test A — serie con descanso y rondas
{
  const result = buildSeriesWorkout({
    initialPrep: 5,
    work: 30,
    rest: 15,
    restPrep: 5,
    rounds: 3,
  });
  const expected = {
    initialPrepSeconds: 5,
    group: {
      repeat: 3,
      children: [
        { type: "work", duration: 30 },
        { type: "rest", duration: 15, prep: 5 },
      ],
    },
  };
  assert.deepStrictEqual(result, expected);
  console.log("Test A OK");
}

// Test B — serie solo trabajo, todo por defecto salvo work
{
  const result = buildSeriesWorkout({ work: 40 });
  const expected = {
    initialPrepSeconds: 0,
    group: {
      repeat: 1,
      children: [{ type: "work", duration: 40 }],
    },
  };
  assert.deepStrictEqual(result, expected);
  console.log("Test B OK");
}

// Test C — repeater completo
{
  const result = buildRepeaterWorkout({
    initialPrep: 10,
    work: 10,
    rest: 20,
    cycleRounds: 5,
    betweenRest: 60,
    betweenRestPrep: 15,
    sets: 3,
  });
  const expected = {
    initialPrepSeconds: 10,
    group: {
      repeat: 3,
      children: [
        {
          repeat: 5,
          children: [
            { type: "work", duration: 10 },
            { type: "rest", duration: 20 },
          ],
        },
        { type: "rest", duration: 60, prep: 15 },
      ],
    },
  };
  assert.deepStrictEqual(result, expected);
  console.log("Test C OK");
}

// Test D — repeater con un solo set (sin descanso entre sets)
{
  const result = buildRepeaterWorkout({
    work: 15,
    rest: 15,
    cycleRounds: 4,
    betweenRest: 0,
    sets: 1,
  });
  const expected = {
    initialPrepSeconds: 0,
    group: {
      repeat: 1,
      children: [
        {
          repeat: 4,
          children: [
            { type: "work", duration: 15 },
            { type: "rest", duration: 15 },
          ],
        },
      ],
    },
  };
  assert.deepStrictEqual(result, expected);
  console.log("Test D OK");
}

// Test E — repeater sin descanso dentro del ciclo
{
  const result = buildRepeaterWorkout({
    work: 20,
    rest: 0,
    cycleRounds: 3,
    betweenRest: 30,
    betweenRestPrep: 10,
    sets: 2,
  });
  const expected = {
    initialPrepSeconds: 0,
    group: {
      repeat: 2,
      children: [
        {
          repeat: 3,
          children: [{ type: "work", duration: 20 }],
        },
        { type: "rest", duration: 30, prep: 10 },
      ],
    },
  };
  assert.deepStrictEqual(result, expected);
  console.log("Test E OK");
}

// Test F — validación
{
  assert.throws(() => buildSeriesWorkout({}));
  assert.throws(() => buildRepeaterWorkout({ work: 10 }));
  console.log("Test F OK");
}

console.log("All workoutBuilder tests passed.");
