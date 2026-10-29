import assert from 'node:assert';
import { parseWorkoutText } from './parseWorkoutText.js';

// Test A — trabajo suelto
try {
  const result = parseWorkoutText("30s");
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [{ type: "work", duration: 30 }]
  });
  console.log("✓ Test A passed");
} catch (e) {
  console.error("✗ Test A failed:", e.message);
  process.exit(1);
}

// Test B — par sin repetir
try {
  const result = parseWorkoutText("10''/20''");
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [
      { repeat: 1, children: [{ type: "work", duration: 10 }, { type: "rest", duration: 20 }] }
    ]
  });
  console.log("✓ Test B passed");
} catch (e) {
  console.error("✗ Test B failed:", e.message);
  process.exit(1);
}

// Test C — par con repetición
try {
  const result = parseWorkoutText("10''/20''x5");
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [
      { repeat: 5, children: [{ type: "work", duration: 10 }, { type: "rest", duration: 20 }] }
    ]
  });
  console.log("✓ Test C passed");
} catch (e) {
  console.error("✗ Test C failed:", e.message);
  process.exit(1);
}

// Test D — ejemplo real 1
try {
  const result = parseWorkoutText("(10''/20''x5 /3') x4");
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [
      {
        repeat: 4,
        children: [
          {
            repeat: 5,
            children: [
              { type: "work", duration: 10 },
              { type: "rest", duration: 20 }
            ]
          },
          { type: "rest", duration: 180 }
        ]
      }
    ]
  });
  console.log("✓ Test D passed");
} catch (e) {
  console.error("✗ Test D failed:", e.message);
  process.exit(1);
}

// Test E — ejemplo real 2 (multi-línea)
try {
  const result = parseWorkoutText(`30s
(10''/20''x5 /1') x3
(7''/3''x2 /30'') x5`);
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [
      { type: "work", duration: 30 },
      {
        repeat: 3,
        children: [
          {
            repeat: 5,
            children: [
              { type: "work", duration: 10 },
              { type: "rest", duration: 20 }
            ]
          },
          { type: "rest", duration: 60 }
        ]
      },
      {
        repeat: 5,
        children: [
          {
            repeat: 2,
            children: [
              { type: "work", duration: 7 },
              { type: "rest", duration: 3 }
            ]
          },
          { type: "rest", duration: 30 }
        ]
      }
    ]
  });
  console.log("✓ Test E passed");
} catch (e) {
  console.error("✗ Test E failed:", e.message);
  process.exit(1);
}

// Test F — unidades alternativas y comillas dobles
try {
  const result = parseWorkoutText('10"/1m');
  assert.deepStrictEqual(result, {
    repeat: 1,
    children: [
      { repeat: 1, children: [{ type: "work", duration: 10 }, { type: "rest", duration: 60 }] }
    ]
  });
  console.log("✓ Test F passed");
} catch (e) {
  console.error("✗ Test F failed:", e.message);
  process.exit(1);
}

// Test G — errores (cada uno debe lanzar)
try {
  assert.throws(() => parseWorkoutText("(10''/20''"));           // paréntesis sin cerrar
  assert.throws(() => parseWorkoutText("10''/20''x"));            // falta número tras "x"
  assert.throws(() => parseWorkoutText("10h"));                   // unidad desconocida
  assert.throws(() => parseWorkoutText(""));                      // vacío
  assert.throws(() => parseWorkoutText("   "));                   // solo espacios
  console.log("✓ Test G passed");
} catch (e) {
  console.error("✗ Test G failed:", e.message);
  process.exit(1);
}

console.log("\nAll 7 tests (A-G) passed!");
