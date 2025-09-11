// TSP Art – single continuous path through sampled points (optional image-weighted)
// Greedy nearest-neighbor with optional improvement iterations (2-opt-lite)

function makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect = true) {
  if (!bitmap || !bitmap.data) return null
  const iw = bitmap.width, ih = bitmap.height
  const rw = maxX - minX, rh = maxY - minY
  let sx, sy, ox, oy
  if (preserveAspect) {
    const s = Math.min(rw / iw, rh / ih)
    sx = sy = s
    ox = minX + (rw - iw * s) * 0.5
    oy = minY + (rh - ih * s) * 0.5
  } else {
    sx = rw / iw
    sy = rh / ih
    ox = minX
    oy = minY
  }
  return (x, y) => {
    const u = Math.max(0, Math.min(iw - 1, Math.round((x - ox) / sx)))
    const v = Math.max(0, Math.min(ih - 1, Math.round((y - oy) / sy)))
    return bitmap.data[v * iw + u]
  }
}

function dist2(a, b) { const dx = a[0]-b[0], dy = a[1]-b[1]; return dx*dx+dy*dy }

export function tspArt({ width = 420, height = 297, margin = 20, points = 1000, useImage = false, invert = false, gamma = 1.0, preserveAspect = true, bitmap = null, improveIters = 0, onProgress }) {
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const W = maxX - minX, H = maxY - minY
  const sample = makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect)

  // Sample candidate points
  const pts = []
  const target = Math.max(10, Math.floor(points))
  let tries = 0
  const maxTries = target * 50
  while (pts.length < target && tries++ < maxTries) {
    const x = minX + Math.random() * W
    const y = minY + Math.random() * H
    if (useImage && sample) {
      let g = sample(x, y)
      if (invert) g = 1 - g
      if (gamma !== 1) g = Math.pow(g, gamma)
      const t = 1 - g
      if (Math.random() > t) continue
    }
    pts.push([x, y])
    if (onProgress && (pts.length & 255) === 0) onProgress(pts.length / target * 0.2)
  }
  if (pts.length === 0) return []

  // Greedy nearest neighbor
  const N = pts.length
  const used = new Uint8Array(N)
  const order = new Int32Array(N)
  let idx = 0
  order[0] = 0
  used[0] = 1
  for (let k = 1; k < N; k++) {
    let best = -1, bestD = Infinity
    const a = pts[idx]
    for (let j = 0; j < N; j++) {
      if (used[j]) continue
      const d = dist2(a, pts[j])
      if (d < bestD) { bestD = d; best = j }
    }
    order[k] = best
    used[best] = 1
    idx = best
    if (onProgress && (k & 511) === 0) onProgress(0.2 + 0.6 * (k / N))
  }

  // Lite improvement: local 2-opt on random segments
  const iters = Math.max(0, Math.floor(improveIters))
  for (let it = 0; it < iters; it++) {
    const i = 1 + Math.floor(Math.random() * (N - 3))
    const j = i + 1 + Math.floor(Math.random() * Math.max(1, N - i - 2))
    const a = pts[order[i - 1]], b = pts[order[i]]
    const c = pts[order[j]], d = pts[order[j + 1]]
    const before = dist2(a, b) + dist2(c, d)
    const after = dist2(a, c) + dist2(b, d)
    if (after < before) {
      // reverse order[i..j]
      let lo = i, hi = j
      while (lo < hi) { const tmp = order[lo]; order[lo] = order[hi]; order[hi] = tmp; lo++; hi-- }
    }
    if (onProgress && (it & 63) === 0) onProgress(0.8 + 0.2 * (it / Math.max(1, iters)))
  }

  const path = []
  for (let k = 0; k < N; k++) path.push(pts[order[k]])
  return [path]
}
