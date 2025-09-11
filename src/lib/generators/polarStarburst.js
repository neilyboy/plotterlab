import { makeRNG } from '../random.js'

// Polar Starburst – radial spikes with optional multi-line wedge density
// Returns an array of polylines (each spike is one or more straight segments)
export function polarStarburst({
  spikes = 72,
  spreadDeg = 6,        // total angular width per spike (for multi-line wedge look)
  linesPerSpike = 1,    // number of parallel lines within each spike
  inner = 8,            // inner radius (mm)
  outer = null,         // if null, computed from page size/margin
  jitterDeg = 2,        // random per-spike angle jitter (±)
  lengthJitter = 0.15,  // 0..1 variance of spike length
  centerX = null,
  centerY = null,
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed'
}) {
  const { rand, noise2D } = makeRNG(seed)
  const cx = Number.isFinite(centerX) ? centerX : width / 2
  const cy = Number.isFinite(centerY) ? centerY : height / 2
  const maxR = Math.max(4, Math.min(width, height) / 2 - margin)
  const R = Math.max(1, Math.min(maxR, outer ?? maxR))
  const L = Math.max(1, Math.floor(spikes))
  const lines = Math.max(1, Math.floor(linesPerSpike))
  const halfSpread = (Math.max(0, spreadDeg) * Math.PI / 180) * 0.5
  const angleStep = (2 * Math.PI) / L

  const out = []
  for (let i = 0; i < L; i++) {
    const aBase = i * angleStep + (rand() * 2 - 1) * (jitterDeg * Math.PI / 180)
    // vary length a bit per spike
    const lenScale = 1 - Math.abs((noise2D(i * 0.13, i * 0.07) || 0) * lengthJitter)
    const rOut = Math.max(1, R * lenScale)

    if (lines <= 1 || halfSpread <= 1e-6) {
      out.push([[cx + inner * Math.cos(aBase), cy + inner * Math.sin(aBase)], [cx + rOut * Math.cos(aBase), cy + rOut * Math.sin(aBase)]])
      continue
    }
    for (let k = 0; k < lines; k++) {
      const t = lines === 1 ? 0.5 : (k / (lines - 1)) // 0..1
      const a = aBase + (t - 0.5) * (2 * halfSpread)
      out.push([[cx + inner * Math.cos(a), cy + inner * Math.sin(a)], [cx + rOut * Math.cos(a), cy + rOut * Math.sin(a)]])
    }
  }
  return out
}
