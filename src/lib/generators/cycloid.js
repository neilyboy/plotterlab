// Cycloid family: Epitrochoid / Hypotrochoid
// Parameters:
// - kind: 'epi' | 'hypo'
// - R, r, d: base radii and pen offset
// - turns: how many 2π rotations
// - step: angle step in radians
// - centerX, centerY, scale
// - multi: number of rotated copies
export function cycloid({
  kind = 'epi',
  R = 80,
  r = 23,
  d = 60,
  turns = 18,
  step = 0.006,
  centerX = 210,
  centerY = 148,
  scale = 1,
  multi = 1,
  simplifyTol = 0
} = {}) {
  const K = String(kind) === 'hypo' ? 'hypo' : 'epi'
  const tMax = Math.max(1, Number(turns) || 1) * Math.PI * 2
  const dt = Math.max(0.0005, Number(step) || 0.006)
  const big = Number(R) || 1
  const small = Number(r) || 1
  const pen = Number(d) || 0
  const polys = []

  const makeCurve = (angleOffset = 0) => {
    const pts = []
    for (let t = 0; t <= tMax; t += dt) {
      let x, y
      if (K === 'epi') {
        const k = (big + small) / small
        x = (big + small) * Math.cos(t) - pen * Math.cos(k * t)
        y = (big + small) * Math.sin(t) - pen * Math.sin(k * t)
      } else {
        const k = (big - small) / small
        x = (big - small) * Math.cos(t) + pen * Math.cos(k * t)
        y = (big - small) * Math.sin(t) - pen * Math.sin(k * t)
      }
      // rotate copy
      const ca = Math.cos(angleOffset), sa = Math.sin(angleOffset)
      const xr = x * ca - y * sa
      const yr = x * sa + y * ca
      pts.push([centerX + xr * scale, centerY + yr * scale])
    }
    return pts
  }

  const m = Math.max(1, Math.floor(Number(multi) || 1))
  for (let i = 0; i < m; i++) {
    const ang = (i / m) * Math.PI * 2
    polys.push(makeCurve(ang))
  }
  return polys
}
