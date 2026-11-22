// Sight geometry: rays and line-of-sight against the level's rectangles.
// Walls and cover are rectangles, so a ray's travel is the nearest slab
// intersection over all of them — cheap enough to fan a full vision cone
// for every guard and camera on every frame.

// Distance from (ox, oy) along unit direction (dx, dy) to the nearest
// rectangle edge, or maxDist when nothing is hit.
export function rayDistance(ox, oy, dx, dy, rects, maxDist) {
  let best = maxDist;
  for (const r of rects) {
    // Slab test against one rectangle.
    let tmin = 0;
    let tmax = best;
    if (Math.abs(dx) < 1e-9) {
      if (ox < r.x || ox > r.x + r.w) continue;
    } else {
      let t1 = (r.x - ox) / dx;
      let t2 = (r.x + r.w - ox) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (Math.abs(dy) < 1e-9) {
      if (oy < r.y || oy > r.y + r.h) continue;
    } else {
      let t1 = (r.y - oy) / dy;
      let t2 = (r.y + r.h - oy) / dy;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (tmin > 0 && tmin < best) best = tmin;
  }
  return best;
}

// True when the straight line between two points crosses any rectangle.
export function lineBlocked(x1, y1, x2, y2, rects) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return false;
  // A hair inside both ends so standing flush against cover still reads.
  const hit = rayDistance(x1, y1, dx / dist, dy / dist, rects, dist - 1);
  return hit < dist - 1;
}

// The visible polygon of a cone: fan rays across the arc and keep each
// ray's end point. halfAngle in radians, range in pixels.
export function conePolygon(ox, oy, facing, halfAngle, range, rects, steps = 26) {
  const points = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const angle = facing - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const d = rayDistance(ox, oy, dx, dy, rects, range);
    points.push([ox + dx * d, oy + dy * d]);
  }
  return points;
}

// Can an eye at (ex, ey) looking along `facing` see the target point?
// Checks range, cone angle and a clear line of sight.
export function canSee(ex, ey, facing, halfAngle, range, tx, ty, rects) {
  const dx = tx - ex;
  const dy = ty - ey;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  let diff = Math.atan2(dy, dx) - facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return { seen: false, dist };
  return { seen: !lineBlocked(ex, ey, tx, ty, rects), dist };
}
