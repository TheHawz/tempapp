// phaseHierarchy.test.js — tests para buildBrackets (js/phaseHierarchy.js).
// Ejecutar con: node js/phaseHierarchy.test.js
//
// Los inputs son arrays de Phase ya escritos a mano con su `path` (los
// mismos outputs ya validados en la issue #15 / flattenPath.test.js), no se
// importa ni se llama a flattenWithPath aquí.

import assert from "node:assert";
import { buildBrackets } from "./phaseHierarchy.js";

// Test A — un solo nivel (reutiliza el Test A de la issue #15:
// {repeat:3, children:[work30(rest15,prep5)]} → 9 fases)
{
  const input = [
    { type: "work", duration: 30, path: [{ index: 1, total: 3 }] },
    { type: "rest", duration: 10, path: [{ index: 1, total: 3 }] },
    { type: "prep", duration: 5, path: [{ index: 1, total: 3 }] },
    { type: "work", duration: 30, path: [{ index: 2, total: 3 }] },
    { type: "rest", duration: 10, path: [{ index: 2, total: 3 }] },
    { type: "prep", duration: 5, path: [{ index: 2, total: 3 }] },
    { type: "work", duration: 30, path: [{ index: 3, total: 3 }] },
    { type: "rest", duration: 10, path: [{ index: 3, total: 3 }] },
    { type: "prep", duration: 5, path: [{ index: 3, total: 3 }] },
  ];

  const expected = [{ depth: 0, start: 0, end: 8, total: 3 }];

  const result = buildBrackets(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test A: OK");
}

// Test B — dos niveles anidados (reutiliza el Test B de la issue #15,
// {repeat:2, children:[{repeat:2,children:[work5,rest5]},{rest:8,prep:3}]}
// → 12 fases)
{
  const input = [
    { type: "work", duration: 5, path: [{ index: 1, total: 2 }, { index: 1, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 1, total: 2 }, { index: 1, total: 2 }] },
    { type: "work", duration: 5, path: [{ index: 1, total: 2 }, { index: 2, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 1, total: 2 }, { index: 2, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 1, total: 2 }] },
    { type: "prep", duration: 3, path: [{ index: 1, total: 2 }] },
    { type: "work", duration: 5, path: [{ index: 2, total: 2 }, { index: 1, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 2, total: 2 }, { index: 1, total: 2 }] },
    { type: "work", duration: 5, path: [{ index: 2, total: 2 }, { index: 2, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 2, total: 2 }, { index: 2, total: 2 }] },
    { type: "rest", duration: 5, path: [{ index: 2, total: 2 }] },
    { type: "prep", duration: 3, path: [{ index: 2, total: 2 }] },
  ];

  const expected = [
    { depth: 0, start: 0, end: 11, total: 2 },
    { depth: 1, start: 0, end: 3, total: 2 },
    { depth: 1, start: 6, end: 9, total: 2 },
  ];

  const result = buildBrackets(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test B: OK");
}

// Test C — repeat 1, sin corchetes
{
  const input = [{ type: "work", duration: 40, path: [{ index: 1, total: 1 }] }];

  const expected = [];

  const result = buildBrackets(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test C: OK");
}

console.log("All phaseHierarchy tests passed.");
