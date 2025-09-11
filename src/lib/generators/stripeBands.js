import { makeRNG } from '../random.js'

// Stripe Interference Bands – many iso-contours from a multi-wave field
// Produces high-impact "tube" bands by marching multiple iso levels.
// Field = sum of two oriented plane waves + optional radial term, with optional noise warp.
export function stripeBands({
  cols = 180,
  rows = 120,
  levels = 48,
  isoStart = -0.9,
  isoEnd = 0.9,
  freqX = 0.08,
  freqY = 0.06,
  radialFreq = 0.035,
  radialAmp = 0.6,
  angleDeg = 0,
  warp = 0,
  // Tube-Depth mode: modulate density across repeating bands for a CRT/NES tube look
  tubeDepth = false,
  tubePeriod = 12,       // number of iso steps per band cycle
  tubeMinDuty = 0.15,    // 0..1 fraction kept at band edges
  tubeCurve = 'tri',     // 'tri' | 'sin'
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
  const ang = (angleDeg * Math.PI) / 180
  const c = Math.cos(ang), s = Math.sin(ang)

  function field(x, y) {
    // small warp for organic feel
    let wx = x, wy = y
    if (warp > 0) {
      wx += noise2D(x * 0.02, y * 0.02) * warp
      wy += noise2D(x * 0.018 + 7.1, y * 0.023 - 3.7) * warp
    }
    // rotate
    const ux = wx * c - wy * s
    const uy = wx * s + wy * c
    const wave1 = Math.cos(freqX * ux)
    const wave2 = Math.cos(freqY * uy)
    const r = Math.hypot(wx, wy)
    const radial = radialAmp !== 0 ? Math.cos(radialFreq * r) * radialAmp : 0
    const v = (wave1 + wave2 + radial) / (2 + Math.abs(radialAmp) * 0.999)
    return v
  }

  const nx = Math.max(16, Math.floor(cols))
  const ny = Math.max(16, Math.floor(rows))
  const grid = new Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = -W / 2 + (i / (nx - 1)) * W
      const y = -H / 2 + (j / (ny - 1)) * H
      grid[j * nx + i] = field(x, y)
    }
  }

  function interp(x0, y0, v0, x1, y1, v1, t) {
    const d = v1 - v0 || 1e-12
    const a = (t - v0) / d
    return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]
  }

  function contoursAt(thresh) {
    const segs = []
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const i00 = j * nx + i
        const i10 = j * nx + (i + 1)
        const i01 = (j + 1) * nx + i
        const i11 = (j + 1) * nx + (i + 1)
        const v00 = grid[i00], v10 = grid[i10], v01 = grid[i01], v11 = grid[i11]
        let idx = 0
        if (v00 > thresh) idx |= 1
        if (v10 > thresh) idx |= 2
        if (v11 > thresh) idx |= 4
        if (v01 > thresh) idx |= 8
        if (idx === 0 || idx === 15) continue

        const x0 = margin + (i / (nx - 1)) * W
        const y0 = margin + (j / (ny - 1)) * H
        const x1 = margin + ((i + 1) / (nx - 1)) * W
        const y1 = margin + ((j + 1) / (ny - 1)) * H

        const e = {}
        if ((idx & 1) !== (idx & 2)) e.a = interp(x0, y0, v00, x1, y0, v10, thresh)
        if ((idx & 2) !== (idx & 4)) e.b = interp(x1, y0, v10, x1, y1, v11, thresh)
        if ((idx & 4) !== (idx & 8)) e.c = interp(x1, y1, v11, x0, y1, v01, thresh)
        if ((idx & 8) !== (idx & 1)) e.d = interp(x0, y1, v01, x0, y0, v00, thresh)

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
    // Stitch
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
    const polys = []
    for (const [k0] of map.entries()) {
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
      if (pts.length >= 4) polys.push(pts)
    }
    return polys
  }

  const L = Math.max(1, Math.floor(levels))
  const out = []
  for (let k = 0; k < L; k++) {
    const t = L === 1 ? 0.5 : k / (L - 1)
    const iso = isoStart * (1 - t) + isoEnd * t
    // Tube-Depth: keep fewer iso lines near band edges, more near band centers
    if (tubeDepth) {
      const period = Math.max(1, Math.floor(tubePeriod || 1))
      const idxInBand = period <= 1 ? 0 : (k % period)
      const ph = period <= 1 ? 0.5 : (idxInBand / (period - 1)) // 0..1 across band
      let w
      if (tubeCurve === 'sin') {
        // 0 at edges, 1 at center
        w = 0.5 - 0.5 * Math.cos(2 * Math.PI * ph)
      } else {
        // triangular peak at center
        w = 1 - Math.abs(2 * ph - 1)
      }
      const duty = Math.max(0, Math.min(1, (tubeMinDuty ?? 0.15) + (1 - (tubeMinDuty ?? 0.15)) * w))
      // keep only if within the central duty window of the band
      if (Math.abs(ph - 0.5) > duty * 0.5) continue
    }
    const polys = contoursAt(iso)
    for (const p of polys) out.push(p)
  }
  return out
}
