// VAULTLIGHT — main entry: owns the game state, the loop, vault cracking,
// loot pickup, and the deterministic ?shot=N states the screenshots use.

import {
  WALLS, COVER, LOOT, VAULTS, STAIRS, CAMERAS, LASERS, PATROLS,
  LOCKDOWN_DOORS, PLAYER_START,
} from './level.js';
import { Player, interactionFor } from './player.js';
import { makeGuards, activateReinforcements } from './guards.js';
import { AlarmSystem } from './alarms.js';
import { render } from './render.js';
import { ensureAudio, blipLoot, blipCrackTick, blipCracked, blipWin } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const keys = new Set();
window.addEventListener('keydown', (event) => {
  ensureAudio();
  const key = event.key.toLowerCase();
  if (key.startsWith('arrow') || key === ' ') event.preventDefault();
  keys.add(key === ' ' ? 'space' : key);
  if (state.mode === 'title' && (key === 'enter' || key === ' ')) startRun();
  if ((state.mode === 'won' || state.mode === 'busted') && key === 'r') startRun();
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key === ' ' ? 'space' : key);
});
canvas.addEventListener('pointerdown', () => {
  ensureAudio();
  if (state.mode === 'title') startRun();
});

function freshState() {
  return {
    mode: 'title',
    t: 0,
    elapsed: 0,
    player: new Player(PLAYER_START),
    guards: makeGuards(PATROLS),
    cameras: CAMERAS.map((cam) => ({ ...cam })),
    alarm: new AlarmSystem(),
    cracked: new Set(),
    lootTaken: new Set(),
    lootCollected: 0,
    crack: null,
    crackTick: 0,
    promptText: '',
    banner: null,
    objective: 'Crack the MAIN VAULT to unseal the roof stairs.',
    endInfo: null,
    walls: WALLS,
    cover: COVER,
    get solids() {
      return this.alarm.level >= 3 ? [...WALLS, ...COVER, ...LOCKDOWN_DOORS] : [...WALLS, ...COVER];
    },
    get blockers() {
      return this.solids;
    },
  };
}

let state = freshState();

function startRun() {
  state = freshState();
  state.mode = 'play';
}

function setBanner(text, seconds = 2.6) {
  state.banner = { text, until: state.t + seconds };
}

function scoreInfo(won) {
  const timeBonus = won ? Math.max(0, 600 - Math.floor(state.elapsed)) * 5 : 0;
  const ghostBonus = won && state.alarm.spottedCount === 0 ? 1500 : 0;
  return {
    loot: state.lootCollected,
    vaults: state.cracked.size,
    timeBonus,
    ghostBonus,
    total: state.lootCollected + timeBonus + ghostBonus,
  };
}

function endRun(won) {
  state.mode = won ? 'won' : 'busted';
  state.endInfo = scoreInfo(won);
  if (won) blipWin();
}

function update(dt) {
  state.t += dt;
  if (state.mode !== 'play') return;
  state.elapsed += dt;
  const player = state.player;
  const prevX = player.x;
  const prevY = player.y;

  // Cracking locks the thief in place; moving or releasing E breaks off.
  const interaction = interactionFor(player, VAULTS, state.cracked, STAIRS, state.cracked.has('main'));
  const wantsCrack = keys.has('e') && interaction && interaction.kind === 'vault';
  if (wantsCrack) {
    const vault = interaction.vault;
    if (!state.crack || state.crack.vault.id !== vault.id) {
      state.crack = { vault, progress: 0 };
    }
    state.crack.progress += dt / vault.seconds;
    state.crackTick -= dt;
    if (state.crackTick <= 0) {
      blipCrackTick(state.crack.progress);
      state.crackTick = 0.28;
    }
    if (state.crack.progress >= 1) {
      state.cracked.add(vault.id);
      state.lootCollected += vault.value;
      state.crack = null;
      blipCracked();
      if (vault.id === 'main') {
        state.objective = 'MAIN VAULT CRACKED — take the ROOF STAIRS!';
        setBanner('MAIN VAULT CRACKED — ROOF STAIRS OPEN');
      } else {
        setBanner(`${vault.name} CRACKED — +$${vault.value.toLocaleString('en-US')}`);
      }
    }
  } else {
    state.crack = null;
    player.update(dt, keys, state.solids);
  }

  // Loot pickup.
  for (const item of LOOT) {
    if (state.lootTaken.has(item)) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) < 24) {
      state.lootTaken.add(item);
      state.lootCollected += item.value;
      blipLoot();
    }
  }

  for (const guard of state.guards) guard.update(dt, state.alarm.level, state.solids);

  const events = state.alarm.update(dt, state.t, {
    player,
    guards: state.guards,
    cameras: state.cameras,
    lasers: LASERS,
    blockers: state.blockers,
    prevPlayerX: prevX,
    prevPlayerY: prevY,
  });
  if (events.raised) {
    activateReinforcements(state.guards, state.alarm.level);
    const reason = { guard: 'SPOTTED', camera: 'CAUGHT ON CAMERA', laser: 'LASER TRIPPED' }[events.raised];
    setBanner(`${reason} — ALARM LEVEL ${state.alarm.level}${state.alarm.level >= 3 ? ' — LOCKDOWN' : ''}`);
  }
  if (events.busted) {
    endRun(false);
    return;
  }

  // The stairs end the run, but only once the main vault is open.
  const now = interactionFor(player, VAULTS, state.cracked, STAIRS, state.cracked.has('main'));
  if (now && now.kind === 'stairs' && !now.locked) {
    endRun(true);
    return;
  }

  // Context prompt.
  if (state.crack) {
    state.promptText = `CRACKING ${state.crack.vault.name}… ${Math.floor(state.crack.progress * 100)}% — hold E, stay still`;
  } else if (now && now.kind === 'vault') {
    state.promptText = `Hold E — CRACK ${now.vault.name} (${now.vault.seconds}s, $${now.vault.value.toLocaleString('en-US')})`;
  } else if (now && now.kind === 'stairs' && now.locked) {
    state.promptText = 'ROOF STAIRS — sealed until the MAIN VAULT is cracked';
  } else if (player.running) {
    state.promptText = 'Running is loud — detection fills faster';
  } else {
    state.promptText = '';
  }
}

