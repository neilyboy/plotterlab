// Truchet tiles generator
// Variant 'curves': quarter-circle arcs in each tile. Variant 'lines': diagonal lines.
// cols x rows grid fills the page within margins.

import { makeRNG } from '../random.js'

export function truchet({ width, height, margin = 20, cols = 24, rows = 16, variant = 'curves', jitter = 0, onProgress, seed }) {
  const rng = makeRNG(seed)
  const innerW = Math.max(1, width - 2 * margin)
  const innerH = Math.max(1, height - 2 * margin)
  cols = Math.max(1, Math.floor(cols))
  rows = Math.max(1, Math.floor(rows))
  const tw = innerW / cols
  const th = innerH / rows
  const out = []
  const N = cols * rows
  let k = 0
  const seg = 18

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, k++) {
      const x = margin + c * tw
      const y = margin + r * th
      const cx = x + tw / 2
      const cy = y + th / 2
      const flip = rng.rand() < 0.5

      if (variant === 'lines') {
        // two diagonals per tile (one chosen)
        const a = flip ? [[x, y], [x + tw, y + th]] : [[x + tw, y], [x, y + th]]
        out.push(a)
      } else {
        // quarter arcs touching midpoints
        const R = Math.min(tw, th) / 2
        const arc = (cx, cy, a0, a1) => {
          const poly = []
          for (let i = 0; i <= seg; i++) {
            const t = a0 + (a1 - a0) * (i / seg)
            let px = cx + Math.cos(t) * R
            let py = cy + Math.sin(t) * R
            if (jitter > 0) { px += rng.range(-jitter, jitter); py += rng.range(-jitter, jitter) }
            poly.push([px, py])
          }
          return poly
        }
        if (flip) {
          out.push(arc(x + tw, y, Math.PI, Math.PI * 1.5)) // top-right to top-left
          out.push(arc(x, y + th, 0, Math.PI * 0.5))       // bottom-left to bottom-right
        } else {
          out.push(arc(x, y, Math.PI * 0.5, Math.PI))      // top-left to bottom-left
          out.push(arc(x + tw, y + th, -Math.PI * 0.5, 0)) // bottom-right to top-right
        }
      }
      if (onProgress && k % 200 === 0) onProgress(k / N)
    }
  }
  return out
}
