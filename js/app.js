// app.js — entry point de la app. Conecta flatten() + TimerEngine con la UI.
// No exporta nada: registra el componente Alpine 'timer' al cargar.

import { flattenWithPath } from './flattenPath.js';
import { TimerEngine } from './engine.js';
import { buildSeriesWorkout, buildRepeaterWorkout } from './workoutBuilder.js';

const RING_CIRC = 2 * Math.PI * 54;

document.addEventListener('alpine:init', () => {
  Alpine.data('timer', () => ({
    screen: 'config',
    phaseLabel: '',
    remainingLabel: '00:00',
    engine: null,
    wakeLock: null,
    rafId: null,

    phases: [],
    phaseType: '',
    ringOffset: 0,
    positionBlockText: '',
    positionSectorText: '',
    hasNext: false,
    nextType: '',
    nextLabel: '',
    nextDurationLabel: '',

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
      const phases = flattenWithPath(result.group);
      if (result.initialPrepSeconds > 0) {
        phases.unshift({ type: 'prep', duration: result.initialPrepSeconds });
      }
      this.phases = phases;
      cancelAnimationFrame(this.rafId);
      this.engine = new TimerEngine(phases);
      this.engine.start();
      this.buildSegmentStrip();
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
        this.renderSegmentStrip(this.phases.length);
        return;
      }
      const labels = { work: 'Trabajo', rest: 'Descanso', prep: 'Prepárate' };
      this.phaseLabel = labels[state.phase.type];
      const totalSeconds = Math.ceil(state.remainingMs / 1000);
      const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      this.remainingLabel = `${mm}:${ss}`;

      this.phaseType = state.phase.type;

      const progress = 1 - (state.remainingMs / (state.phase.duration * 1000));
      this.ringOffset = RING_CIRC * (1 - progress);

      const path = state.phase.path || [];
      this.positionBlockText = path.length > 0 ? `Bloque ${path[0].index} de ${path[0].total}` : '';
      this.positionSectorText = path.length > 1 ? `Sector ${path[1].index} de ${path[1].total}` : '';

      const next = this.phases[state.phaseIndex + 1];
      this.hasNext = !!next;
      if (next) {
        this.nextType = next.type;
        this.nextLabel = labels[next.type];
        const s = Math.round(next.duration);
        this.nextDurationLabel = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }

      this.renderSegmentStrip(state.phaseIndex);
    },

    buildSegmentStrip() {
      const container = this.$refs.segments;
      container.innerHTML = '';
      this.phases.forEach((phase, i) => {
        const prevPath = this.phases[i - 1]?.path;
        if (i > 0 && phase.path?.[0]?.index !== prevPath?.[0]?.index) {
          const gap = document.createElement('div');
          gap.className = 'block-gap';
          container.appendChild(gap);
        }
        const seg = document.createElement('div');
        seg.className = `seg type-${phase.type}`;
        seg.dataset.index = i;
        container.appendChild(seg);
      });
      this._segmentNodes = Array.from(this.$refs.segments.querySelectorAll('.seg'));
      this._lastSegmentIndex = -1;
    },

    renderSegmentStrip(currentIndex) {
      let activeNode = null;
      this._segmentNodes.forEach((node) => {
        const i = Number(node.dataset.index);
        node.classList.remove('state-done', 'state-current', 'state-future');
        if (i < currentIndex) {
          node.classList.add('state-done');
        } else if (i === currentIndex) {
          node.classList.add('state-current');
          activeNode = node;
        } else {
          node.classList.add('state-future');
        }
      });
      if (currentIndex !== this._lastSegmentIndex) {
        this._lastSegmentIndex = currentIndex;
        activeNode?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
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
