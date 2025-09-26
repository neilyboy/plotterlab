// Rose Curve (Rhodonea) generator
// r(θ) = a * cos(kθ + phase) or sin variant; here we use cos.
// Parameters:
// - kNumerator, kDenominator: k = p/q controls number of petals
// - a: overall scale (radius)
// - phaseDeg: phase offset in degrees
// - turns: how many full 2π turns to sample
// - step: angle step in radians
// - centerX, centerY: translation
// - variant: 'cos' | 'sin'
export function roseCurve({
  kNumerator = 5,
  kDenominator = 2,
  a = 120,
  phaseDeg = 0,
  turns = 6,
  step = 0.01,
  centerX = 210,
  centerY = 148,
  variant = 'cos',
  simplifyTol = 0
} = {}) {
  const k = (Number(kNumerator) || 1) / (Number(kDenominator) || 1)
  const phase = (Number(phaseDeg) || 0) * Math.PI / 180
  const pts = []
  const maxT = Math.max(1, Number(turns) || 1) * Math.PI * 2
  const dT = Math.max(0.0005, Number(step) || 0.01)
  const useCos = String(variant) !== 'sin'
  for (let t = 0; t <= maxT; t += dT) {
    const r = a * (useCos ? Math.cos(k * t + phase) : Math.sin(k * t + phase))
    const x = centerX + r * Math.cos(t)
    const y = centerY + r * Math.sin(t)
    pts.push([x, y])
  }
  // Return just one polyline
  return [pts]
}
