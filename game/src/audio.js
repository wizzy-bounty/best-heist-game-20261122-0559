// Generated sound effects: tiny WebAudio blips, no audio files.
// The context is created lazily on the first user gesture; every call is
// wrapped so a blocked or missing AudioContext can never break the game.

let ctx = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, seconds, type = 'square', gain = 0.05, when = 0) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds);
  } catch {
    /* sound is decoration only */
  }
}

export function blipLoot() { tone(880, 0.09, 'square', 0.04); tone(1320, 0.12, 'square', 0.04, 0.07); }
export function blipCrackTick(progress) { tone(300 + progress * 500, 0.05, 'square', 0.03); }
export function blipCracked() { tone(523, 0.12, 'triangle', 0.06); tone(784, 0.16, 'triangle', 0.06, 0.1); tone(1046, 0.22, 'triangle', 0.06, 0.2); }
export function blipAlarm() { tone(220, 0.18, 'sawtooth', 0.07); tone(185, 0.24, 'sawtooth', 0.07, 0.16); }
export function blipStep() { tone(140, 0.03, 'sine', 0.012); }
export function blipWin() { tone(659, 0.14, 'triangle', 0.06); tone(880, 0.14, 'triangle', 0.06, 0.12); tone(1108, 0.3, 'triangle', 0.06, 0.24); }
