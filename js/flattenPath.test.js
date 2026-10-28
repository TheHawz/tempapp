// flattenPath.test.js — tests para flattenWithPath (js/flattenPath.js).
// Ejecutar con: node js/flattenPath.test.js

import assert from "node:assert";
import { flattenWithPath } from "./flattenPath.js";

// Test A — un solo nivel, con prep
{
  const input = {
    repeat: 3,
    children: [
      { type: "work", duration: 30 },
      { type: "rest", duration: 15, prep: 5 },
    ],
  };

  const expected = [
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

  const result = flattenWithPath(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test A: OK");
}

// Test B — dos niveles anidados
{
  const input = {
    repeat: 2,
    children: [
      {
        repeat: 2,
        children: [
          { type: "work", duration: 5 },
          { type: "rest", duration: 5 },
        ],
      },
      { type: "rest", duration: 8, prep: 3 },
    ],
  };

  const expected = [
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

  const result = flattenWithPath(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test B: OK");
}

// Test C — sin anidar, repeat 1
{
  const input = {
    repeat: 1,
    children: [{ type: "work", duration: 40 }],
  };

  const expected = [
    { type: "work", duration: 40, path: [{ index: 1, total: 1 }] },
  ];

  const result = flattenWithPath(input);
  assert.deepStrictEqual(result, expected);
  console.log("Test C: OK");
}

console.log("All flattenPath tests passed.");
