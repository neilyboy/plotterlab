// Penrose-like starfield generator (approximation)
// Builds concentric decagram/star rosettes with golden-ratio scaling and optional spokes.
// Not a strict tiling, but evokes Penrose aesthetics for plotter-friendly output.
export function penroseLike({
  layers = 9,
  innerR = 18,
  outerR = 120,
  scaleFactor = 1.61803398875,
  rotateDeg = 18,
  spokes = 0,
  centerX = 210,
  centerY = 148,
  jitter = 0,
  simplifyTol = 0
} = {}) {
  const polys = []
  const phi = 1.61803398875
  const toRad = (d)=>d*Math.PI/180
  const baseRot = toRad(rotateDeg || 0)

  const star = (R1, R2, rot) => {
    const n = 10 // decagram
    const pts = []
    for (let i = 0; i < n; i++) {
      const ang = rot + i * (Math.PI * 2 / n)
      const r = (i % 2 === 0) ? R2 : R1
      let x = centerX + r * Math.cos(ang)
      let y = centerY + r * Math.sin(ang)
      if (jitter) { x += (Math.random()-0.5)*jitter; y += (Math.random()-0.5)*jitter }
      pts.push([x, y])
    }
    pts.push(pts[0])
    return pts
  }

  const spokeLines = (R, rot, k=5) => {
    const lines = []
    for (let i = 0; i < k; i++) {
      const ang = rot + i * (Math.PI * 2 / k)
      const x1 = centerX + R*0.12 * Math.cos(ang)
      const y1 = centerY + R*0.12 * Math.sin(ang)
      const x2 = centerX + R * Math.cos(ang)
      const y2 = centerY + R * Math.sin(ang)
      lines.push([[x1,y1],[x2,y2]])
    }
    return lines
  }

  // Build rosettes from innerR..outerR
  let R2 = innerR
  let R1 = innerR/phi
  let rot = baseRot
  for (let i = 0; i < layers; i++) {
    polys.push(star(R1, R2, rot))
    if (spokes > 0) {
      for (const ln of spokeLines(R2, rot, 5)) polys.push(ln)
    }
    R1 *= scaleFactor
    R2 *= scaleFactor
    rot += Math.PI/5 // 36° shift per layer
    if (R2 > outerR) break
  }
  return polys
}
