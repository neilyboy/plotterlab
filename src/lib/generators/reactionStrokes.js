// Reaction–Diffusion Strokes
// Simulate Gray–Scott RD and trace streamlines tangent to V-field iso-lines.

export function reactionStrokes({
  // RD field params
  cols = 160,
  rows = 110,
  steps = 450,
  feed = 0.036,
  kill = 0.062,
  diffU = 0.16,
  diffV = 0.08,
  dt = 1.0,
  // Stroke tracing params
  seedsX = 36,
  seedsY = 26,
  minSpacing = 2.4,
  stepLen = 1.1,
  maxSteps = 650,
  vMin = 0.18,
  vMax = 0.82,
  jitter = 0.25,
  margin = 20,
  width = 420,
  height = 297,
  onProgress
}) {
  const nx = Math.max(16, Math.floor(cols))
  const ny = Math.max(16, Math.floor(rows))
  const N = nx * ny
  const U = new Float32Array(N)
  const V = new Float32Array(N)
  const U2 = new Float32Array(N)
  const V2 = new Float32Array(N)

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

  const k00 = 0.05, k01 = 0.2, k02 = 0.05
  const k10 = 0.2,  k11 = -1.0, k12 = 0.2
  const k20 = 0.05, k21 = 0.2, k22 = 0.05

  function idx(x, y) {
    const ix = x < 0 ? 0 : (x >= nx ? nx - 1 : x)
    const iy = y < 0 ? 0 : (y >= ny ? ny - 1 : y)
    return iy * nx + ix
  }

  const S = Math.max(1, Math.floor(steps))
  for (let s = 0; s < S; s++) {
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
    for (let i = 0; i < N; i++) { U[i] = U2[i]; V[i] = V2[i] }
    if (onProgress && (s & 7) === 0) onProgress(s / S * 0.4)
  }

  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const W = maxX - minX, H = maxY - minY

  function sampleV(x, y) {
    const gx = (x - minX) / Math.max(1e-9, W)
    const gy = (y - minY) / Math.max(1e-9, H)
    const fx = gx * (nx - 1), fy = gy * (ny - 1)
    const ix = Math.max(0, Math.min(nx - 2, Math.floor(fx)))
    const iy = Math.max(0, Math.min(ny - 2, Math.floor(fy)))
    const tx = fx - ix, ty = fy - iy
    const i00 = iy * nx + ix
    const i10 = i00 + 1
    const i01 = i00 + nx
    const i11 = i01 + 1
    const v00 = V[i00], v10 = V[i10], v01 = V[i01], v11 = V[i11]
    return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty
  }

  function gradV(x, y) {
    // Finite differences in page space mapped into grid space
    const epsX = W / nx
    const epsY = H / ny
    const gx = (sampleV(x + epsX, y) - sampleV(x - epsX, y)) / (2 * epsX)
    const gy = (sampleV(x, y + epsY) - sampleV(x, y - epsY)) / (2 * epsY)
    return [gx, gy]
  }

  // Occupancy grid
  const cell = Math.max(1, Math.min(minSpacing * 0.5, 4))
  const ox = Math.max(4, Math.floor(W / cell))
  const oy = Math.max(4, Math.floor(H / cell))
  const occ = new Uint8Array(ox * oy)
  const oidx = (x, y) => {
    const ix = Math.max(0, Math.min(ox - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(oy - 1, Math.floor((y - minY) / cell)))
    return iy * ox + ix
  }
  const nearOccupied = (x, y) => {
    const ix = Math.max(0, Math.min(ox - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(oy - 1, Math.floor((y - minY) / cell)))
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const jx = ix + dx, jy = iy + dy
      if (jx < 0 || jy < 0 || jx >= ox || jy >= oy) continue
      if (occ[jy * ox + jx]) return true
    }
    return false
  }

  function dir(x, y) {
    const g = gradV(x, y)
    let vx = -g[1], vy = g[0] // tangent to iso-lines (rotate grad 90°)
    const m = Math.hypot(vx, vy)
    if (m < 1e-4) return [0,0]
    return [vx / m, vy / m]
  }

  function trace(x0, y0, sgn) {
    const pts = []
    let x = x0, y = y0
    for (let i = 0; i < maxSteps; i++) {
      const v = sampleV(x, y)
      if (v < vMin || v > vMax) break
      const [vx, vy] = dir(x, y)
      if (!Number.isFinite(vx) || !Number.isFinite(vy) || (vx === 0 && vy === 0)) break
      x += vx * stepLen * sgn
      y += vy * stepLen * sgn
      if (x <= minX || x >= maxX || y <= minY || y >= maxY) break
      if (nearOccupied(x, y)) break
      pts.push([x, y])
    }
    return pts
  }

  const polylines = []
  let traced = 0
  for (let j = 0; j < seedsY; j++) {
    for (let i = 0; i < seedsX; i++) {
      const sx = minX + (i + 0.5) * (W / seedsX) + (Math.random() - 0.5) * jitter
      const sy = minY + (j + 0.5) * (H / seedsY) + (Math.random() - 0.5) * jitter
      if (sx <= minX || sx >= maxX || sy <= minY || sy >= maxY) continue
      if (nearOccupied(sx, sy)) continue
      const v = sampleV(sx, sy)
      if (v < vMin || v > vMax) continue
      const fwd = trace(sx, sy, +1)
      const bwd = trace(sx, sy, -1).reverse()
      const pts = bwd.concat([[sx, sy]], fwd)
      if (pts.length > 4) {
        for (const [x, y] of pts) occ[oidx(x, y)] = 1
        polylines.push(pts)
      }
      traced++
      if (onProgress && (traced & 63) === 0) onProgress(0.4 + 0.6 * (traced / Math.max(1, seedsX * seedsY)))
    }
  }

  return polylines
}
