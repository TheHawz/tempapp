// app.js — entry point de la app. Conecta flatten() + TimerEngine con la UI.
// No exporta nada: registra el componente Alpine 'timer' al cargar.

import { flatten } from './flatten.js';
import { TimerEngine } from './engine.js';

const EXAMPLE_WORKOUT = {
  repeat: 1,
  children: [
    { repeat: 2, children: [
      { type: "work", duration: 25 },
      { type: "rest", duration: 20 }
    ]},
    { type: "rest", duration: 20, prep: 10 }
  ]
};

document.addEventListener('alpine:init', () => {
  Alpine.data('timer', () => ({
    screen: 'config',
    phaseLabel: '',
    remainingLabel: '00:00',
    engine: null,
    wakeLock: null,
    rafId: null,

    init() {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.engine) this.update();
      });
    },

    start() {
      cancelAnimationFrame(this.rafId);
      const phases = flatten(EXAMPLE_WORKOUT);
      this.engine = new TimerEngine(phases);
      this.engine.start();
      this.screen = 'running';
      this.requestWakeLock();
      this.loop();
    },

    pause() {
      this.engine.pause();
      this.screen = 'paused';
      cancelAnimationFrame(this.rafId);
      this.releaseWakeLock();
    },

    resumeTimer() {
      cancelAnimationFrame(this.rafId);
      this.engine.resume();
      this.screen = 'running';
      this.requestWakeLock();
      this.loop();
    },

    reset() {
      if (this.engine) this.engine.reset();
      this.engine = null;
      this.screen = 'config';
      cancelAnimationFrame(this.rafId);
      this.releaseWakeLock();
    },

    loop() {
      this.update();
      if (this.screen === 'running') {
        this.rafId = requestAnimationFrame(() => this.loop());
      }
    },

    update() {
      const state = this.engine.getState();
      if (state.done) {
        this.screen = 'done';
        cancelAnimationFrame(this.rafId);
        this.releaseWakeLock();
        return;
      }
      const labels = { work: 'TRABAJO', rest: 'DESCANSO', prep: 'PREPÁRATE' };
      this.phaseLabel = labels[state.phase.type];
      const totalSeconds = Math.ceil(state.remainingMs / 1000);
      const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      this.remainingLabel = `${mm}:${ss}`;
    },

    async requestWakeLock() {
      try {
        if ('wakeLock' in navigator) this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) { /* no-op: wake lock no disponible, no es crítico */ }
    },

    releaseWakeLock() {
      try { this.wakeLock?.release(); this.wakeLock = null; } catch (e) { /* no-op */ }
    }
  }));
});
