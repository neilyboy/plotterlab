// Reaction–Diffusion (Gray–Scott) field -> iso-contours
// Produces organic cellular lines by simulating U/V chemicals, then
// marching squares on the V field.

export function reactionContours({
  cols = 180,
  rows = 120,
  steps = 500,
  feed = 0.036,
  kill = 0.062,
  diffU = 0.16,
  diffV = 0.08,
  dt = 1.0,
  iso = 0.5,
  margin = 20,
  width = 420,
  height = 297,
}) {
  const nx = Math.max(16, Math.floor(cols))
  const ny = Math.max(16, Math.floor(rows))
  const N = nx * ny
  const U = new Float32Array(N)
  const V = new Float32Array(N)
  const U2 = new Float32Array(N)
  const V2 = new Float32Array(N)

  // Initialize: U ~ 1, V ~ 0 with a central seeded blob
  for (let i = 0; i < N; i++) U[i] = 1, V[i] = 0
  const cx = Math.floor(nx / 2)
  const cy = Math.floor(ny / 2)
  const rad = Math.max(4, Math.min(Math.floor(Math.min(nx, ny) * 0.12), 32))
  for (let y = -rad; y <= rad; y++) {
    for (let x = -rad; x <= rad; x++) {
      const ix = cx + x, iy = cy + y
      if (ix <= 1 || iy <= 1 || ix >= nx - 2 || iy >= ny - 2) continue
      const d2 = x * x + y * y
      if (d2 <= rad * rad) {
        const k = iy * nx + ix
        U[k] = 0.5
        V[k] = 0.25
      }
    }
  }

  // 3x3 Laplacian kernel (common weights used for Gray–Scott discretization)
  const k00 = 0.05, k01 = 0.2, k02 = 0.05
  const k10 = 0.2,  k11 = -1.0, k12 = 0.2
  const k20 = 0.05, k21 = 0.2, k22 = 0.05

  function idx(x, y) {
    // clamp at borders
    const ix = x < 0 ? 0 : (x >= nx ? nx - 1 : x)
    const iy = y < 0 ? 0 : (y >= ny ? ny - 1 : y)
    return iy * nx + ix
  }

  for (let s = 0, S = Math.max(1, Math.floor(steps)); s < S; s++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i00 = idx(x - 1, y - 1), i01 = idx(x, y - 1), i02 = idx(x + 1, y - 1)
        const i10 = idx(x - 1, y),     i11 = idx(x, y),     i12 = idx(x + 1, y)
        const i20 = idx(x - 1, y + 1), i21 = idx(x, y + 1), i22 = idx(x + 1, y + 1)

        const u = U[i11], v = V[i11]
        const lapU = (
          U[i00] * k00 + U[i01] * k01 + U[i02] * k02 +
          U[i10] * k10 + U[i11] * k11 + U[i12] * k12 +
          U[i20] * k20 + U[i21] * k21 + U[i22] * k22
        )
        const lapV = (
          V[i00] * k00 + V[i01] * k01 + V[i02] * k02 +
          V[i10] * k10 + V[i11] * k11 + V[i12] * k12 +
          V[i20] * k20 + V[i21] * k21 + V[i22] * k22
        )

        const uvv = u * v * v
        const du = diffU * lapU - uvv + feed * (1 - u)
        const dv = diffV * lapV + uvv - (kill + feed) * v
        let un = u + du * dt
        let vn = v + dv * dt
        if (un < 0) un = 0; else if (un > 1) un = 1
        if (vn < 0) vn = 0; else if (vn > 1) vn = 1
        U2[i11] = un; V2[i11] = vn
      }
    }
    // swap
    for (let i = 0; i < N; i++) { U[i] = U2[i]; V[i] = V2[i] }
  }

  // Marching squares on V field at iso level
  const W = width - margin * 2
  const H = height - margin * 2
  const originX = margin
  const originY = margin

  function interp(x0, y0, v0, x1, y1, v1, t) {
    const d = v1 - v0 || 1e-12
    const a = (t - v0) / d
    return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]
  }

  function buildSegmentsAtIso(isoLevel) {
    const segsLocal = []
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const i00 = j * nx + i
        const i10 = j * nx + (i + 1)
        const i01 = (j + 1) * nx + i
        const i11 = (j + 1) * nx + (i + 1)
        const v00 = V[i00], v10 = V[i10], v01 = V[i01], v11 = V[i11]
        let idxMask = 0
        if (v00 > isoLevel) idxMask |= 1
        if (v10 > isoLevel) idxMask |= 2
        if (v11 > isoLevel) idxMask |= 4
        if (v01 > isoLevel) idxMask |= 8
        if (idxMask === 0 || idxMask === 15) continue

        const x0 = originX + (i / (nx - 1)) * W
        const y0 = originY + (j / (ny - 1)) * H
        const x1 = originX + ((i + 1) / (nx - 1)) * W
        const y1 = originY + ((j + 1) / (ny - 1)) * H

        const e = {}
        if ((idxMask & 1) !== (idxMask & 2)) e.a = interp(x0, y0, v00, x1, y0, v10, isoLevel)
        if ((idxMask & 2) !== (idxMask & 4)) e.b = interp(x1, y0, v10, x1, y1, v11, isoLevel)
        if ((idxMask & 4) !== (idxMask & 8)) e.c = interp(x1, y1, v11, x0, y1, v01, isoLevel)
        if ((idxMask & 8) !== (idxMask & 1)) e.d = interp(x0, y1, v01, x0, y0, v00, isoLevel)

        const cases = {
          1:  ['d','a'], 2:  ['a','b'], 3:  ['d','b'], 4:  ['b','c'], 5:  ['d','a','b','c'], 6:  ['a','c'], 7:  ['d','c'],
          8:  ['c','d'], 9:  ['a','c'],10: ['a','b','c','d'],11: ['b','d'],12: ['b','d'],13: ['a','b'],14: ['d','a']
        }
        const con = cases[idxMask]
        if (!con) continue
        for (let k = 0; k < con.length; k += 2) {
          const p = e[con[k]]
          const q = e[con[k + 1]]
          if (p && q) segsLocal.push([p, q])
        }
      }
    }
    return segsLocal
  }

  // First attempt with provided iso; adapt if the simulated field saturates.
  let segs = buildSegmentsAtIso(iso)
  if (segs.length === 0) {
    // Compute V range and try a midpoint iso within the actual range
    let minV = 1, maxV = 0
    for (let i = 0; i < N; i++) { const v = V[i]; if (v < minV) minV = v; if (v > maxV) maxV = v }
    if (maxV - minV > 1e-6) {
      const mid = minV + (maxV - minV) * 0.5
      segs = buildSegmentsAtIso(mid)
      if (segs.length === 0) {
        const alt = minV + (maxV - minV) * 0.3
        segs = buildSegmentsAtIso(alt)
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
