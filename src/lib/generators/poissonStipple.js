// Poisson Stipple (optional image-weighted)
// Places non-overlapping dots with a minimum spacing, optionally denser in darker regions.

import { makeRNG } from '../random.js'

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

function circlePoly(cx, cy, r, sides = 14) {
  const out = []
  for (let i = 0; i <= sides; i++) {
    const t = (i / sides) * Math.PI * 2
    out.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
  }
  return out
}

export function poissonStipple({ width = 420, height = 297, margin = 20, seed = 'seed', bitmap = null, useImage = false, invert = false, gamma = 1.0, preserveAspect = true, minDist = 6, attempts = 8000, dotMin = 0.5, dotMax = 1.8, connectPath = false, onProgress }) {
  const { rand, range } = makeRNG(seed)
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const W = maxX - minX, H = maxY - minY

  const sample = makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect)

  const pts = []
  const cell = Math.max(1, minDist * 0.7)
  const gx = Math.max(4, Math.floor(W / cell))
  const gy = Math.max(4, Math.floor(H / cell))
  const grid = new Array(gx * gy).fill(null)
  const gIdx = (x, y) => {
    const ix = Math.max(0, Math.min(gx - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(gy - 1, Math.floor((y - minY) / cell)))
    return iy * gx + ix
  }

  const effMinDist = (x, y) => {
    if (!useImage || !sample) return minDist
    let g = sample(x, y)
    if (invert) g = 1 - g
    if (gamma !== 1) g = Math.pow(g, gamma)
    // darker -> smaller spacing (more dots)
    const t = 1 - g
    return Math.max(1, minDist * (0.5 + 0.8 * (1 - t)))
  }

  function canPlace(x, y, r) {
    const ix = Math.max(0, Math.min(gx - 1, Math.floor((x - minX) / cell)))
    const iy = Math.max(0, Math.min(gy - 1, Math.floor((y - minY) / cell)))
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const jx = ix + dx, jy = iy + dy
        if (jx < 0 || jy < 0 || jx >= gx || jy >= gy) continue
        const k = jy * gx + jx
        const p = grid[k]
        if (!p) continue
        const d = Math.hypot(x - p[0], y - p[1])
        if (d < r) return false
      }
    }
    return true
  }

  for (let i = 0; i < attempts; i++) {
    const x = minX + range(0, 1) * W
    const y = minY + range(0, 1) * H
    const r = effMinDist(x, y)
    if (canPlace(x, y, r)) {
      pts.push([x, y])
      grid[gIdx(x, y)] = [x, y]
    }
    if (onProgress && (i & 1023) === 0) onProgress(i / attempts)
  }

  if (connectPath) {
    // Greedy nearest path
    const N = pts.length
    if (N === 0) return []
    const used = new Uint8Array(N)
    let idx = 0
    used[0] = 1
    const order = [0]
    for (let k = 1; k < N; k++) {
      let best = -1, bestD = 1e9
      const [ax, ay] = pts[idx]
      for (let j = 0; j < N; j++) {
        if (used[j]) continue
        const [bx, by] = pts[j]
        const d = (ax - bx) * (ax - bx) + (ay - by) * (ay - by)
        if (d < bestD) { bestD = d; best = j }
      }
      if (best < 0) break
      used[best] = 1
      order.push(best)
      idx = best
      if (onProgress && (k & 1023) === 0) onProgress(0.8 + 0.2 * (k / N))
    }
    return [order.map(i => pts[i])]
  }

  // Dots as circles sized by image darkness (optional)
  const out = []
  for (const [x, y] of pts) {
    let g = sample ? sample(x, y) : 0.5
    if (invert) g = 1 - g
    if (gamma !== 1) g = Math.pow(g, gamma)
    const t = 1 - g
    const r = Math.max(0.1, dotMin + (dotMax - dotMin) * t)
    out.push(circlePoly(x, y, r, 16))
  }
  return out
}
