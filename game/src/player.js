// The thief: keyboard movement, sprinting, and the interaction scan that
// decides what the context prompt offers (crack a vault, take the stairs).

import { moveCircle } from './physics.js';
import { blipStep } from './audio.js';

export const PLAYER_RADIUS = 10;
const WALK_SPEED = 150;
const RUN_SPEED = 235;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = PLAYER_RADIUS;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.running = false;
    this.stepTimer = 0;
  }

  update(dt, keys, solids) {
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    this.running = this.moving && (keys.has('shift'));
    if (!this.moving) return;
    const len = Math.hypot(dx, dy);
    const speed = this.running ? RUN_SPEED : WALK_SPEED;
    moveCircle(this, (dx / len) * speed * dt, (dy / len) * speed * dt, solids);
    this.facing = Math.atan2(dy, dx);
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      blipStep();
      this.stepTimer = this.running ? 0.24 : 0.36;
    }
  }
}

// What E would do right now: crack the nearest uncracked vault in reach,
// or climb the stairs when standing on them. Null when nothing is in reach.
export function interactionFor(player, vaults, cracked, stairs, mainCracked) {
  for (const vault of vaults) {
    if (cracked.has(vault.id)) continue;
    const d = Math.hypot(player.x - vault.at.x, player.y - vault.at.y);
    if (d < 30) return { kind: 'vault', vault };
  }
  const onStairs = player.x >= stairs.x && player.x <= stairs.x + stairs.w
    && player.y >= stairs.y && player.y <= stairs.y + stairs.h;
  if (onStairs) return { kind: 'stairs', locked: !mainCracked };
  return null;
}
