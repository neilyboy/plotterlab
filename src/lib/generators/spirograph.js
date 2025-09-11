// Spirograph / hypotrochoid generator -> returns one polyline
// params: R (outer radius), r (inner radius), d (pen offset), turns, step, centerX, centerY, scale

export function spirograph({ R = 120, r = 35, d = 50, turns = 1200, step = 0.02, centerX = 210, centerY = 148, scale = 1 }) {
  const pts = []
  const k = r / R
  const l = d / r
  const maxT = (Math.PI * 2) * (turns * step)
  for (let t = 0; t <= maxT; t += step) {
    const x = R * ((1 - k) * Math.cos(t) + l * Math.cos(((1 - k) / k) * t))
    const y = R * ((1 - k) * Math.sin(t) - l * Math.sin(((1 - k) / k) * t))
    pts.push([centerX + x * scale, centerY + y * scale])
  }
  return [pts]
}
