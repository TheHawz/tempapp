// app.js — entry point de la app. Conecta flatten() + TimerEngine con la UI.
// No exporta nada: registra el componente Alpine 'timer' al cargar.

import { flatten } from './flatten.js';
import { TimerEngine } from './engine.js';
import { buildSeriesWorkout, buildRepeaterWorkout } from './workoutBuilder.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('timer', () => ({
    screen: 'config',
    phaseLabel: '',
    remainingLabel: '00:00',
    engine: null,
    wakeLock: null,
    rafId: null,

    workoutType: 'series',
    formError: '',

    seriesInitialPrep: 5,
    seriesWork: 30,
    seriesRest: 15,
    seriesRestPrep: 5,
    seriesRounds: 3,

    repeaterInitialPrep: 5,
    repeaterWork: 10,
    repeaterRest: 20,
    repeaterCycleRounds: 5,
    repeaterBetweenRest: 30,
    repeaterBetweenRestPrep: 10,
    repeaterSets: 2,

    init() {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.engine) this.update();
      });
    },

    start() {
      this.formError = '';
      let result;
      try {
        if (this.workoutType === 'series') {
          result = buildSeriesWorkout({
            initialPrep: this.seriesInitialPrep,
            work: this.seriesWork,
            rest: this.seriesRest,
            restPrep: this.seriesRestPrep,
            rounds: this.seriesRounds
          });
        } else {
          result = buildRepeaterWorkout({
            initialPrep: this.repeaterInitialPrep,
            work: this.repeaterWork,
            rest: this.repeaterRest,
            cycleRounds: this.repeaterCycleRounds,
            betweenRest: this.repeaterBetweenRest,
            betweenRestPrep: this.repeaterBetweenRestPrep,
            sets: this.repeaterSets
          });
        }
      } catch (e) {
        this.formError = e.message;
        return;
      }
      const phases = flatten(result.group);
      if (result.initialPrepSeconds > 0) {
        phases.unshift({ type: 'prep', duration: result.initialPrepSeconds });
      }
      cancelAnimationFrame(this.rafId);
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
