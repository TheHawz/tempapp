// app.js — entry point de la app. Conecta flatten() + TimerEngine con la UI.
// No exporta nada: registra el componente Alpine 'timer' al cargar.

import { flattenWithPath } from './flattenPath.js';
import { TimerEngine } from './engine.js';
import { buildSeriesWorkout, buildRepeaterWorkout } from './workoutBuilder.js';
import { createSoundController } from './sound.js';
import { buildBrackets } from './phaseHierarchy.js';

const RING_CIRC = 2 * Math.PI * 54;

const PHASE_LABELS = { work: 'Trabajo', rest: 'Descanso', prep: 'Preparación' };

// Guías de color para la vista previa vertical de jerarquía (ver issue #30):
// mismo criterio binario que ya usa buildSegmentStrip() para los corchetes
// horizontales — el bucle más externo que se repite usa --loop-outer, el
// resto usa --accent.
function guideColorForDepth(depth) {
  return depth === 0 ? 'var(--loop-outer)' : 'var(--accent)';
}

// Ns / N:ss / Nm — igual de legible que el "m:ss" de la pantalla running,
// pero más compacto para la columna estrecha de la vista previa vertical.
function formatPreviewDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}:${String(rem).padStart(2, '0')}`;
}

document.addEventListener('alpine:init', () => {
  Alpine.data('timer', () => ({
    screen: 'config',
    phaseLabel: '',
    remainingLabel: '00:00',
    engine: null,
    wakeLock: null,
    rafId: null,

    phases: [],
    brackets: [],
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

    sound: createSoundController(),
    soundOn: true,

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
      // $refs.configPreview no está garantizado hasta que Alpine termine de
      // procesar el resto del árbol del componente — ver issue #30.
      this.$nextTick(() => this.renderConfigPreview());
    },

    // Vista previa vertical en vivo de la pantalla config — ver issue #30.
    // Reconstruye el mismo `result.group` que start() usaría para arrancar
    // el entreno, pero en un try/catch silencioso: si los campos actuales
    // son inválidos, simplemente deja la última vista previa válida en
    // pantalla (el error de verdad, si lo hay, ya lo muestra formError al
    // pulsar "Empezar").
    renderConfigPreview() {
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
        return;
      }

      const container = this.$refs.configPreview;
      if (!container) return;
      container.innerHTML = '';

      if (result.initialPrepSeconds > 0) {
        container.appendChild(this.renderPreviewLeaf({ type: 'prep', duration: result.initialPrepSeconds }));
      }
      container.appendChild(this.renderPreviewGroup(result.group, 0));
    },

    renderPreviewLeaf(leaf) {
      const row = document.createElement('div');
      row.className = 'row';

      const dot = document.createElement('span');
      dot.className = `row-dot ${leaf.type}`;

      const label = document.createElement('span');
      label.className = 'row-label';
      label.textContent = PHASE_LABELS[leaf.type] || leaf.type;

      const dur = document.createElement('span');
      dur.className = 'row-duration';
      dur.textContent = formatPreviewDuration(leaf.duration);

      row.append(dot, label, dur);
      return row;
    },

    // group = { repeat, children }, igual que produce buildSeriesWorkout /
    // buildRepeaterWorkout. depth = cuántos ancestros con repeat>1 tiene
    // este grupo (el root, si tiene repeat:1, no cuenta como nivel propio) —
    // mismo criterio que el mockup aprobado en /tmp/tempapp-mockup.
    renderPreviewGroup(group, depth) {
      const isRepeated = group.repeat > 1;
      const childDepth = depth + (isRepeated ? 1 : 0);
      const container = isRepeated ? document.createElement('div') : document.createDocumentFragment();
      let childrenHost = container;

      if (isRepeated) {
        container.className = 'group';
        container.style.setProperty('--guide-color', guideColorForDepth(depth));

        childrenHost = document.createElement('div');
        childrenHost.className = 'group-children';
        container.appendChild(childrenHost);
      }

      group.children.forEach((child) => {
        if (child.repeat) childrenHost.appendChild(this.renderPreviewGroup(child, childDepth));
        else childrenHost.appendChild(this.renderPreviewLeaf(child));
      });

      if (isRepeated) {
        const badge = document.createElement('div');
        badge.className = 'group-badge';
        badge.textContent = `×${group.repeat}`;
        container.appendChild(badge);
      }

      return container;
    },

    start() {
      this.sound.unlock();
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
        // path: [] — no pertenece a ningún grupo que se repita, buildBrackets
        // (phaseHierarchy.js) espera que toda fase tenga `path` (aunque esté
        // vacío) para poder comparar `path.length` contra la profundidad.
        phases.unshift({ type: 'prep', duration: result.initialPrepSeconds, path: [] });
      }
      this.phases = phases;
      this.brackets = buildBrackets(this.phases);
      cancelAnimationFrame(this.rafId);
      this.engine = new TimerEngine(phases);
      this.engine.start();
      this._lastPhaseIndex = -1;
      this._lastTickSecond = null;
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

    skipNext() {
      this.engine.skipNext();
      this.update();
    },

    skipPrevious() {
      this.engine.skipPrevious();
      this.update();
    },

    resumeTimer() {
      this.sound.unlock();
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
        this.sound.playComplete();
        if (this.soundOn) this.sound.vibrate([80, 60, 80, 60, 160]);
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

      const secondsLeft = Math.ceil(state.remainingMs / 1000);
      if (state.phaseIndex !== this._lastPhaseIndex) {
        this._lastPhaseIndex = state.phaseIndex;
        this._lastTickSecond = null;
        this.sound.playTransition(state.phase.type);
        if (this.soundOn) this.sound.vibrate([60, 40, 60]);
      } else if (secondsLeft <= 3 && secondsLeft >= 1 && secondsLeft !== this._lastTickSecond) {
        this._lastTickSecond = secondsLeft;
        this.sound.playTick();
        if (this.soundOn) this.sound.vibrate(40);
      }

      this.renderSegmentStrip(state.phaseIndex);
    },

    buildSegmentStrip() {
      const container = this.$refs.segments;
      container.innerHTML = '';

      // Mismo sistema de coordenadas que el layout flex real de `.leaves`
      // (gap:3px entre hijos, .block-gap de 7px) para que los corchetes
      // absolutamente posicionados caigan exactamente sobre los segmentos
      // que resumen — ver issue #28.
      const FLEX_GAP = 3;
      const GAP_WIDTH = 7;
      const ROW_H = 24;
      const LEAF_ROW_H = 34;
      const LOOP_OUTER = 'var(--loop-outer)';
      const LOOP_INNER = 'var(--accent)';

      const diagram = document.createElement('div');
      diagram.className = 'diagram';

      const leaves = document.createElement('div');
      leaves.className = 'leaves';

      const positions = [];
      let cursorX = 0;
      let isFirstChild = true;

      this.phases.forEach((phase, i) => {
        const prevPath = this.phases[i - 1]?.path;
        if (i > 0 && phase.path?.[0]?.index !== prevPath?.[0]?.index) {
          if (!isFirstChild) cursorX += FLEX_GAP;
          const gap = document.createElement('div');
          gap.className = 'block-gap';
          leaves.appendChild(gap);
          cursorX += GAP_WIDTH;
          isFirstChild = false;
        }

        if (!isFirstChild) cursorX += FLEX_GAP;
        const widthPx = Math.max(6, Math.min(60, Math.round(phase.duration)));
        positions[i] = { x: cursorX, w: widthPx };
        cursorX += widthPx;
        isFirstChild = false;

        const seg = document.createElement('div');
        seg.className = `seg type-${phase.type}`;
        seg.dataset.index = i;
        seg.style.width = widthPx + 'px';
        leaves.appendChild(seg);
      });

      const totalWidth = cursorX;
      const maxDepth = this.brackets.reduce((m, b) => Math.max(m, b.depth), -1);
      const bracketsTop = maxDepth >= 0 ? (maxDepth + 1) * ROW_H + 10 : 0;

      this.brackets.forEach((b) => {
        // depth 0 (bucle externo) va arriba del todo; los niveles más
        // internos se apilan por debajo, más cerca de los cuadrados.
        const row = b.depth;
        const left = positions[b.start].x;
        const right = positions[b.end].x + positions[b.end].w;
        const color = b.depth === 0 ? LOOP_OUTER : LOOP_INNER;

        const el = document.createElement('div');
        el.className = 'bracket';
        el.style.left = left + 'px';
        el.style.width = (right - left) + 'px';
        el.style.top = (row * ROW_H + 14) + 'px';
        el.style.setProperty('--bracket-color', color);

        const label = document.createElement('div');
        label.className = 'bracket-label';
        label.textContent = `×${b.total}`;
        label.style.setProperty('--bracket-color', color);
        el.appendChild(label);

        diagram.appendChild(el);
      });

      leaves.style.position = 'absolute';
      leaves.style.left = '0';
      leaves.style.top = bracketsTop + 'px';

      diagram.style.width = totalWidth + 'px';
      diagram.style.height = (bracketsTop + LEAF_ROW_H) + 'px';
      diagram.appendChild(leaves);
      container.appendChild(diagram);

      this._segmentNodes = Array.from(leaves.querySelectorAll('.seg'));
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
    },

    toggleSound() {
      this.soundOn = !this.soundOn;
      this.sound.setEnabled(this.soundOn);
    }
  }));
});
