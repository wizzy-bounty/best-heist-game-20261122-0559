// Guards: waypoint patrols with sweeping vision cones.
// A guard walks its loop, pauses at each corner to look around, and walks
// faster as the alarm climbs. Whether it sees the thief is decided in
// alarms.js from the guard's eye, facing and cone — this file only moves
// the guard and keeps its facing honest.

import { moveCircle } from './physics.js';

export const GUARD_CONE = { halfAngle: 0.56, range: 190 };
export const GUARD_RADIUS = 11;

export class Guard {
  constructor(patrol) {
    this.name = patrol.name;
    this.minAlarm = patrol.minAlarm;
    this.points = patrol.points;
    this.x = patrol.points[0][0];
    this.y = patrol.points[0][1];
    this.radius = GUARD_RADIUS;
    this.target = 1;
    this.pauseLeft = 0;
    this.facing = Math.atan2(
      patrol.points[1][1] - this.y,
      patrol.points[1][0] - this.x,
    );
    this.sweepPhase = Math.random() * Math.PI * 2;
    this.active = patrol.minAlarm === 0;
  }

  speedFor(alarm) {
    return 62 * (1 + 0.18 * alarm);
  }

  update(dt, alarm, solids) {
    if (!this.active) return;
    if (this.pauseLeft > 0) {
      // At a corner: hold position and sweep the cone side to side.
      this.pauseLeft -= dt;
      this.facing += Math.sin(performance.now() / 480 + this.sweepPhase) * 0.9 * dt;
      return;
    }
    const [tx, ty] = this.points[this.target];
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speedFor(alarm) * dt;
    if (dist <= Math.max(step, 2)) {
      this.target = (this.target + 1) % this.points.length;
      this.pauseLeft = 0.7;
      return;
    }
    const vx = (dx / dist) * step;
    const vy = (dy / dist) * step;
    moveCircle(this, vx, vy, solids);
    this.facing = Math.atan2(dy, dx);
  }
}

export function makeGuards(patrols) {
  return patrols.map((patrol) => new Guard(patrol));
}

// Reinforcements take the floor the moment the alarm reaches their level.
export function activateReinforcements(guards, alarm) {
  for (const guard of guards) {
    if (!guard.active && guard.minAlarm <= alarm) {
      guard.active = true;
      guard.x = guard.points[0][0];
      guard.y = guard.points[0][1];
    }
  }
}
