import { makeRNG } from '../random.js'

// Draws wireframe isometric buildings on a grid as polylines
// params: cols, rows, density, base, height, jitter, margin, seed, width, height
export function isometricCity({ cols = 12, rows = 10, density = 0.8, base = 18, height = 60, jitter = 0.15, margin = 20, seed = 'seed', width = 420, height: H = 297 }) {
  const { rand, range } = makeRNG(seed)

  // Compute projection bounds to center content
  const widthX = (cols + rows) * base
  const heightY = height + (cols + rows) * base * 0.5

  const W = width - margin * 2
  const HH = H - margin * 2

  // Center horizontally, align top to margin
  const minX = -rows * base
  const sx = margin + (W - widthX) / 2 - minX
  const sy = margin + height // so the tallest point touches top margin

  const iso = (x, y, z = 0) => [
    sx + (x - y) * base,
    sy + (x + y) * base * 0.5 - z
  ]

  const polylines = []

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (rand() > density) continue
      const h = range(height * 0.2, height)
      const jx = range(-jitter, jitter)
      const jy = range(-jitter, jitter)

      // 8 corners of the box (1x1 footprint)
      const A = iso(i + jx, j + jy, 0)
      const B = iso(i + 1 + jx, j + jy, 0)
      const C = iso(i + 1 + jx, j + 1 + jy, 0)
      const D = iso(i + jx, j + 1 + jy, 0)

      const A2 = iso(i + jx, j + jy, h)
      const B2 = iso(i + 1 + jx, j + jy, h)
      const C2 = iso(i + 1 + jx, j + 1 + jy, h)
      const D2 = iso(i + jx, j + 1 + jy, h)

      // verticals
      polylines.push([A, A2])
      polylines.push([B, B2])
      polylines.push([C, C2])
      polylines.push([D, D2])

      // top face
      polylines.push([A2, B2, C2, D2, A2])

      // some ground edges for readability
      polylines.push([A, B])
      polylines.push([B, C])
      polylines.push([C, D])
      polylines.push([D, A])
    }
  }
  return polylines
}
