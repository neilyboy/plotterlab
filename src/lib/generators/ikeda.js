// Ikeda map generator (iterated 2D map -> plotter polyline)
// x_{n+1} = 1 + u*(x*cos t - y*sin t)
// y_{n+1} =     u*(x*sin t + y*cos t)
// t = 0.4 - 6/(1 + x^2 + y^2)
export function ikedaMap({
  u = 0.918,
  steps = 100000,
  x0 = 0.1,
  y0 = 0.0,
  scale = 90,
  centerX = 210,
  centerY = 148,
  burn = 1000,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  const n = Math.max(1000, Math.floor(Number(steps) || 100000))
  const pts = []
  const b = Math.max(0, Math.floor(Number(burn) || 1000))
  for (let i = 0; i < n; i++) {
    const r2 = x*x + y*y
    const t = 0.4 - 6/(1 + r2)
    const ct = Math.cos(t), st = Math.sin(t)
    const xn = 1 + u*(x*ct - y*st)
    const yn =     u*(x*st + y*ct)
    x = xn; y = yn
    if (i > b) {
      const px = centerX + x * scale
      const py = centerY - y * scale
      pts.push([px, py])
    }
  }
  return [pts]
}
