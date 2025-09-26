// Thomas' cyclically symmetric attractor
// dx/dt = sin(y) - b x
// dy/dt = sin(z) - b y
// dz/dt = sin(x) - b z
export function thomasAttractor({
  b = 0.19,
  dt = 0.02,
  steps = 30000,
  x0 = 0.1,
  y0 = 0,
  z0 = 0,
  scale = 70,
  centerX = 210,
  centerY = 148,
  rotDegXY = 25,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.02)
  const n = Math.max(1000, Math.floor(Number(steps) || 30000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const c = Math.cos(th), sn = Math.sin(th)
  for (let i = 0; i < n; i++) {
    const dx = Math.sin(y) - b * x
    const dy = Math.sin(z) - b * y
    const dz = Math.sin(x) - b * z
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
