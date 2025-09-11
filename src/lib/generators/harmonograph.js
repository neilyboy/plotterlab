// Harmonograph generator: damped sinusoidal Lissajous-like curves
// x(t) = cx + Ax * e^{-dx t} * sin(2π fx t + px)
// y(t) = cy + Ay * e^{-dy t} * sin(2π fy t + py)

export function harmonograph({ width = 420, height = 297, margin = 20, Ax = 120, Ay = 80, fx = 0.21, fy = 0.19, px = 0, py = Math.PI / 2, dx = 0.01, dy = 0.012, tMax = 60, steps = 8000 }) {
  const cx = width / 2
  const cy = height / 2
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax
    const ex = Math.exp(-dx * t)
    const ey = Math.exp(-dy * t)
    const x = cx + Ax * ex * Math.sin(2 * Math.PI * fx * t + px)
    const y = cy + Ay * ey * Math.sin(2 * Math.PI * fy * t + py)
    if (x < margin || x > width - margin || y < margin || y > height - margin) continue
    pts.push([x, y])
  }
  return pts.length >= 2 ? [pts] : []
}
