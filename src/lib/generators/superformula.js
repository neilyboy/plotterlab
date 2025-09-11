// Superformula concentric rings
// Produces multiple scaled superformula curves for dramatic symmetric shapes
// Returns array of closed polylines

export function superformulaRings({
  m = 6,
  a = 1,
  b = 1,
  n1 = 0.3,
  n2 = 0.3,
  n3 = 0.3,
  rings = 48,
  steps = 900,
  inner = 0.05, // inner scale fraction at final ring
  rotateDeg = 0,
  morph = 0,     // 0..1 – interpolates to a spikier variant towards inner rings
  twistDeg = 0,  // per-ring additional rotation in degrees
  n23Lock = false,
  mRound = true,
  mEven = false,
  margin = 20,
  width = 420,
  height = 297,
}) {
  const rad = (rotateDeg * Math.PI) / 180
  const W = width - margin * 2
  const H = height - margin * 2
  const cx = width / 2
  const cy = height / 2
  const S = Math.min(W, H) * 0.48

  function R(theta, mLoc, n1Loc, n2Loc, n3Loc) {
    const ct = Math.cos((mLoc * theta) / 4)
    const st = Math.sin((mLoc * theta) / 4)
    const t1 = Math.pow(Math.abs(ct) / (a || 1), n2Loc || 1)
    const t2 = Math.pow(Math.abs(st) / (b || 1), n3Loc || 1)
    const d = Math.pow(t1 + t2, 1 / (n1Loc || 1)) || 1
    return 1 / d
  }

  const polylines = []
  const n = Math.max(32, Math.floor(steps))
  const innerClamp = Math.max(0, Math.min(0.98, inner))

  // base symmetry handling for m
  let mEff = m
  if (mRound) mEff = Math.round(mEff)
  if (mEven) mEff = Math.max(0, 2 * Math.round(mEff / 2))

  for (let k = 0; k < Math.max(1, rings); k++) {
    const t = k / Math.max(1, rings - 1)
    const s = S * (1 - t * (1 - innerClamp))
    // Interpolate parameters towards a spikier variant based on morph and t
    const blend = Math.max(0, Math.min(1, morph)) * t
    const mLoc = mEff * (1 - blend) + (mEff * 1.6 + 2) * blend
    const n1Loc = n1 * (1 - blend) + Math.max(0.08, n1 * 0.35) * blend
    const n2Loc = n2 * (1 - blend) + (n2 * 0.65) * blend
    let n3Loc = n3 * (1 - blend) + (n3 * 0.65) * blend
    if (n23Lock) n3Loc = n2Loc
    const twist = (twistDeg * Math.PI / 180) * t
    const pts = []
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2
      const r = R(th, mLoc, n1Loc, n2Loc, n3Loc)
      const rr = r * s
      const ang = th + rad + twist
      const x = cx + Math.cos(ang) * rr
      const y = cy + Math.sin(ang) * rr
      pts.push([x, y])
    }
    if (pts.length >= 4) polylines.push(pts)
  }

  return polylines
}
