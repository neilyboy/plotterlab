// Geometry utilities for building SVG paths from polylines

export function polylineToPath(points) {
  if (!points || points.length === 0) return ''
  const [first, ...rest] = points
  const move = `M ${first[0].toFixed(3)} ${first[1].toFixed(3)}`
  const lines = rest.map(p => `L ${p[0].toFixed(3)} ${p[1].toFixed(3)}`)
  return [move, ...lines].join(' ')
}

export function arcPoints(cx, cy, r, a0, a1, segments = 24) {
  const pts = []
  const span = a1 - a0
  const step = span === 0 ? 0 : span / segments
  for (let i = 0; i <= segments; i++) {
    const a = a0 + step * i
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

export function lerp(a, b, t) { return a + (b - a) * t }
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export function translatePolyline(poly, dx, dy) {
  return poly.map(([x,y]) => [x + dx, y + dy])
}

export function closePolyline(poly) {
  if (poly.length === 0) return poly
  const [x0, y0] = poly[0]
  const [xn, yn] = poly[poly.length-1]
  if (x0 === xn && y0 === yn) return poly
  return [...poly, [x0, y0]]
}
