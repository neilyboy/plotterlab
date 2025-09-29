// Random Circle Packing generator (approximation)
// Places non-overlapping circles via rejection sampling, then approximates each
// circle as a polyline for plotters.
// Parameters:
// - width, height (injected by app)
// - margin: inner padding
// - minR, maxR: radius range in pixels
// - attempts: total random candidate attempts
// - relax: small shrink applied to radii after placement to increase spacing
// - segments: number of segments per circle polyline (12-128)
// - inside: 'rect' | 'circle' — restrict domain
export function circlePacking({ width, height, margin = 20, minR = 6, maxR = 24, attempts = 6000, relax = 0.9, segments = 36, inside = 'rect' } = {}) {
  const W = Math.max(0, Number(width) || 0)
  const H = Math.max(0, Number(height) || 0)
  const M = Math.max(0, Number(margin) || 0)
  const minRadius = Math.max(1, Number(minR) || 6)
  const maxRadius = Math.max(minRadius, Number(maxR) || 24)
  const N = Math.max(100, Math.floor(Number(attempts) || 6000))
  const seg = Math.max(12, Math.floor(Number(segments) || 36))
  const rect = { x: M, y: M, w: Math.max(0, W - 2*M), h: Math.max(0, H - 2*M) }
  const cx = rect.x + rect.w/2
  const cy = rect.y + rect.h/2
  const Rmax = Math.min(rect.w, rect.h)/2

  const circles = []
  function fits(x, y, r) {
    if (inside === 'circle') {
      const dx = x - cx, dy = y - cy
      if (Math.hypot(dx, dy) + r > Rmax) return false
    } else {
      if (x - r < rect.x || y - r < rect.y || x + r > rect.x + rect.w || y + r > rect.y + rect.h) return false
    }
    for (const c of circles) {
      if (Math.hypot(x - c.x, y - c.y) < (r + c.r)) return false
    }
    return true
  }

  for (let i = 0; i < N; i++) {
    const r = minRadius + Math.random() * (maxRadius - minRadius)
    const x = rect.x + r + Math.random() * (rect.w - 2*r)
    const y = rect.y + r + Math.random() * (rect.h - 2*r)
    if (fits(x, y, r)) circles.push({ x, y, r: r * relax })
  }

  const polys = []
  for (const c of circles) {
    const pts = []
    for (let i = 0; i < seg; i++) {
      const t = (i / seg) * Math.PI * 2
      pts.push([c.x + c.r*Math.cos(t), c.y + c.r*Math.sin(t)])
    }
    pts.push(pts[0])
    polys.push(pts)
  }
  return polys
}
