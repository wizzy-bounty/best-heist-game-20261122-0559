// The alarm system: one detection meter fed by guard cones, camera
// exposure timers, and laser tripwires. Every source raises the same
// alarm, levels 0..3 — patrols speed up, reinforcements arrive, and at
// level 3 the lockdown doors slam. A full meter at level 3 ends the run.

import { canSee, lineBlocked } from './vision.js';
import { GUARD_CONE } from './guards.js';
import { blipAlarm } from './audio.js';

export const CAMERA_CONE = { halfAngle: 0.42, range: 175 };
export const CAMERA_EXPOSURE_SECONDS = 1.5;

export class AlarmSystem {
  constructor() {
    this.level = 0;
    this.meter = 0;             // 0..1 guard detection
    this.spottedCount = 0;      // times the meter filled (kills the ghost bonus)
    this.raiseCooldown = 0;     // grace between raises
    this.flash = 0;             // red edge flash timer after a raise
    this.cameraExposure = 0;    // 0..1 toward CAMERA_EXPOSURE_SECONDS
    this.laserCooldowns = new Map();
    this.lastRaiseReason = '';
  }

  raiseAlarm(reason, state) {
    if (this.raiseCooldown > 0 || this.level >= 3) return false;
    this.level += 1;
    this.raiseCooldown = 1.2;
    this.flash = 0.7;
    this.lastRaiseReason = reason;
    blipAlarm();
    return true;
  }

  laserIsLive(laser, t) {
    const phase = ((t + laser.phase) % laser.period) / laser.period;
    return phase < laser.duty;
  }

  // Advances every detection source. Returns events main.js reacts to:
  // { raised: 'guard'|'camera'|'laser'|null, busted: boolean }.
  update(dt, t, world) {
    const events = { raised: null, busted: false };
    this.raiseCooldown = Math.max(0, this.raiseCooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    const { player, guards, cameras, lasers, blockers } = world;

    // Guard cones: the meter fills faster the closer and louder the thief.
    let seen = false;
    let fillRate = 0;
    for (const guard of guards) {
      if (!guard.active) continue;
      const { seen: inCone, dist } = canSee(
        guard.x, guard.y, guard.facing, GUARD_CONE.halfAngle, GUARD_CONE.range,
        player.x, player.y, blockers,
      );
      if (inCone) {
        seen = true;
        const closeness = 1.25 - dist / GUARD_CONE.range;
        fillRate = Math.max(fillRate, 0.55 * closeness * (player.running ? 1.5 : 1));
      }
      // A guard who walks into the thief catches them on the spot.
      if (Math.hypot(guard.x - player.x, guard.y - player.y) < guard.radius + player.radius - 4) {
        events.busted = true;
      }
    }
    if (seen) this.meter = Math.min(1, this.meter + fillRate * dt);
    else this.meter = Math.max(0, this.meter - 0.35 * dt);

    if (this.meter >= 1) {
      this.spottedCount += 1;
      if (this.level >= 3) events.busted = true;
      else if (this.raiseAlarm('guard', world)) events.raised = 'guard';
      this.meter = 0.45;
    }

    // Cameras: exposure builds while the thief stands in a sweep cone.
    let onCamera = false;
    for (const cam of cameras) {
      const angle = cam.base + Math.sin(t * cam.speed) * cam.sweep;
      const { seen: inCone } = canSee(
        cam.x, cam.y, angle, CAMERA_CONE.halfAngle, cam.range,
        player.x, player.y, blockers,
      );
      if (inCone) onCamera = true;
    }
    if (onCamera) this.cameraExposure = Math.min(1, this.cameraExposure + dt / CAMERA_EXPOSURE_SECONDS);
    else this.cameraExposure = Math.max(0, this.cameraExposure - dt / CAMERA_EXPOSURE_SECONDS * 0.6);
    if (this.cameraExposure >= 1) {
      this.cameraExposure = 0;
      if (this.raiseAlarm('camera', world)) events.raised = 'camera';
    }

    // Lasers: crossing a live beam trips it once per beam per 3 seconds.
    for (const laser of lasers) {
      const cooldown = this.laserCooldowns.get(laser) ?? 0;
      if (cooldown > 0) this.laserCooldowns.set(laser, cooldown - dt);
      if (!this.laserIsLive(laser, t)) continue;
      const crossed = (player.x - laser.x) * (world.prevPlayerX - laser.x) < 0
        && player.y > laser.y0 && player.y < laser.y1;
      const standing = Math.abs(player.x - laser.x) < 4
        && player.y > laser.y0 && player.y < laser.y1
        && !lineBlocked(laser.x, laser.y0, laser.x, laser.y1, []);
      if ((crossed || (standing && Math.abs(world.prevPlayerX - laser.x) < 4)) && cooldown <= 0) {
        this.laserCooldowns.set(laser, 3);
        if (this.raiseAlarm('laser', world)) events.raised = 'laser';
      }
    }
    return events;
  }
}
