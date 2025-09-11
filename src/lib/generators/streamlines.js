import { makeRNG } from '../random.js'

// Continuous streamlines packed with a spacing constraint to minimize pen-ups.
// Seeds are distributed on a grid; each seed traces forward and backward along
// a simplex-noise vector field until it exits the page or approaches an
// occupied area closer than minSpacing. Output is a set of long polylines.
//
// Params
// - seedsX, seedsY: seed grid resolution
// - minSpacing: minimum distance between distinct streamlines (mm)
// - stepLen: integration step length (mm)
// - maxSteps: max steps per half-trajectory
// - noiseScale: scale for noise lookup (per mm)
// - curl: scaling of velocity
// - jitter: small random offset to seed points
// - margin, width, height, seed
export function streamlines({
  seedsX = 36,
  seedsY = 26,
  minSpacing = 2.6,
  stepLen = 1.4,
  maxSteps = 480,
  noiseScale = 0.015,
  curl = 1.0,
  jitter = 0.35,
  followOnly = false,
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed'
}) {
  const { noise2D, rand, range } = makeRNG(seed)
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const W = maxX - minX, H = maxY - minY

  // Occupancy grid for packing (coarse to be fast)
  const cell = Math.max(1, Math.min(minSpacing * 0.5, 4))
  const gx = Math.max(4, Math.floor(W / cell))
  const gy = Math.max(4, Math.floor(H / cell))
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

  function dir(x, y) {
    // Unit vector from angle field
    const a = noise2D(x * noiseScale, y * noiseScale) * Math.PI * 2
    return [Math.cos(a), Math.sin(a)]
  }

  function trace(x0, y0, sgn) {
    const pts = []
    let x = x0, y = y0
    for (let i = 0; i < maxSteps; i++) {
      const [vx, vy] = dir(x, y)
      x += vx * stepLen * curl * sgn
      y += vy * stepLen * curl * sgn
      if (x <= minX || x >= maxX || y <= minY || y >= maxY) break
      if (nearOccupied(x, y)) break
      pts.push([x, y])
    }
    return pts
  }

  const polylines = []
  for (let j = 0; j < seedsY; j++) {
    for (let i = 0; i < seedsX; i++) {
      const sx = minX + (i + 0.5) * (W / seedsX) + range(-1, 1) * jitter
      const sy = minY + (j + 0.5) * (H / seedsY) + range(-1, 1) * jitter
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
