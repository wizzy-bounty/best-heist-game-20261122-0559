// Rendering: the neon night bank, every system drawn from the same state
// the simulation uses — vision cones raycast against the real walls, the
// detection meter and alarm pips in the HUD, a schematic minimap, and the
// title / getaway / busted overlays.

import { ROOMS, LOOT, VAULTS, STAIRS, LASERS, LOCKDOWN_DOORS, TOTAL_LOOT } from './level.js';
import { conePolygon, canSee } from './vision.js';
import { GUARD_CONE } from './guards.js';
import { CAMERA_CONE } from './alarms.js';

const W = 1280;
const H = 720;

function money(n) {
  return '$' + n.toLocaleString('en-US');
}

function tracePolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

export function render(ctx, state) {
  const { alarm } = state;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, W, H);

  drawRooms(ctx, state);
  drawStairs(ctx, state);
  drawLoot(ctx, state);
  drawVaults(ctx, state);
  drawCover(ctx, state);
  drawLasers(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  if (alarm.flash > 0) {
    ctx.strokeStyle = `rgba(255, 40, 60, ${0.75 * alarm.flash})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 77, W - 10, H - 82);
  }
  drawHud(ctx, state);
  drawMinimap(ctx, state);
  drawPrompt(ctx, state);
  drawBanner(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'won') drawEndScreen(ctx, state, true);
  if (state.mode === 'busted') drawEndScreen(ctx, state, false);
}

function drawRooms(ctx, state) {
  for (const room of ROOMS) {
    ctx.fillStyle = room.floor;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    ctx.strokeStyle = room.trim;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x + 1, room.y + 1, room.w - 2, room.h - 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = room.trim;
    ctx.globalAlpha = 0.5;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(room.name, room.x + 10, room.y + 18);
    ctx.globalAlpha = 1;
  }
  // Walls on top of the floor seams.
  ctx.fillStyle = '#39406b';
  for (const wall of state.walls) ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.fillStyle = '#4a528a';
  for (const wall of state.walls) ctx.fillRect(wall.x, wall.y, wall.w, 2);
  // Lockdown doors, when slammed.
  if (state.alarm.level >= 3) {
    for (const door of LOCKDOWN_DOORS) {
      ctx.fillStyle = '#ff3860';
      ctx.fillRect(door.x, door.y, door.w, door.h);
      ctx.fillStyle = '#ffd7de';
      for (let y = door.y + 6; y < door.y + door.h - 4; y += 10) ctx.fillRect(door.x + 2, y, door.w - 4, 3);
    }
  }
}

function drawStairs(ctx, state) {
  const open = state.cracked.has('main');
  ctx.fillStyle = open ? '#0f3a2c' : '#232338';
  ctx.fillRect(STAIRS.x, STAIRS.y, STAIRS.w, STAIRS.h);
  ctx.strokeStyle = open ? '#2fe6a8' : '#5a5a78';
  ctx.lineWidth = 2;
  ctx.strokeRect(STAIRS.x, STAIRS.y, STAIRS.w, STAIRS.h);
  ctx.fillStyle = open ? '#2fe6a8' : '#3d3d58';
  for (let i = 0; i < 5; i++) ctx.fillRect(STAIRS.x + 8 + i * 4, STAIRS.y + 8 + i * 7, STAIRS.w - 16 - i * 8, 3);
  ctx.fillStyle = open ? '#2fe6a8' : '#8a8aa5';
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'ROOF STAIRS — OPEN' : 'ROOF STAIRS — SEALED', STAIRS.x + STAIRS.w / 2, STAIRS.y + STAIRS.h - 6);
  ctx.textAlign = 'left';
}

function drawLoot(ctx, state) {
  for (const item of LOOT) {
    if (state.lootTaken.has(item)) continue;
    const pulse = 0.75 + 0.25 * Math.sin(state.t * 4 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === 'art') {
      ctx.fillStyle = '#0e2a3f';
      ctx.fillRect(-11, -13, 22, 26);
      ctx.strokeStyle = '#ffb52e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-11, -13, 22, 26);
      ctx.fillStyle = '#ff7ad9';
      ctx.beginPath();
      ctx.moveTo(-7, 9);
      ctx.lineTo(0, -6);
      ctx.lineTo(7, 9);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === 'bag') {
      ctx.fillStyle = '#2fe6a8';
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3, -10, 6, 5);
      ctx.fillStyle = '#06382a';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 6);
      ctx.textAlign = 'left';
    } else if (item.kind === 'drive') {
      ctx.fillStyle = '#c8d2ff';
      ctx.fillRect(-9, -6, 18, 12);
      ctx.fillStyle = '#ff5470';
      ctx.fillRect(-6, -3, 4, 4);
    } else {
      // Cash register pile.
      ctx.fillStyle = `rgba(47, 230, 168, ${pulse})`;
      ctx.fillRect(-9, -5, 18, 10);
      ctx.fillStyle = '#0b3d2e';
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }
}

function drawVaults(ctx, state) {
  for (const vault of VAULTS) {
    const d = vault.door;
    const done = state.cracked.has(vault.id);
    ctx.fillStyle = done ? '#123524' : '#3a2c10';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = done ? '#2fe6a8' : '#ffb52e';
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 13, 0, Math.PI * 2);
    ctx.strokeStyle = done ? '#2fe6a8' : '#ffd97a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = done ? '#2fe6a8' : '#ffb52e';
    ctx.font = '700 10px system-ui, sans-serif';
    // Right-aligned at the canvas edge so long labels never clip off-screen.
    ctx.textAlign = 'right';
    ctx.fillText(done ? `${vault.name} — OPEN` : vault.name, 1270, d.y - 6);
    ctx.textAlign = 'left';
    // Cracking progress ring at the interact point.
    if (state.crack && state.crack.vault.id === vault.id) {
      const p = state.crack.progress;
      ctx.beginPath();
      ctx.arc(vault.at.x, vault.at.y, 20, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.strokeStyle = '#2fe6a8';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(vault.at.x, vault.at.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawCover(ctx, state) {
  ctx.fillStyle = '#2b3358';
  for (const block of state.cover) {
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = '#454f7d';
    ctx.fillRect(block.x, block.y, block.w, 3);
    ctx.fillStyle = '#2b3358';
  }
}

function drawLasers(ctx, state) {
  for (const laser of LASERS) {
    const live = state.alarm.laserIsLive(laser, state.t);
    ctx.fillStyle = '#1c1030';
    ctx.fillRect(laser.x - 5, laser.y0 - 6, 10, 8);
    ctx.fillRect(laser.x - 5, laser.y1 - 2, 10, 8);
    if (live) {
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.28)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y0);
      ctx.lineTo(laser.x, laser.y1);
      ctx.stroke();
      ctx.strokeStyle = '#ff3860';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y0);
      ctx.lineTo(laser.x, laser.y1);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 56, 96, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y0);
      ctx.lineTo(laser.x, laser.y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function cameraAngle(cam, t) {
  return cam.base + Math.sin(t * cam.speed) * cam.sweep;
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    const angle = cameraAngle(cam, state.t);
    const sees = canSee(cam.x, cam.y, angle, CAMERA_CONE.halfAngle, cam.range,
      state.player.x, state.player.y, state.blockers).seen;
    const cone = conePolygon(cam.x, cam.y, angle, CAMERA_CONE.halfAngle, cam.range, state.blockers, 18);
    tracePolygon(ctx, cone);
    ctx.fillStyle = sees ? 'rgba(255, 84, 112, 0.20)' : 'rgba(64, 156, 255, 0.13)';
    ctx.fill();
    ctx.fillStyle = '#0d1526';
    ctx.fillRect(cam.x - 7, cam.y - 7, 14, 14);
    ctx.strokeStyle = sees ? '#ff5470' : '#409cff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cam.x - 7, cam.y - 7, 14, 14);
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(angle) * 4, cam.y + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
    ctx.fillStyle = sees ? '#ff5470' : '#9fd0ff';
    ctx.fill();
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    if (!guard.active) continue;
    const sees = canSee(guard.x, guard.y, guard.facing, GUARD_CONE.halfAngle, GUARD_CONE.range,
      state.player.x, state.player.y, state.blockers).seen;
    const cone = conePolygon(guard.x, guard.y, guard.facing, GUARD_CONE.halfAngle, GUARD_CONE.range, state.blockers);
    tracePolygon(ctx, cone);
    ctx.fillStyle = sees ? 'rgba(255, 60, 60, 0.26)' : 'rgba(255, 209, 26, 0.15)';
    ctx.fill();
    ctx.strokeStyle = sees ? 'rgba(255, 60, 60, 0.5)' : 'rgba(255, 209, 26, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Body: navy uniform, cap brim toward facing.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1d3a6e';
    ctx.fill();
    ctx.strokeStyle = '#9fd0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 15, guard.y + Math.sin(guard.facing) * 15);
    ctx.strokeStyle = '#ffd11a';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (sees) {
      ctx.fillStyle = '#ff3c3c';
      ctx.font = '900 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 18);
      ctx.textAlign = 'left';
    }
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  if (p.running) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 27, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 209, 26, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0f1e';
  ctx.fill();
  ctx.strokeStyle = '#2fe6ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point toward facing.
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.facing) * 13, p.y + Math.sin(p.facing) * 13);
  ctx.lineTo(p.x + Math.cos(p.facing + 2.5) * 9, p.y + Math.sin(p.facing + 2.5) * 9);
  ctx.lineTo(p.x + Math.cos(p.facing - 2.5) * 9, p.y + Math.sin(p.facing - 2.5) * 9);
  ctx.closePath();
  ctx.fillStyle = '#2fe6ff';
  ctx.fill();
  // The swag bag grows with the haul.
  const sack = 4 + Math.min(6, state.lootCollected / 2200);
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.facing) * 11, p.y - Math.sin(p.facing) * 11, sack, 0, Math.PI * 2);
  ctx.fillStyle = '#2fe6a8';
  ctx.fill();
}

function drawHud(ctx, state) {
  const { alarm } = state;
  ctx.fillStyle = '#0a0e1d';
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = '#2fe6ff';
  ctx.fillRect(0, 70, W, 2);

  ctx.fillStyle = '#eaf6ff';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('VAULTLIGHT', 16, 30);
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(state.objective, 16, 54);

  // Alarm pips.
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('ALARM', 330, 20);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(342 + i * 22, 38, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < alarm.level ? '#ff3860' : '#232a45';
    ctx.fill();
    ctx.strokeStyle = '#ff3860';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = alarm.level >= 3 ? '#ff3860' : '#8fb8d8';
  ctx.fillText(alarm.level >= 3 ? 'LOCKDOWN' : `LEVEL ${alarm.level}`, 330, 62);

  // Detection meter + camera exposure sliver.
  ctx.fillStyle = '#8fb8d8';
  ctx.fillText('DETECTION', 452, 20);
  ctx.fillStyle = '#232a45';
  ctx.fillRect(452, 26, 300, 14);
  ctx.fillStyle = alarm.meter > 0.75 ? '#ff3860' : alarm.meter > 0.4 ? '#ffb52e' : '#ffd11a';
  ctx.fillRect(452, 26, 300 * alarm.meter, 14);
  ctx.fillStyle = '#232a45';
  ctx.fillRect(452, 44, 300, 5);
  ctx.fillStyle = '#409cff';
  ctx.fillRect(452, 44, 300 * alarm.cameraExposure, 5);
  ctx.fillStyle = '#8fb8d8';
  ctx.fillText('CAMERA EXPOSURE', 452, 62);

  // Loot and vaults.
  ctx.fillStyle = '#2fe6a8';
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.fillText(`LOOT ${money(state.lootCollected)}`, 786, 32);
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`of ${money(TOTAL_LOOT)} in the bank`, 786, 54);
  ctx.fillText(`VAULTS ${state.cracked.size}/3`, 950, 54);

  // Timer, ghost status, controls hint.
  const mm = Math.floor(state.elapsed / 60);
  const ss = String(Math.floor(state.elapsed % 60)).padStart(2, '0');
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${mm}:${ss}`, 1264, 32);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = alarm.spottedCount === 0 ? '#2fe6a8' : '#ff7a90';
  ctx.fillText(alarm.spottedCount === 0 ? 'GHOST — never fully spotted' : `SPOTTED ×${alarm.spottedCount}`, 1264, 54);
  ctx.textAlign = 'left';
}

