// Sierpinski Triangle (IFS) generator
// Chooses vertices of an equilateral triangle and iterates midpoint moves.
// Returns a single polyline of points (plotter-friendly continuous path).
// Parameters:
// - iter: number of iterations
// - scale: scale factor
// - centerX, centerY: translation
// - jitter: small random jitter to add variation
export function sierpinski({
  iter = 80000,
  scale = 2.2,
  centerX = 210,
  centerY = 160,
  jitter = 0,
  simplifyTol = 0
} = {}) {
  // Set up triangle vertices in canonical coords
  const s = 100 // base unit
  const h = s * Math.sqrt(3) / 2
  const V = [
    [0, -h],           // top
    [-s/2, 0],         // bottom-left
    [s/2, 0]           // bottom-right
  ]
  let x = 0, y = 0
  const pts = []
  const n = Math.max(1000, Math.floor(iter))
  for (let i = 0; i < n; i++) {
    const v = V[(Math.random() * 3) | 0]
    x = (x + v[0]) / 2
    y = (y + v[1]) / 2
    let px = centerX + x * scale
    let py = centerY + y * scale
    if (jitter) {
      px += (Math.random() - 0.5) * jitter
      py += (Math.random() - 0.5) * jitter
    }
    pts.push([px, py])
  }
  return [pts]
}
