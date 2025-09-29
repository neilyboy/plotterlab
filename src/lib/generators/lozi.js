// Lozi attractor
// x_{n+1} = 1 - a*|x_n| + b*y_n
// y_{n+1} = x_n
// Parameters: a, b, steps, burn, x0, y0, scale, centerX, centerY, rotDeg
export function lozi({
  a = 1.7,
  b = 0.5,
  steps = 140000,
  burn = 1200,
  x0 = 0.1,
  y0 = 0.0,
  scale = 160,
  centerX = 210,
  centerY = 148,
  rotDeg = 0,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0.0
  const A = Number(a)
  const B = Number(b)
  const N = Math.max(1000, Math.floor(Number(steps) || 140000))
  const burnIn = Math.max(0, Math.floor(Number(burn) || 0))
  const s = Math.max(1e-6, Number(scale) || 160)
  const th = (Number(rotDeg) || 0) * Math.PI / 180
  const ct = Math.cos(th), st = Math.sin(th)

  const pts = []
  for (let i = 0; i < N; i++) {
    const x1 = 1 - A * Math.abs(x) + B * y
    const y1 = x
    x = x1
    y = y1
    if (i >= burnIn) {
      const xr = x * ct - y * st
      const yr = x * st + y * ct
      const px = centerX + xr * s
      const py = centerY - yr * s
      pts.push([px, py])
    }
  }
  return [pts]
}
