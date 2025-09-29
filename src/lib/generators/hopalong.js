// Barry Martin Hopalong attractor
// x_{n+1} = y_n - sign(x_n) * sqrt(|b * x_n - c|)
// y_{n+1} = a - x_n
// Parameters: a, b, c, steps, burn, scale, centerX, centerY, rotDeg
export function hopalong({
  a = 2.0,
  b = 1.0,
  c = 0.5,
  steps = 120000,
  burn = 1000,
  x0 = 0.1,
  y0 = 0.0,
  scale = 90,
  centerX = 210,
  centerY = 148,
  rotDeg = 0,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0.0
  const A = Number(a) || 2.0
  const B = Number(b) || 1.0
  const C = Number(c) || 0.5
  const N = Math.max(1000, Math.floor(Number(steps) || 120000))
  const burnIn = Math.max(0, Math.floor(Number(burn) || 0))
  const s = Math.max(1e-6, Number(scale) || 90)
  const th = (Number(rotDeg) || 0) * Math.PI / 180
  const ct = Math.cos(th), st = Math.sin(th)

  const pts = []
  for (let i = 0; i < N; i++) {
    const xn = y - Math.sign(x || 0) * Math.sqrt(Math.abs(B * x - C))
    const yn = A - x
    x = xn
    y = yn
    if (i >= burnIn) {
      // rotate and scale to page
      const xr = x * ct - y * st
      const yr = x * st + y * ct
      const px = centerX + xr * s
      const py = centerY - yr * s
      pts.push([px, py])
    }
  }
  return [pts]
}
