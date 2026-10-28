import assert from "node:assert";
import { flatten } from "./flatten.js";

// Caso A
{
  const input = {
    repeat: 1,
    children: [
      { type: "work", duration: 60 },
      { type: "rest", duration: 120, prep: 30 },
    ],
  };
  const expected = [
    { type: "work", duration: 60 },
    { type: "rest", duration: 90 },
    { type: "prep", duration: 30 },
  ];
  assert.deepStrictEqual(flatten(input), expected);
  console.log("Caso A: OK");
}

// Caso B — anidado, con repeticiones
{
  const input = {
    repeat: 2,
    children: [
      {
        repeat: 3,
        children: [
          { type: "work", duration: 10 },
          { type: "rest", duration: 20 },
        ],
      },
      { type: "rest", duration: 50, prep: 20 },
    ],
  };
  const expected = [
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "rest", duration: 30 },
    { type: "prep", duration: 20 },
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "work", duration: 10 },
    { type: "rest", duration: 20 },
    { type: "rest", duration: 30 },
    { type: "prep", duration: 20 },
  ];
  assert.deepStrictEqual(flatten(input), expected);
  console.log("Caso B: OK");
}

// Caso C — sin descanso
{
  const input = {
    repeat: 1,
    children: [{ type: "work", duration: 40 }],
  };
  const expected = [{ type: "work", duration: 40 }];
  assert.deepStrictEqual(flatten(input), expected);
  console.log("Caso C: OK");
}

console.log("Todos los tests pasaron.");
