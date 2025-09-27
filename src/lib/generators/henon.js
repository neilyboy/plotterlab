// Hénon map generator (iterated 2D map)
// x_{n+1} = 1 - a x_n^2 + y_n
// y_{n+1} = b x_n
export function henonMap({
  a = 1.4,
  b = 0.3,
  steps = 120000,
  x0 = 0.1,
  y0 = 0.0,
  scale = 160,
  centerX = 210,
  centerY = 160,
  burn = 1000,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0.0
  const n = Math.max(1000, Math.floor(Number(steps) || 120000))
  const pts = []
  const bsteps = Math.max(0, Math.floor(Number(burn) || 1000))
  for (let i = 0; i < n; i++) {
    const xn = 1 - a * x * x + y
    const yn = b * x
    x = xn; y = yn
    if (i > bsteps) {
      const px = centerX + x * scale
      const py = centerY - y * scale
      pts.push([px, py])
    }
  }
  return [pts]
}
