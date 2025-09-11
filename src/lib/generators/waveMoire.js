import { makeRNG } from '../random.js'

// Moiré wave lines: horizontal scanlines warped by interference of two radial waves
// Produces many left-to-right polylines for fast plotting, mesmerizing patterns.
// Params:
// - lines: number of horizontal lines
// - freqA, freqB: radial frequencies
// - phase: global phase offset (radians)
// - amp: displacement amplitude in mm
// - angleDeg: rotate entire composition
// - warp: noise warp amount in mm
// - margin, width, height
export function waveMoire({
  lines = 160,
  freqA = 0.035,
  freqB = 0.045,
  phase = 0,
  amp = 18,
  angleDeg = 0,
  warp = 0,
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed',
}) {
  const { noise2D } = makeRNG(seed)
  const cx = width / 2
  const cy = height / 2
  const ang = (angleDeg * Math.PI) / 180

  function rotate(x, y) {
    const s = Math.sin(ang), c = Math.cos(ang)
    const dx = x - cx, dy = y - cy
    return [cx + dx * c - dy * s, cy + dx * s + dy * c]
  }

  const W = width - margin * 2
  const H = height - margin * 2
  const y0 = margin
  const polylines = []

  for (let li = 0; li < Math.max(1, lines); li++) {
    const t = li / Math.max(1, lines - 1)
    const yBase = y0 + t * H
    const pts = []
    for (let xi = 0; xi <= W; xi++) {
      const x = margin + xi
      let rx = x - cx
      let ry = yBase - cy
      const r = Math.hypot(rx, ry)
      let disp = Math.sin(r * freqA + phase) + Math.sin(r * freqB + phase * 0.7)
      if (warp > 0) {
        const w = noise2D(x * 0.02, yBase * 0.02) * warp
        disp += w * 0.15
      }
      const y = yBase + disp * amp
      const p = rotate(x, y)
      pts.push(p)
    }
    polylines.push(pts)
  }

  return polylines
}
