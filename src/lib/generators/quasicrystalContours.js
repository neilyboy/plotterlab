import { makeRNG } from '../random.js'

// Quasicrystal iso-contours using a sum of plane waves at evenly spaced angles.
// f(x,y) = sum_i cos(k * (R@p)·d_i + phase)
// We march an iso-level to produce mesmerizing aperiodic rings/meshes.
export function quasicrystalContours({
  waves = 7,
  freq = 0.07,         // spatial frequency (per mm)
  contrast = 1.2,      // nonlinearity, >1 increases contrast
  phase = 0.0,         // global phase (radians)
  cols = 180,
  rows = 120,
  iso = 0.0,           // iso threshold after contrast mapping
  rotateDeg = 0,
  warp = 0,            // simplex warp amount in mm
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed',
}) {
  const { noise2D } = makeRNG(seed)
  const W = width - margin * 2
  const H = height - margin * 2
  const cx = width / 2
  const cy = height / 2
  const ang0 = (rotateDeg * Math.PI) / 180

  // Precompute directions
  const dirs = []
  const Nw = Math.max(2, Math.floor(waves))
  for (let i = 0; i < Nw; i++) {
    const a = ang0 + (i * Math.PI * 2) / Nw
    dirs.push([Math.cos(a), Math.sin(a)])
  }

  function field(x, y) {
    // optional small warp to avoid too-perfect symmetries
    let wx = x, wy = y
    if (warp > 0) {
      wx += noise2D(x * 0.02, y * 0.02) * warp
      wy += noise2D(x * 0.023 + 3.1, y * 0.017 - 7.2) * warp
    }
    // rotate to center (not required, we already rotate dirs)
    let s = 0
    for (const d of dirs) {
      s += Math.cos(freq * (wx * d[0] + wy * d[1]) + phase)
    }
    // normalize to [-1,1], then map contrast
    const v = s / Nw
    const c = Math.sign(v) * Math.pow(Math.abs(v), contrast)
    return c
  }

  const nx = Math.max(16, Math.floor(cols))
  const ny = Math.max(16, Math.floor(rows))
  const gx = new Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = -W / 2 + (i / (nx - 1)) * W
      const y = -H / 2 + (j / (ny - 1)) * H
      gx[j * nx + i] = field(x, y)
    }
  }

  function interp(x0, y0, v0, x1, y1, v1, t) {
    const d = v1 - v0 || 1e-12
    const a = (t - v0) / d
    return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]
  }

  const segs = []
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const i00 = j * nx + i
      const i10 = j * nx + (i + 1)
      const i01 = (j + 1) * nx + i
      const i11 = (j + 1) * nx + (i + 1)
      const v00 = gx[i00], v10 = gx[i10], v01 = gx[i01], v11 = gx[i11]
      let idx = 0
      if (v00 > iso) idx |= 1
      if (v10 > iso) idx |= 2
      if (v11 > iso) idx |= 4
      if (v01 > iso) idx |= 8
      if (idx === 0 || idx === 15) continue

      const x0 = margin + (i / (nx - 1)) * W
      const y0 = margin + (j / (ny - 1)) * H
      const x1 = margin + ((i + 1) / (nx - 1)) * W
      const y1 = margin + ((j + 1) / (ny - 1)) * H

      const e = {}
      if ((idx & 1) !== (idx & 2)) e.a = interp(x0, y0, v00, x1, y0, v10, iso)
      if ((idx & 2) !== (idx & 4)) e.b = interp(x1, y0, v10, x1, y1, v11, iso)
      if ((idx & 4) !== (idx & 8)) e.c = interp(x1, y1, v11, x0, y1, v01, iso)
      if ((idx & 8) !== (idx & 1)) e.d = interp(x0, y1, v01, x0, y0, v00, iso)

      const cases = {
        1:  ['d','a'], 2:  ['a','b'], 3:  ['d','b'], 4:  ['b','c'], 5:  ['d','a','b','c'], 6:  ['a','c'], 7:  ['d','c'],
        8:  ['c','d'], 9:  ['a','c'],10: ['a','b','c','d'],11: ['b','d'],12: ['b','d'],13: ['a','b'],14: ['d','a']
      }
      const con = cases[idx]
      if (!con) continue
      for (let k = 0; k < con.length; k += 2) {
        const p = e[con[k]]
        const q = e[con[k + 1]]
        if (p && q) segs.push([p, q])
      }
    }
  }

  // Stitch segments into polylines
  const key = (pt) => `${Math.round(pt[0] * 10)},${Math.round(pt[1] * 10)}`
  const map = new Map()
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
  const polylines = []
  for (const [k0, node] of map.entries()) {
    if (visited.has(k0)) continue
    let curK = k0
    const pts = []
    while (true) {
      const n = map.get(curK)
      if (!n || visited.has(curK)) break
      visited.add(curK)
      pts.push(n.p)
      curK = n.next[0]
      if (!curK) break
      if (curK === k0) { pts.push(map.get(curK).p); break }
    }
    if (pts.length >= 4) polylines.push(pts)
  }

  return polylines
}
