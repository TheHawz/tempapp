// engine.test.js — ejecutable con `node js/engine.test.js`.
// Sin dependencias externas, sin setTimeout real: el tiempo se simula
// pasando una función `now` propia que el test incrementa manualmente.

import assert from "node:assert";
import { TimerEngine } from "./engine.js";

function test1() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine = new TimerEngine(phases, { now: () => t });

  // Estado inicial, antes de start()
  let state = engine.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 5000,
  });

  engine.start();
  t = 2000; // han pasado 2s reales desde el start
  state = engine.getState();
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 3000,
  });

  console.log("Test 1 OK");
}

function test2() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine = new TimerEngine(phases, { now: () => t });

  engine.start();
  t = 7000; // salto directo a los 7s, sin leer el estado antes
  const state = engine.getState();
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 1,
    phase: { type: "rest", duration: 10 },
    remainingMs: 8000,
  });

  console.log("Test 2 OK");
}

function test3() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine = new TimerEngine(phases, { now: () => t });

  engine.start();
  t = 25000; // 25s, más que los 20s totales
  const state = engine.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: true,
    phaseIndex: 3,
    phase: null,
    remainingMs: 0,
  });

  console.log("Test 3 OK");
}

function test4() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine = new TimerEngine(phases, { now: () => t });

  engine.start();
  t = 3000;
  engine.pause(); // quedaban 2000ms de la fase 0 (duration 5s) en el momento de la pausa
  t = 10000; // pasan 7s reales mientras está en pausa — no deben contar
  engine.resume();
  t = 10500; // 500ms después de resume()
  const state = engine.getState();
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 1500,
  });

  console.log("Test 4 OK");
}

function test5() {
  const emptyEngine = new TimerEngine([], { now: () => 0 });
  const state = emptyEngine.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: true,
    phaseIndex: 0,
    phase: null,
    remainingMs: 0,
  });

  console.log("Test 5 OK");
}

function test6() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine = new TimerEngine(phases, { now: () => t });
  engine.start();
  t = 2000; // 2s dentro de la fase 0 (work, 5s)
  engine.skipNext();
  // getState() en el MISMO instante t=2000 debe mostrar la fase 1 (rest, 10s)
  // con su duración COMPLETA, no los 2s que ya habían pasado de la fase 0.
  const state = engine.getState();
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 1,
    phase: { type: "rest", duration: 10 },
    remainingMs: 10000,
  });

  console.log("Test 6 OK");
}

function test7() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine2 = new TimerEngine(phases, { now: () => t });
  engine2.start();
  engine2.skipNext(); // -> fase 1
  engine2.skipNext(); // -> fase 2 (la última)
  engine2.skipNext(); // -> ya no hay más fases
  const state = engine2.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: true,
    phaseIndex: 3,
    phase: null,
    remainingMs: 0,
  });

  console.log("Test 7 OK");
}

function test8() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine3 = new TimerEngine(phases, { now: () => t });
  engine3.start();
  t = 3000;
  engine3.skipNext(); // -> fase 1 (rest), empieza en t=3000
  t = 5000; // 2s dentro de la fase 1
  engine3.skipPrevious(); // -> vuelve a fase 0 (work), duración completa
  const state = engine3.getState(); // en el mismo instante t=5000
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 5000,
  });

  console.log("Test 8 OK");
}

function test9() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine4 = new TimerEngine(phases, { now: () => t });
  engine4.start();
  t = 2000; // 2s dentro de la fase 0
  engine4.skipPrevious(); // sigue en fase 0, pero reinicia su duración completa
  const state = engine4.getState(); // mismo instante t=2000
  assert.deepStrictEqual(state, {
    running: true,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 5000,
  });

  console.log("Test 9 OK");
}

function test10() {
  const phases = [
    { type: "work", duration: 5 },
    { type: "rest", duration: 10 },
    { type: "work", duration: 5 },
  ];
  let t = 0;
  const engine5 = new TimerEngine(phases, { now: () => t });
  engine5.start();
  t = 2000;
  engine5.pause(); // quedaban 3000ms de la fase 0 (work, 5s)
  engine5.skipNext(); // -> fase 1 (rest), en pausa, con su duración COMPLETA
  let state = engine5.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: false,
    phaseIndex: 1,
    phase: { type: "rest", duration: 10 },
    remainingMs: 10000,
  });

  engine5.skipPrevious(); // -> vuelve a fase 0, en pausa, duración COMPLETA (no los 3000ms de antes)
  state = engine5.getState();
  assert.deepStrictEqual(state, {
    running: false,
    done: false,
    phaseIndex: 0,
    phase: { type: "work", duration: 5 },
    remainingMs: 5000,
  });

  console.log("Test 10 OK");
}

test1();
test2();
test3();
test4();
test5();
test6();
test7();
test8();
test9();
test10();

console.log("Todos los tests de engine.js pasaron OK");
