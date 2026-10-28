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

test1();
test2();
test3();
test4();
test5();

console.log("Todos los tests de engine.js pasaron OK");
