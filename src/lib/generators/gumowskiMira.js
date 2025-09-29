// Gumowski–Mira attractor
// x_{n+1} = y + a*(1 - b*y^2)*y + f(x)
// y_{n+1} = -x + f(x_{n+1})
// f(x) = m*x + 2*(1-m)*x^2/(1+x^2)
// Parameters: a, b, m, steps, burn, x0, y0, scale, centerX, centerY, rotDeg
export function gumowskiMira({
  a = 0.008,
  b = 0.05,
  m = -0.5,
  steps = 160000,
  burn = 1200,
  x0 = 0.1,
  y0 = 0.0,
  scale = 110,
  centerX = 210,
  centerY = 148,
  rotDeg = 0,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0.0
  const A = Number(a)
  const B = Number(b)
  const M = Number(m)
  const N = Math.max(1000, Math.floor(Number(steps) || 160000))
  const burnIn = Math.max(0, Math.floor(Number(burn) || 0))
  const s = Math.max(1e-6, Number(scale) || 110)
  const th = (Number(rotDeg) || 0) * Math.PI / 180
  const ct = Math.cos(th), st = Math.sin(th)

  const f = (x) => M * x + 2 * (1 - M) * (x * x) / (1 + x * x)

  const pts = []
  for (let i = 0; i < N; i++) {
    const x1 = y + A * (1 - B * y * y) * y + f(x)
    const y1 = -x + f(x1)
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
