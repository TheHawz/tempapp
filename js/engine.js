// engine.js — lógica pura, sin DOM.
// Motor del timer basado en timestamps absolutos (nunca en ticks acumulados),
// para sobrevivir a la congelación del JS cuando iOS Safari bloquea la pantalla.
// Ver SPEC.md, sección "Restricción de plataforma importante".
//
// Consume un array de Phase ya aplanado (ver js/flatten.js): { type, duration }
// con duration en segundos.

export class TimerEngine {
  constructor(phases, { now = () => Date.now() } = {}) {
    this.phases = phases;
    this.now = now;

    this.running = false;
    this.phaseIndex = 0;
    // Timestamp (ms, según this.now()) en el que empezó la fase actual.
    this.phaseStart = null;
    // Mientras está en pausa, cuánto quedaba (ms) de la fase actual.
    this.pausedRemainingMs = this.phases.length
      ? this.phases[0].duration * 1000
      : 0;
  }

  start() {
    this.phaseStart = this.now();
    this.running = true;
  }

  pause() {
    if (!this.running) return;
    const state = this.getState();
    this.pausedRemainingMs = state.remainingMs;
    this.running = false;
  }

  resume() {
    if (this.running) return;
    if (this.phaseIndex >= this.phases.length) return; // done
    this.phaseStart =
      this.now() -
      (this.phases[this.phaseIndex].duration * 1000 - this.pausedRemainingMs);
    this.running = true;
  }

  reset() {
    this.running = false;
    this.phaseIndex = 0;
    this.phaseStart = null;
    this.pausedRemainingMs = this.phases.length
      ? this.phases[0].duration * 1000
      : 0;
  }

  getState() {
    if (this.phases.length === 0) {
      return {
        running: false,
        done: true,
        phaseIndex: 0,
        phase: null,
        remainingMs: 0,
      };
    }

    if (!this.running) {
      const done = this.phaseIndex >= this.phases.length;
      return {
        running: false,
        done,
        phaseIndex: this.phaseIndex,
        phase: done ? null : this.phases[this.phaseIndex],
        remainingMs: done ? 0 : this.pausedRemainingMs,
      };
    }

    // Running: recalcular cuántas fases completas han transcurrido desde
    // phaseStart, avanzando phaseIndex tantas veces como haga falta en una
    // sola pasada (puede ser más de una fase de golpe tras una congelación).
    let elapsed = this.now() - this.phaseStart;
    let idx = this.phaseIndex;

    while (idx < this.phases.length) {
      const durationMs = this.phases[idx].duration * 1000;
      if (elapsed < durationMs) {
        this.phaseIndex = idx;
        this.phaseStart = this.now() - elapsed;
        return {
          running: true,
          done: false,
          phaseIndex: idx,
          phase: this.phases[idx],
          remainingMs: durationMs - elapsed,
        };
      }
      elapsed -= durationMs;
      idx += 1;
    }

    // Se acabaron todas las fases.
    this.phaseIndex = idx;
    this.running = false;
    this.phaseStart = null;
    this.pausedRemainingMs = 0;

    return {
      running: false,
      done: true,
      phaseIndex: idx,
      phase: null,
      remainingMs: 0,
    };
  }
}
