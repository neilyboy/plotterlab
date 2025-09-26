// Rössler Attractor generator projected to 2D
// dx/dt = -y - z
// dy/dt = x + a y
// dz/dt = b + z (x - c)
export function rosslerAttractor({
  a = 0.2,
  b = 0.2,
  c = 5.7,
  dt = 0.01,
  steps = 25000,
  x0 = 0.1,
  y0 = 0,
  z0 = 0,
  scale = 10,
  centerX = 210,
  centerY = 148,
  rotDegXY = 0,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.01)
  const n = Math.max(1000, Math.floor(Number(steps) || 25000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const cth = Math.cos(th), sth = Math.sin(th)
  for (let i = 0; i < n; i++) {
    const dx = -y - z
    const dy = x + a * y
    const dz = b + z * (x - c)
    x += s * dx
    y += s * dy
    z += s * dz
    const xr = x * cth - y * sth
    const yr = x * sth + y * cth
    const px = centerX + xr * scale
    const py = centerY - (yr + z * 0.05) * scale
    pts.push([px, py])
  }
  return [pts]
}
