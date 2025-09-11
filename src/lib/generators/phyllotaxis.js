// Phyllotaxis (Vogel spiral) generator
// Connect seeds as a single path or render small dot-circles.

import { makeRNG } from '../random.js'

export function phyllotaxis({ width, height, margin = 20, count = 1200, angleDeg = 137.507764, spacing = 3, connect = true, jitter = 0, dotSize = 1.4, onProgress, seed }) {
  const rng = makeRNG(seed)
  const cx = width / 2
  const cy = height / 2
  const ang = angleDeg * Math.PI / 180
  const pts = []
  for (let n = 0; n < Math.max(1, Math.floor(count)); n++) {
    const r = spacing * Math.sqrt(n)
    const a = n * ang
    let x = cx + r * Math.cos(a)
    let y = cy + r * Math.sin(a)
    if (jitter > 0) {
      x += rng.range(-jitter, jitter)
      y += rng.range(-jitter, jitter)
    }
    // Keep inside page rect margins
    if (x < margin || x > width - margin || y < margin || y > height - margin) continue
    pts.push([x, y])
    if (onProgress && n % 200 === 0) onProgress(n / count)
  }

  if (connect) {
    return [pts]
  }

  // Render small circles for each seed (approximate as 16-gon)
  const out = []
  const seg = Math.max(8, Math.floor(16))
  const R = Math.max(0.1, dotSize)
  for (const p of pts) {
    const poly = []
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2
      poly.push([p[0] + Math.cos(t) * R, p[1] + Math.sin(t) * R])
    }
    out.push(poly)
  }
  return out
}
