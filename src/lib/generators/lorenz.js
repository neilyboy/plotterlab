// Lorenz Attractor generator projected to 2D
// dx/dt = sigma (y - x)
// dy/dt = x (rho - z) - y
// dz/dt = x y - beta z
// Parameters: sigma, rho, beta, dt, steps, scale, centerX, centerY, rotDegXY (rotate XY plane)
export function lorenzAttractor({
  sigma = 10,
  rho = 28,
  beta = 8/3,
  dt = 0.005,
  steps = 20000,
  x0 = 0.01,
  y0 = 0,
  z0 = 0,
  scale = 6,
  centerX = 210,
  centerY = 148,
  rotDegXY = -20,
  simplifyTol = 0
} = {}) {
  let x = Number(x0) || 0.01
  let y = Number(y0) || 0
  let z = Number(z0) || 0
  const s = Math.max(1e-5, Number(dt) || 0.005)
  const n = Math.max(1000, Math.floor(Number(steps) || 20000))
  const pts = []
  const th = (Number(rotDegXY) || 0) * Math.PI / 180
  const c = Math.cos(th), sn = Math.sin(th)
  for (let i = 0; i < n; i++) {
    // classic Lorenz step (Euler)
    const dx = sigma * (y - x)
    const dy = x * (rho - z) - y
    const dz = x * y - beta * z
    x += s * dx
    y += s * dy
    z += s * dz
    // 3D -> 2D: rotate xy-plane for better spread
    const xr = x * c - y * sn
    const yr = x * sn + y * c
    const px = centerX + xr * scale
    const py = centerY - (yr + z * 0.08) * scale
    pts.push([px, py])
  }
  return [pts]
}
