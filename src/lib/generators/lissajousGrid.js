// Lissajous Grid: draw a grid of Lissajous curves per cell
// Parameters: cols, rows, ax, ay, axStep, ayStep, phaseDeg, steps, scale, margin
export function lissajousGrid({
  width = 420,
  height = 297,
  margin = 20,
  cols = 8,
  rows = 6,
  ax = 3,
  ay = 2,
  axStep = 0,
  ayStep = 1,
  phaseDeg = 0,
  steps = 900,
  scale = 0.9,
  simplifyTol = 0
} = {}) {
  const w = Math.max(10, Number(width) || 420)
  const h = Math.max(10, Number(height) || 297)
  const mx = Number(margin) || 0
  const my = Number(margin) || 0
  const innerW = Math.max(1, w - 2 * mx)
  const innerH = Math.max(1, h - 2 * my)
  const cx0 = mx + innerW / 2
  const cy0 = my + innerH / 2

  const C = Math.max(1, Math.floor(cols))
  const R = Math.max(1, Math.floor(rows))
  const cellW = innerW / C
  const cellH = innerH / R

  const out = []
  const basePhase = (Number(phaseDeg) || 0) * Math.PI / 180
  const S = Math.max(100, Math.floor(steps))

  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      const cx = mx + (i + 0.5) * cellW
      const cy = my + (j + 0.5) * cellH
      // Vary frequencies slightly per cell to create a tapestry
      const axCell = Math.max(1, Math.floor(ax + axStep * i))
      const ayCell = Math.max(1, Math.floor(ay + ayStep * j))
      const p = basePhase + (i + j) * 0.1
      const rx = 0.5 * cellW * scale
      const ry = 0.5 * cellH * scale
      const poly = []
      for (let k = 0; k <= S; k++) {
        const t = (k / S) * Math.PI * 2
        const x = cx + rx * Math.sin(axCell * t + p)
        const y = cy + ry * Math.sin(ayCell * t)
        poly.push([x, y])
      }
      out.push(poly)
    }
  }
  return out.length ? [ ...out ] : []
}