// --- Deterministic screenshot states (?shot=1..4) -------------------------
// Each setup freezes a real mid-heist moment: positions, facings, meter
// and alarm are set explicitly and time is held, so the frame the maker
// captures is the frame the game would show.

function applyShot(n) {
  state = freshState();
  state.mode = 'play';
  const s = state;
  const setGuard = (index, x, y, facing) => {
    const guard = s.guards[index];
    guard.x = x;
    guard.y = y;
    guard.facing = facing;
  };
  const takeLoot = (indexes, amount) => {
    for (const i of indexes) s.lootTaken.add(LOOT[i]);
    s.lootCollected = amount;
  };

  if (n === 1) {
    s.t = 9.4;
    s.elapsed = 41;
    s.player.x = 250; s.player.y = 520; s.player.facing = 0.4;
    setGuard(1, 338, 468, 2.6);            // lobby guard's cone rakes the thief
    setGuard(0, 150, 320, 0);
    setGuard(3, 700, 360, Math.PI);
    s.alarm.meter = 0.45;
    takeLoot([2, 0], 1400);
    s.promptText = '';
  } else if (n === 2) {
    s.t = 21.7;
    s.elapsed = 88;
    s.player.x = 606; s.player.y = 388; s.player.facing = 0; s.player.running = true;
    setGuard(3, 706, 352, Math.PI);        // corridor guard ahead
    setGuard(5, 600, 560, -Math.PI / 2);   // alarm-1 reinforcement below
    s.guards[5].active = true;
    s.alarm.level = 1;
    s.alarm.meter = 0.3;
    s.alarm.cameraExposure = 0.4;
    takeLoot([2, 3, 0, 5], 3050);
    s.promptText = 'Running is loud — detection fills faster';
  } else if (n === 3) {
    s.t = 47.3;
    s.elapsed = 126;
    s.player.x = 1166; s.player.y = 378; s.player.facing = 0;
    s.crack = { vault: VAULTS[1], progress: 0.62 };
    setGuard(4, 985, 302, 0.7);            // vault guard closing in
    setGuard(5, 620, 600, 0);
    s.guards[5].active = true;
    s.alarm.level = 1;
    s.alarm.meter = 0.55;
    takeLoot([2, 3, 4, 0, 1, 5], 4800);
    s.cracked.add('gold');
    s.lootCollected = 6600;
    s.promptText = 'CRACKING MAIN VAULT… 62% — hold E, stay still';
  } else if (n === 4) {
    s.t = 133.2;
    s.elapsed = 193;
    s.player.x = 894; s.player.y = 295; s.player.facing = -Math.PI / 2;
    s.cracked.add('gold');
    s.cracked.add('main');
    setGuard(4, 1150, 460, -2.2);
    setGuard(5, 700, 655, Math.PI);
    setGuard(6, 1000, 600, -0.6);
    s.guards[5].active = true;
    s.guards[6].active = true;
    s.alarm.level = 2;
    s.alarm.meter = 0.15;
    s.alarm.spottedCount = 1;
    takeLoot([0, 1, 2, 3, 4, 5, 6, 7, 8], 8900);
    s.lootCollected = 12400;
    s.objective = 'MAIN VAULT CRACKED — take the ROOF STAIRS!';
    s.banner = { text: 'ROOF STAIRS OPEN — GO!', until: Infinity };
    s.promptText = '';
  }
  return true;
}

const params = new URLSearchParams(location.search);
const shotParam = Number(params.get('shot'));
const inShotMode = Number.isInteger(shotParam) && shotParam >= 1 && shotParam <= 4;
if (inShotMode) applyShot(shotParam);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!inShotMode) update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook: the maker's headless checks drive and inspect a run through
// this handle (start a run, read the state, place the thief). It changes
// nothing about how the game plays.
window.__vaultlight = { get state() { return state; }, startRun };
