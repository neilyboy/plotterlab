import { makeRNG } from '../random.js'

// Flow Ribbons: long streamlines following a swirl field made of several
// Gaussian-centered vortices plus a small base drift and noise.
// The look aims for wispy cloth/smoke contours you can tweak with a few sliders.
//
// Params
// - seedsX, seedsY: seed grid resolution
// - minSpacing: packing distance between distinct ribbons (mm)
// - stepLen: integration step length (mm)
// - maxSteps: max steps per trajectory
// - centers: number of swirl centers (>=1)
// - sep: vertical distance between adjacent centers (mm)
// - sigma: radius controlling swirl falloff (mm)
// - swirl: swirl strength (larger => tighter spiral)
// - swirlAlt: if true, alternates rotation sign across centers for twist
// - baseAngleDeg: base drift direction in degrees
// - drift: base drift magnitude (0..1 typical)
// - noiseAmp: amplitude of noise vector (0 disables)
// - noiseScale: frequency of noise lookup (per mm)
// - followOnly: if true trace only forward (otherwise forward+backward)
// - margin, width, height, seed
export function flowRibbons({
  seedsX = 42,
  seedsY = 60,
  minSpacing = 1.6,
  stepLen = 0.9,
  maxSteps = 1800,
  centers = 3,
  sep = 160,
  sigma = 90,
  swirl = 1.25,
  swirlAlt = true,
  baseAngleDeg = -18,
  drift = 0.25,
  noiseAmp = 0.15,
  noiseScale = 0.010,
  followOnly = false,
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed'
}) {
  const { noise2D, range } = makeRNG(seed)
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const W = maxX - minX, H = maxY - minY

  const rot90 = (x, y) => [-y, x]
  const angle = baseAngleDeg * Math.PI / 180
  const driftVec = [Math.cos(angle) * drift, Math.sin(angle) * drift]

  // Swirl centers stacked vertically around page center
  const cx = width / 2, cy = height / 2
  const N = Math.max(1, Math.floor(centers))
  const mid = (N - 1) / 2
  const C = Array.from({ length: N }, (_, i) => [cx, cy + (i - mid) * sep])
  const inv2s2 = 1 / (2 * Math.max(1, sigma) * Math.max(1, sigma))

  function field(x, y) {
    // Base drift
    let vx = driftVec[0]
    let vy = driftVec[1]
    // Sum vortices
    for (let i = 0; i < C.length; i++) {
      const sign = swirlAlt ? (i % 2 === 0 ? +1 : -1) : +1
      const dx = x - C[i][0]
      const dy = y - C[i][1]
      const r2 = dx*dx + dy*dy
      const w = Math.exp(-r2 * inv2s2)
      const [rx, ry] = rot90(dx, dy)
      vx += sign * rx * w * swirl / (Math.sqrt(r2) + 1)
      vy += sign * ry * w * swirl / (Math.sqrt(r2) + 1)
    }
    // Small noise push
    if (noiseAmp > 0) {
      const a = noise2D(x * noiseScale, y * noiseScale) * Math.PI * 2
      vx += Math.cos(a) * noiseAmp
      vy += Math.sin(a) * noiseAmp
    }
    // Normalize
    const m = Math.hypot(vx, vy) || 1
    return [vx / m, vy / m]
  }

  // Occupancy grid for packing (fast approximate spacing)
  const cell = Math.max(0.6, Math.min(minSpacing * 0.5, 3))
  const gx = Math.max(8, Math.floor(W / cell))
  const gy = Math.max(8, Math.floor(H / cell))
  const occ = new Uint8Array(gx * gy)
  const idx = (x, y) => {
    const ix = Math.max(0, Math.min(gx - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(gy - 1, Math.floor((y - minY) / cell)))
    return iy * gx + ix
  }
  const mark = (x, y) => { occ[idx(x, y)] = 1 }
  const nearOccupied = (x, y) => {
    const ix = Math.max(0, Math.min(gx - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(gy - 1, Math.floor((y - minY) / cell)))
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const jx = ix + dx, jy = iy + dy
        if (jx < 0 || jy < 0 || jx >= gx || jy >= gy) continue
        if (occ[jy * gx + jx]) return true
      }
    }
    return false
  }

  function trace(x0, y0, sgn) {
    const pts = []
    let x = x0, y = y0
    for (let i = 0; i < maxSteps; i++) {
      const [vx, vy] = field(x, y)
      x += vx * stepLen * sgn
      y += vy * stepLen * sgn
      if (x <= minX || x >= maxX || y <= minY || y >= maxY) break
      if (nearOccupied(x, y)) break
      pts.push([x, y])
    }
    return pts
  }

  const polylines = []
  for (let j = 0; j < seedsY; j++) {
    for (let i = 0; i < seedsX; i++) {
      const sx = minX + (i + 0.5) * (W / seedsX) + range(-0.5, 0.5)
      const sy = minY + (j + 0.5) * (H / seedsY) + range(-0.5, 0.5)
      if (sx <= minX || sx >= maxX || sy <= minY || sy >= maxY) continue
      if (nearOccupied(sx, sy)) continue
      const forward = trace(sx, sy, +1)
      const backward = followOnly ? [] : trace(sx, sy, -1).reverse()
      const pts = backward.concat([[sx, sy]], forward)
      if (pts.length > 4) {
        for (const [x, y] of pts) mark(x, y)
        polylines.push(pts)
      }
    }
  }

  return polylines
}