function drawMinimap(ctx, state) {
  const mx = 22;
  const my = 556;
  const mw = 204;
  const mh = 128;
  const sx = mw / 1280;
  const sy = mh / 632;
  ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#2fe6ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.fillText('MERIDIAN TRUST — FLOOR PLAN', mx + 6, my + 12);
  for (const room of ROOMS) {
    ctx.fillStyle = room.trim;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(mx + room.x * sx, my + 16 + (room.y - 72) * sy, room.w * sx, room.h * sy);
    ctx.globalAlpha = 1;
  }
  for (const vault of VAULTS) {
    ctx.fillStyle = state.cracked.has(vault.id) ? '#2fe6a8' : '#ffb52e';
    ctx.fillRect(mx + vault.door.x * sx - 2, my + 16 + (vault.door.y - 72) * sy, 5, 5);
  }
  ctx.fillStyle = state.cracked.has('main') ? '#2fe6a8' : '#5a5a78';
  ctx.fillRect(mx + STAIRS.x * sx, my + 16 + (STAIRS.y - 72) * sy, STAIRS.w * sx, 4);
  for (const guard of state.guards) {
    if (!guard.active) continue;
    ctx.fillStyle = '#ff5470';
    ctx.fillRect(mx + guard.x * sx - 1.5, my + 16 + (guard.y - 72) * sy - 1.5, 3, 3);
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(mx + state.player.x * sx, my + 16 + (state.player.y - 72) * sy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPrompt(ctx, state) {
  if (!state.promptText || state.mode !== 'play') return;
  ctx.font = '700 15px system-ui, sans-serif';
  const w = ctx.measureText(state.promptText).width + 36;
  const x = (W - w) / 2;
  const y = H - 44;
  ctx.fillStyle = 'rgba(5, 10, 22, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = '#2fe6a8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#d9ffef';
  ctx.textAlign = 'center';
  ctx.fillText(state.promptText, W / 2, y + 20);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, state) {
  if (!state.banner || state.t > state.banner.until) return;
  ctx.font = '800 17px system-ui, sans-serif';
  const w = ctx.measureText(state.banner.text).width + 44;
  const x = (W - w) / 2;
  ctx.fillStyle = 'rgba(20, 4, 10, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x, 86, w, 34, 8);
  ctx.fill();
  ctx.strokeStyle = '#ff3860';
  ctx.stroke();
  ctx.fillStyle = '#ffd7de';
  ctx.textAlign = 'center';
  ctx.fillText(state.banner.text, W / 2, 109);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(3, 5, 12, 0.78)';
  ctx.fillRect(0, 72, W, H - 72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2fe6ff';
  ctx.font = '900 64px system-ui, sans-serif';
  ctx.fillText('VAULTLIGHT', W / 2, 250);
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('One thief. One bank. Every camera awake.', W / 2, 292);
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Slip past the patrols, mind the lasers and cameras, crack the MAIN VAULT,', W / 2, 348);
  ctx.fillText('and take the roof stairs before the alarm hits lockdown.', W / 2, 374);
  ctx.fillStyle = '#ffd11a';
  ctx.fillText('WASD / arrows — move      SHIFT — run (loud)      E — crack vault / interact', W / 2, 424);
  ctx.fillStyle = '#2fe6a8';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.fillText('Press ENTER to start the heist', W / 2, 478);
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, state, won) {
  const info = state.endInfo;
  ctx.fillStyle = 'rgba(3, 5, 12, 0.82)';
  ctx.fillRect(0, 72, W, H - 72);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#2fe6a8' : '#ff3860';
  ctx.font = '900 52px system-ui, sans-serif';
  ctx.fillText(won ? 'CLEAN GETAWAY' : 'BUSTED', W / 2, 240);
  ctx.fillStyle = '#eaf6ff';
  ctx.font = '19px system-ui, sans-serif';
  const lines = [
    `Loot taken: ${money(info.loot)}`,
    `Vaults cracked: ${info.vaults}/3`,
    `Time bonus: ${money(info.timeBonus)}`,
    `Ghost bonus: ${money(info.ghostBonus)}${info.ghostBonus > 0 ? ' (never fully spotted)' : ''}`,
    `FINAL SCORE: ${money(info.total)}`,
  ];
  lines.forEach((line, i) => {
    if (i === lines.length - 1) {
      ctx.fillStyle = '#ffd11a';
      ctx.font = '800 24px system-ui, sans-serif';
    }
    ctx.fillText(line, W / 2, 310 + i * 34);
  });
  ctx.fillStyle = '#8fb8d8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Press R to run it again', W / 2, 520);
  ctx.textAlign = 'left';
}
