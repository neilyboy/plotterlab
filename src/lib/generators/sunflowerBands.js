// Sunflower Bands (Vogel spiral with banded dot circles)
// Places points along a sunflower (phyllotaxis) pattern and draws small
// circle outlines for points within band windows to create radial bands.

export function sunflowerBands({
  width = 420,
  height = 297,
  margin = 20,
  count = 900,
  spacing = 3.2,
  angleDeg = 137.50776405003785,
  dotSize = 2.0,
  bandPeriod = 7,
  bandDuty = 0.55,
  jitter = 0.15,
  connect = false, // future option to connect in serpentine order
}) {
  const cx = width / 2
  const cy = height / 2
  const ang = (angleDeg * Math.PI) / 180
  const kept = []
  const pts = []

  const innerW = Math.max(0, width - 2 * margin)
  const innerH = Math.max(0, height - 2 * margin)
  const minX = margin, minY = margin, maxX = width - margin, maxY = height - margin

  for (let i = 0; i < Math.max(0, Math.floor(count)); i++) {
    const r = spacing * Math.sqrt(i)
    const a = i * ang
    let x = cx + r * Math.cos(a)
    let y = cy + r * Math.sin(a)
    if (jitter > 0) {
      x += (Math.random() - 0.5) * jitter
      y += (Math.random() - 0.5) * jitter
    }
    if (x < minX || x > maxX || y < minY || y > maxY) continue
    // Band by radius; compute a repeating band index and keep only central duty
    const bandIdx = bandPeriod <= 1 ? 0 : (Math.floor(r / (spacing)) % bandPeriod)
    const ph = bandPeriod <= 1 ? 0.5 : bandIdx / (bandPeriod - 1) // 0..1 across band
    const keep = Math.abs(ph - 0.5) <= (Math.max(0, Math.min(1, bandDuty)) * 0.5)
    if (!keep) continue
    kept.push([x, y])
  }

  // Draw small circle outlines
  const segs = Math.max(8, Math.floor(16 + dotSize * 4))
  const out = []
  for (const [x, y] of kept) {
    const r = Math.max(0.2, dotSize * 0.5)
    const poly = []
    for (let k = 0; k <= segs; k++) {
      const t = (k / segs) * Math.PI * 2
      poly.push([x + r * Math.cos(t), y + r * Math.sin(t)])
    }
    if (poly.length >= 4) out.push(poly)
  }

  // Optional future: connect points in serpentine to form long paths
  if (connect && kept.length >= 2) {
    // No-op for now; could implement a nearest-neighbor or radial sweep
  }

  return out
}
