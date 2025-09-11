import { makeRNG } from '../random.js'

// Lathe-like concentric contour lines from an implicit 2D field
// The field is the sum of two Gaussian lobes centered at (0, ±sep).
// We extract multiple iso-contours via marching squares to produce onion-like rings
// reminiscent of lathe/plotter illusions.
//
// Params
// - cols, rows: grid resolution for marching squares
// - levels: number of iso-levels to extract (outermost to innermost)
// - separation: vertical distance between the two lobes (mm)
// - sigmaX, sigmaY: Gaussian radii (mm)
// - amplitude: field amplitude
// - bias: baseline subtraction; higher bias -> tighter shapes (defaults to 0.2)
// - warp: small noise warp amount (mm)
// - margin, width, height
export function isoContours({
  cols = 140,
  rows = 100,
  levels = 60,
  separation = 70,
  lobes = 2,
  sigmaX = 80,
  sigmaY = 55,
  amplitude = 1,
  bias = 0.18,
  warp = 0,
  seed = 'seed',
  margin = 20,
  width = 420,
  height = 297,
  overscan = 0.08, // sample a bit beyond page edges to encourage closed rings
}) {
  const { noise2D } = makeRNG(seed)
  const W = width - margin * 2
  const H = height - margin * 2
  const cx = width / 2
  const cy = height / 2
  // Overscan sampling domain (extend beyond page to avoid open chains at boundaries)
  const SW = W * (1 + Math.max(0, overscan) * 2)
  const SH = H * (1 + Math.max(0, overscan) * 2)

  const s2x = sigmaX * sigmaX
  const s2y = sigmaY * sigmaY
  const h = separation * 0.5

  function field(x, y) {
    // Optional small warp so contours don't look too perfect
    let wx = x, wy = y
    if (warp > 0) {
      const nx = noise2D(x * 0.01, y * 0.01)
      const ny = noise2D(x * 0.0123 + 11.7, y * 0.0087 - 4.2)
      wx += nx * warp
      wy += ny * warp
    }
    // Build vertically stacked lobe centers for any integer N (>=1), with
    // 'separation' interpreted as distance between adjacent lobe centers.
    // N=1 => [0]; N=2 => [-0.5s, +0.5s]; N=3 => [-s, 0, +s]; N=4 => [-1.5s, -0.5s, +0.5s, +1.5s]
    const N = Math.max(1, Math.floor(lobes))
    const s = separation
    const mid = (N - 1) / 2
    const centers = Array.from({ length: N }, (_, i) => (i - mid) * s)
    let sum = 0
    for (const cy of centers) {
      const dx = wx
      const dy = wy - cy
      sum += Math.exp(-(dx*dx / s2x + dy*dy / s2y))
    }
    return amplitude * sum - bias
  }

  // Sample grid in local coords centered at (cx,cy) over overscanned domain
  const nx = Math.max(8, Math.floor(cols))
  const ny = Math.max(8, Math.floor(rows))
  const gx = new Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = -SW/2 + (i / (nx - 1)) * SW
      const y = -SH/2 + (j / (ny - 1)) * SH
      gx[j*nx + i] = field(x, y)
    }
  }

  // Build iso values from high to low so we draw outer to inner
  // Peak near lobe centers ~= amplitude - bias; clamp within [0.02, 0.95]
  const vMax = Math.max(0.05, Math.min(1.2, amplitude - bias + 0.2))
  const vMin = Math.max(-0.8, vMax * 0.05)
  const iso = []
  for (let k = 0; k < Math.max(1, levels); k++) {
    const t = k / Math.max(1, levels - 1)
    iso.push(vMax * (1 - t) + vMin * t)
  }

  // Marching Squares for each iso
  function interp(x0, y0, v0, x1, y1, v1, t) {
    const d = v1 - v0 || 1e-12
    const a = (t - v0) / d
    return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]
  }

  function contoursFor(t) {
    const segs = []
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const i00 = j*nx + i
        const i10 = j*nx + (i+1)
        const i01 = (j+1)*nx + i
        const i11 = (j+1)*nx + (i+1)
        const v00 = gx[i00], v10 = gx[i10], v01 = gx[i01], v11 = gx[i11]
        let idx = 0
        if (v00 > t) idx |= 1
        if (v10 > t) idx |= 2
        if (v11 > t) idx |= 4
        if (v01 > t) idx |= 8
        if (idx === 0 || idx === 15) continue
        const x0 = -SW/2 + (i / (nx - 1)) * SW
        const y0 = -SH/2 + (j / (ny - 1)) * SH
        const x1 = -SW/2 + ((i+1) / (nx - 1)) * SW
        const y1 = -SH/2 + ((j+1) / (ny - 1)) * SH

        // Edge points
        const e = {}
        if ((idx & 1) !== (idx & 2)) e.a = interp(x0, y0, v00, x1, y0, v10, t)
        if ((idx & 2) !== (idx & 4)) e.b = interp(x1, y0, v10, x1, y1, v11, t)
        if ((idx & 4) !== (idx & 8)) e.c = interp(x1, y1, v11, x0, y1, v01, t)
        if ((idx & 8) !== (idx & 1)) e.d = interp(x0, y1, v01, x0, y0, v00, t)

        // Cases: connect edges according to MS table (handling ambiguous via simple rule)
        const cases = {
          1:  ['d','a'], 2:  ['a','b'], 3:  ['d','b'], 4:  ['b','c'], 5:  ['d','a','b','c'], 6:  ['a','c'], 7:  ['d','c'],
          8:  ['c','d'], 9:  ['a','c'],10: ['a','b','c','d'],11: ['b','d'],12: ['b','d'],13: ['a','b'],14: ['d','a']
        }
        const con = cases[idx]
        if (!con) continue
        for (let k = 0; k < con.length; k += 2) {
          const p = e[con[k]]
          const q = e[con[k+1]]
          if (p && q) segs.push([p, q])
        }
      }
    }
    // Stitch segments into polylines
    const map = new Map()
    const key = (pt) => `${Math.round((pt[0]+SW/2)*10)},${Math.round((pt[1]+SH/2)*10)}`
    for (const [p, q] of segs) {
      const kp = key(p), kq = key(q)
      const a = map.get(kp) || { p, next: [], prev: [] }
      const b = map.get(kq) || { p: q, next: [], prev: [] }
      a.next.push(kq)
      b.prev.push(kp)
      map.set(kp, a)
      map.set(kq, b)
    }
    const visited = new Set()
    const polys = []
    for (const [k0, node] of map.entries()) {
      if (visited.has(k0)) continue
      let curK = k0
      const pts = []
      // Walk forward
      while (true) {
        const n = map.get(curK)
        if (!n || visited.has(curK)) break
        visited.add(curK)
        pts.push(n.p)
        curK = n.next[0]
        if (!curK) break
        if (curK === k0) { // closed loop
          pts.push(map.get(curK).p)
          break
        }
      }
      if (pts.length >= 4) {
        polys.push(pts.map(([x,y]) => [x + cx, y + cy]))
      }
    }
    return polys
  }

  const out = []
  for (const t of iso) {
    const polys = contoursFor(t)
    for (const p of polys) out.push(p)
  }
  return out
}
