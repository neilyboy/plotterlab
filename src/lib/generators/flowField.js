import { makeRNG } from '../random.js'

// Flow field ribbons generator
// Creates multiple polylines that follow a simplex-noise vector field.
// params: cols, rows, scale, steps, separation, margin, seed
export function flowField({
  cols = 80,
  rows = 60,
  scale = 6,
  steps = 220,
  separation = 6,
  margin = 20,
  curl = 0.9,
  jitter = 0.15,
  seed = 'seed',
  width = 420,
  height = 297
}) {
  const { rand, noise2D } = makeRNG(seed)
  const W = width - margin * 2
  const H = height - margin * 2

  const originX = margin
  const originY = margin

  const polylines = []

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const sx = originX + (i + 0.5) * (W / cols)
      const sy = originY + (j + 0.5) * (H / rows)
      let x = sx + (rand() * 2 - 1) * separation
      let y = sy + (rand() * 2 - 1) * separation
      const pts = []
      for (let s = 0; s < steps; s++) {
        pts.push([x, y])
        const nx = x / W
        const ny = y / H
        const angle = noise2D(nx * scale, ny * scale) * Math.PI * 2
        const vx = Math.cos(angle)
        const vy = Math.sin(angle)
        x += (vx + (rand() * 2 - 1) * jitter) * curl
        y += (vy + (rand() * 2 - 1) * jitter) * curl
        if (x < margin || x > width - margin || y < margin || y > height - margin) break
      }
      if (pts.length > 1) polylines.push(pts)
    }
  }
  return polylines
}
