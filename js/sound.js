// sound.js — feedback sonoro/háptico (pitidos de cambio de fase y cuenta atrás).
// ES module, sin dependencias. Defensivo: no debe romper nada donde Audio/Vibration no existan.

export function createSoundController() {
  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try { ctx = new AudioContextClass(); } catch (e) { ctx = null; }
      }
    }
    return ctx;
  }

  function unlock() {
    const c = ensureContext();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function tone(freq, durationMs, type) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    // iOS puede suspender el AudioContext a media sesión (no solo al cargar);
    // reintentar el resume aquí, no solo en unlock(), evita pitidos mudos.
    if (c.state === 'suspended') c.resume().catch(() => {});
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const now = c.currentTime;
      // Rampa de ataque corta: sin ella el gain salta de golpe a 0.15 y
      // se oye como un click/pop al empezar cada tono.
      const attack = Math.min(0.012, durationMs / 1000 / 4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + durationMs / 1000);
    } catch (e) { /* no-op: audio no disponible */ }
  }

  function playTick() {
    tone(880, 90, 'sine');
  }

  function playTransition(phaseType) {
    const freqs = { work: 660, rest: 440, prep: 554 };
    tone(freqs[phaseType] || 523, 220, 'triangle');
  }

  function playComplete() {
    tone(523, 150, 'triangle');
    setTimeout(function () { tone(784, 250, 'triangle'); }, 150);
  }

  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* no-op */ }
  }

  function setEnabled(value) { enabled = value; }
  function isEnabled() { return enabled; }

  return { unlock, playTick, playTransition, playComplete, vibrate, setEnabled, isEnabled };
}
