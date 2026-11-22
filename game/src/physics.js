// Movement physics: a circle sliding against the level's rectangles.
// Axis-separated resolution, so sliding along a desk or wall feels right
// and nothing ever tunnels into a solid at game speeds.

export function moveCircle(body, dx, dy, rects) {
  body.x += dx;
  for (const r of rects) {
    if (circleHitsRect(body, r)) {
      if (dx > 0) body.x = r.x - body.radius;
      else if (dx < 0) body.x = r.x + r.w + body.radius;
    }
  }
  body.y += dy;
  for (const r of rects) {
    if (circleHitsRect(body, r)) {
      if (dy > 0) body.y = r.y - body.radius;
      else if (dy < 0) body.y = r.y + r.h + body.radius;
    }
  }
}

export function circleHitsRect(body, r) {
  const nearX = Math.max(r.x, Math.min(body.x, r.x + r.w));
  const nearY = Math.max(r.y, Math.min(body.y, r.y + r.h));
  const ddx = body.x - nearX;
  const ddy = body.y - nearY;
  return ddx * ddx + ddy * ddy < body.radius * body.radius;
}

export function pointInRect(x, y, r, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}
