// Halvorsen Attractor generator
// dx/dt = -a x - 4 y - 4 z - y^2
// dy/dt = -a y - 4 z - 4 x - z^2
// dz/dt = -a z - 4 x - 4 y - x^2
export function halvorsenAttractor({
  a = 1.4,
  dt = 0.005,
  steps = 60000,
  x0 = 0.1,
  y0 = 0,
  z0 = 0,
  scale = 10,
  centerX = 210,
  centerY = 148,
  rotDegXY = 20,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.005)
  const n = Math.max(1000, Math.floor(Number(steps) || 60000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const c = Math.cos(th), sn = Math.sin(th)
  for (let i = 0; i < n; i++) {
    const dx = -a * x - 4 * y - 4 * z - y*y
    const dy = -a * y - 4 * z - 4 * x - z*z
    const dz = -a * z - 4 * x - 4 * y - x*x
    x += s * dx
    y += s * dy
    z += s * dz
    const xr = x * c - y * sn
    const yr = x * sn + y * c
    const px = centerX + xr * scale
    const py = centerY - (yr + z * 0.05) * scale
    pts.push([px, py])
  }
  return [pts]
}
