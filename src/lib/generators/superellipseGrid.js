// Superellipse Grid: grid of superellipses with varying exponent n per cell
// Parameters: cols, rows, a, b, n, nStep, rotateDeg, steps, scale, margin
export function superellipseGrid({
  width = 420,
  height = 297,
  margin = 20,
  cols = 10,
  rows = 7,
  a = 0.48, // relative radius vs cellW/2
  b = 0.48, // relative radius vs cellH/2
  n = 3.0,
  nStep = 0.15,
  rotateDeg = 0,
  steps = 360,
  scale = 1.0,
  simplifyTol = 0
} = {}) {
  const W = Math.max(10, Number(width) || 420)
  const H = Math.max(10, Number(height) || 297)
  const M = Number(margin) || 0
  const innerW = Math.max(1, W - 2 * M)
  const innerH = Math.max(1, H - 2 * M)
  const C = Math.max(1, Math.floor(cols))
  const R = Math.max(1, Math.floor(rows))
  const cellW = innerW / C
  const cellH = innerH / R
  const rot = (Number(rotateDeg) || 0) * Math.PI / 180
  const cr = Math.cos(rot), sr = Math.sin(rot)
  const S = Math.max(32, Math.floor(steps))

  const out = []
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      const cx = M + (i + 0.5) * cellW
      const cy = M + (j + 0.5) * cellH
      const nCell = Math.max(0.1, n + nStep * (i + j - (C + R) / 2))
      const rx = 0.5 * cellW * Math.max(0.01, a) * scale
      const ry = 0.5 * cellH * Math.max(0.01, b) * scale
      const poly = []
      for (let k = 0; k <= S; k++) {
        const t = (k / S) * Math.PI * 2
        const ct = Math.cos(t)
        const st = Math.sin(t)
        const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / nCell) * rx
        const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / nCell) * ry
        const xr = x * cr - y * sr
        const yr = x * sr + y * cr
        poly.push([cx + xr, cy + yr])
      }
      out.push(poly)
    }
  }
  return out
}
