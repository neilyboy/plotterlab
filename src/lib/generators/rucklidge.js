// Rucklidge Attractor generator
// One formulation:
// dx/dt = -a x + y - y z
// dy/dt = -b y + x + x z
// dz/dt = -c z + x y - d
export function rucklidgeAttractor({
  a = 2.0,
  b = 1.0,
  c = 6.7,
  d = 0.0,
  dt = 0.003,
  steps = 50000,
  x0 = 0.1,
  y0 = 0,
  z0 = 0,
  scale = 12,
  centerX = 210,
  centerY = 148,
  rotDegXY = 10,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.003)
  const n = Math.max(1000, Math.floor(Number(steps) || 50000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const cth = Math.cos(th), sth = Math.sin(th)
  for (let i = 0; i < n; i++) {
    const dx = -a * x + y - y * z
    const dy = -b * y + x + x * z
    const dz = -c * z + x * y - d
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
