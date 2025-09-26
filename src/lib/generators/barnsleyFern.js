// Barnsley Fern (IFS) generator
// Generates a single continuous polyline through iterated function system points.
// Parameters:
// - iter: number of iterations
// - scale: scaling factor from fern space to pixels
// - centerX, centerY: translation
// - variant: 'classic' (coeffs) – future: other fern variants
export function barnsleyFern({
  iter = 90000,
  scale = 46,
  centerX = 210,
  centerY = 290,
  variant = 'classic',
  simplifyTol = 0
} = {}) {
  let x = 0, y = 0
  const pts = []
  const n = Math.max(1000, Math.floor(iter))
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 100
    let xn, yn
    if (r < 1) {
      // Stem
      xn = 0
      yn = 0.16 * y
    } else if (r < 86) {
      // Successively smaller leaflets
      xn = 0.85 * x + 0.04 * y
      yn = -0.04 * x + 0.85 * y + 1.6
    } else if (r < 93) {
      // Largest left-hand leaflet
      xn = 0.2 * x - 0.26 * y
      yn = 0.23 * x + 0.22 * y + 1.6
    } else {
      // Largest right-hand leaflet
      xn = -0.15 * x + 0.28 * y
      yn = 0.26 * x + 0.24 * y + 0.44
    }
    x = xn; y = yn
    // Map to canvas coords; flip Y for screen space
    const px = centerX + x * scale
    const py = centerY - y * scale
    pts.push([px, py])
  }
  return [pts]
}
