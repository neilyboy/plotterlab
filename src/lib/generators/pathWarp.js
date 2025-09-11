// Path Warp generator
// Warps source polylines by a noise field. Useful to "link" a layer as a source
// and push it through a flow/noise field for variations or outlines.

import { makeRNG } from '../random.js'

function resamplePolyline(p, step) {
  if (!p || p.length < 2) return []
  const out = []
  let ax = p[0][0], ay = p[0][1]
  out.push([ax, ay])
  let carry = 0
  for (let i = 1; i < p.length; i++) {
    let bx = p[i][0], by = p[i][1]
    let dx = bx - ax, dy = by - ay
    let L = Math.hypot(dx, dy)
    if (L <= 1e-9) continue
    let nx = dx / L, ny = dy / L
    let t = step - carry
    while (t < L) {
      const x = ax + nx * t
      const y = ay + ny * t
      out.push([x, y])
      t += step
    }
    carry = L - (t - step)
    ax = bx; ay = by
  }
  // Ensure the last point is included
  const last = p[p.length - 1]
  const oLast = out[out.length - 1]
  if (!oLast || Math.hypot(oLast[0]-last[0], oLast[1]-last[1]) > 1e-6) out.push([last[0], last[1]])
  return out
}

export function pathWarp({ width, height, margin = 20, seed, srcPolys = [], amp = 4, scale = 0.02, step = 1.2, copies = 1, rotateFlow = false, onProgress }) {
  copies = Math.max(1, Math.floor(copies || 1))
  const rng = makeRNG(seed)
  const noise2D = rng.noise2D
  amp = Math.max(0, Number(amp) || 0)
  scale = Math.max(0.0001, Number(scale) || 0.01)
  step = Math.max(0.6, Number(step) || 1.2)

  if (!Array.isArray(srcPolys) || srcPolys.length === 0) return []
  const total = srcPolys.reduce((a,p)=>a+(p?.length||0),0) * copies
  let done = 0

  const out = []
  for (let c = 0; c < copies; c++) {
    const phase = (c / Math.max(1, copies)) * Math.PI * 2
    for (const P of srcPolys) {
      const base = resamplePolyline(P, step)
      const warped = []
      for (let i = 0; i < base.length; i++) {
        const [x, y] = base[i]
        const n = noise2D(x * scale, y * scale) // [-1,1]
        const theta = n * Math.PI + phase // [-pi, pi] + phase
        let vx = Math.cos(theta)
        let vy = Math.sin(theta)
        if (!rotateFlow && i > 0) {
          // Use local tangent; push mostly perpendicular for a flowing outline look
          const px = base[i-1][0], py = base[i-1][1]
          const tx = x - px, ty = y - py
          const L = Math.hypot(tx, ty) || 1
          const nx = -ty / L, ny = tx / L
          vx = nx * (0.7 + 0.3 * vx)
          vy = ny * (0.7 + 0.3 * vy)
        }
        const wx = x + vx * amp
        const wy = y + vy * amp
        warped.push([wx, wy])
        if (onProgress && (done++ % 2000 === 0)) onProgress(done / total)
      }
      out.push(warped)
    }
  }
  return out
}
