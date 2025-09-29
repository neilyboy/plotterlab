// Torus Knot generator (3D parametric projected to 2D)
// p,q integers control the knot: winds p times around axis of rotational symmetry
// and q times around a circle in the interior of the torus.
// Parameters:
// - p, q: integer winds
// - R: major radius, r: minor radius
// - steps: number of samples
// - rotateDeg: rotation in XY plane before projection
// - perspective: small z factor to create depth in projection
// - centerX, centerY, scale
export function torusKnot({
  p = 3,
  q = 2,
  R = 120,
  r = 40,
  steps = 3000,
  rotateDeg = 0,
  perspective = 0.12,
  centerX = 210,
  centerY = 148,
  scale = 1,
  simplifyTol = 0
} = {}) {
  const n = Math.max(100, Math.floor(Number(steps) || 3000))
  const pts = []
  const rot = (Number(rotateDeg) || 0) * Math.PI / 180
  const cr = Math.cos(rot), sr = Math.sin(rot)
  const P = Math.max(1, Math.floor(Number(p) || 3))
  const Q = Math.max(1, Math.floor(Number(q) || 2))
  const Rmaj = Number(R) || 120
  const rmin = Number(r) || 40
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * Q
    const x3 = (Rmaj + rmin * Math.cos(P * t)) * Math.cos(t)
    const y3 = (Rmaj + rmin * Math.cos(P * t)) * Math.sin(t)
    const z3 = rmin * Math.sin(P * t)
    // rotate in XY
    const xr = x3 * cr - y3 * sr
    const yr = x3 * sr + y3 * cr
    // simple perspective flattening using z
    const s = 1 + z3 * (Number(perspective) || 0)
    const x2 = centerX + (xr * scale) / s
    const y2 = centerY + (yr * scale) / s
    pts.push([x2, y2])
  }
  return [pts]
}
