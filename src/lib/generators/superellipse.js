// Superellipse generator
// |x/a|^n + |y/b|^n = 1
// Parameters: a, b, n, rotateDeg, cx, cy, step
export function superellipse({
  a = 160,
  b = 110,
  n = 3.5,
  rotateDeg = 0,
  cx = 210,
  cy = 148,
  step = 0.01,
  simplifyTol = 0
} = {}) {
  const pts = []
  const rot = (Number(rotateDeg) || 0) * Math.PI / 180
  const cosR = Math.cos(rot)
  const sinR = Math.sin(rot)
  const p = 2 / (Number(n) || 2)
  const dT = Math.max(0.0005, Number(step) || 0.01)
  const maxT = Math.PI * 2
  for (let t = 0; t <= maxT + 1e-9; t += dT) {
    const ct = Math.cos(t)
    const st = Math.sin(t)
    const x0 = Math.sign(ct) * Math.pow(Math.abs(ct), p) * a
    const y0 = Math.sign(st) * Math.pow(Math.abs(st), p) * b
    // rotate
    const xr = x0 * cosR - y0 * sinR
    const yr = x0 * sinR + y0 * cosR
    pts.push([cx + xr, cy + yr])
  }
  return [pts]
}
