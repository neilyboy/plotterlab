// Aizawa Attractor generator
// Common parameters: a=0.95, b=0.7, c=0.6, d=3.5, e=0.25, f=0.1
export function aizawaAttractor({
  a = 0.95,
  b = 0.7,
  c = 0.6,
  d = 3.5,
  e = 0.25,
  f = 0.1,
  dt = 0.01,
  steps = 50000,
  x0 = 0.1,
  y0 = 0,
  z0 = 0,
  scale = 90,
  centerX = 210,
  centerY = 148,
  rotDegXY = 20,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.1
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.01)
  const n = Math.max(1000, Math.floor(Number(steps) || 50000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const cth = Math.cos(th), sth = Math.sin(th)
  for (let i = 0; i < n; i++) {
    const r2 = x*x + y*y
    const dx = (z - b) * x - d * y
    const dy = d * x + (z - b) * y
    const dz = c + a*z - (z*z*z)/3 - r2*(1 + e*z) + f*z*x*x*x
    x += s * dx
    y += s * dy
    z += s * dz
    const xr = x * cth - y * sth
    const yr = x * sth + y * cth
    const px = centerX + xr * scale
    const py = centerY - (yr + z * 0.06) * scale
    pts.push([px, py])
  }
  return [pts]
}
