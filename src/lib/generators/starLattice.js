import { makeRNG } from '../random.js'

// A field of radial rosettes that evoke a star-lattice feel
// params: cols, rows, spacing, radius, jitter, margin, seed
export function starLattice({ cols = 10, rows = 14, spacing = 28, radius = 10, jitter = 0.0, margin = 20, seed = 'seed', width = 420, height = 297 }) {
  const { rand, range } = makeRNG(seed)
  const startX = margin + spacing / 2
  const startY = margin + spacing / 2
  const lobes = 8
  const amp = 0.35
  const polylines = []

  const steps = 180
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = startX + i * spacing + range(-spacing * jitter, spacing * jitter)
      const cy = startY + j * spacing + range(-spacing * jitter, spacing * jitter)
      const r = radius
      const pts = []
      for (let s = 0; s <= steps; s++) {
        const t = (Math.PI * 2 * s) / steps
        const rr = r * (1 + amp * Math.cos(lobes * t))
        pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr])
      }
      polylines.push(pts)
    }
  }
  return polylines
}
