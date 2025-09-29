// Image halftone to polylines using scanlines + Bayer/Floyd dithering
// Expects a bitmap { width, height, data: Float32Array of 0..1 }
import { makeRNG } from '../random.js'

function histogramQuantilesFloat01(data, qLow = 0.02, qHigh = 0.98) {
  // 256-bin histogram approximation
  const bins = new Uint32Array(256)
  const n = data.length
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, Math.min(255, Math.floor(data[i] * 255)))
    bins[v]++
  }
  const cdf = new Uint32Array(256)
  let cum = 0
  for (let i = 0; i < 256; i++) { cum += bins[i]; cdf[i] = cum }
  const lowCount = Math.max(0, Math.min(n, Math.floor(n * qLow)))
  const highCount = Math.max(0, Math.min(n, Math.floor(n * qHigh)))
  let low = 0, high = 255
  for (let i = 0; i < 256; i++) { if (cdf[i] >= lowCount) { low = i; break } }
  for (let i = 0; i < 256; i++) { if (cdf[i] >= highCount) { high = i; break } }
  if (high <= low) high = Math.min(255, low + 1)
  return [low / 255, high / 255]
}

function floydSteinbergDither(bitmap, gamma = 1.0, invert = false) {
  if (!bitmap || !bitmap.data) return { width: 0, height: 0, data: new Uint8Array(0) }
  const w = bitmap.width, h = bitmap.height
  const buf = new Float32Array(w * h)
  for (let i = 0; i < buf.length; i++) {
    let g = bitmap.data[i]
    if (invert) g = 1 - g
    if (gamma !== 1) g = Math.pow(g, gamma)
    buf[i] = g
  }
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      const old = buf[idx]
      const newVal = old < 0.5 ? 1 : 0 // 1 = ink/keep, 0 = no-ink
      out[idx] = newVal
      const err = old - (newVal ? 0 : 1) // map back to [0,1]: ink=0, white=1
      // distribute error
      // x+1, y
      if (x + 1 < w) buf[idx + 1] += err * (7/16)
      // x-1, y+1
      if (x - 1 >= 0 && y + 1 < h) buf[idx - 1 + w] += err * (3/16)
      // x, y+1
      if (y + 1 < h) buf[idx + w] += err * (5/16)
      // x+1, y+1
      if (x + 1 < w && y + 1 < h) buf[idx + 1 + w] += err * (1/16)
    }
  }
  return { width: w, height: h, data: out }
}

function pointInPoly(pt, poly) {
  // Ray casting
  let x = pt[0], y = pt[1]
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1]
    const xj = poly[j][0], yj = poly[j][1]
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInAny(pt, polys) {
  if (!polys || polys.length === 0) return true
  for (const p of polys) if (pointInPoly(pt, p)) return true
  return false
}

function rectPolygon(x0, y0, x1, y1) {
  return [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]
}

// Hoisted helper so all branches (including 'radialDots') can call it safely
function circlePoly(cx, cy, r, sides = 16) {
  const out = []
  for (let i = 0; i <= sides; i++) {
    const t = (i / sides) * Math.PI * 2
    out.push([cx + Math.cos(t)*r, cy + Math.sin(t)*r])
  }
  return out
}

const BAYER8 = [
   0, 48, 12, 60,  3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
   8, 56,  4, 52, 11, 59,  7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
   2, 50, 14, 62,  1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58,  6, 54,  9, 57,  5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
].map(v => (v + 0.5) / 64)

function bayerDither(bitmap, gamma = 1.0, invert = false) {
  if (!bitmap || !bitmap.data) return { width: 0, height: 0, data: new Uint8Array(0) }
  const w = bitmap.width, h = bitmap.height
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      let g = bitmap.data[idx]
      if (invert) g = 1 - g
      if (gamma !== 1) g = Math.pow(g, gamma)
      const th = BAYER8[(y & 7) * 8 + (x & 7)]
      out[idx] = g < th ? 1 : 0 // 1 = ink / keep
    }
  }
  return { width: w, height: h, data: out }
}

function makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect = true) {
  if (!bitmap) return () => 1
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

export function halftone({ bitmap, width = 420, height = 297, margin = 20, spacing = 6, angleDeg = 0, segment = 2, method = 'bayer', gamma = 1.0, invert = false, preserveAspect = true, clipPolys = [], shape = 'lines', dotMin = 0.3, dotMax = 2.0, dotAspect = 1.0, normalize = true, normQLow = 0.02, normQHigh = 0.98, squiggleAmp = 0, squigglePeriod = 6, squiggleMode = 'sine', squiggleDarkness = true, squiggleJitterAmp = 0, squiggleJitterScale = 0.02, squigglePhaseJitter = 0, seed = 'seed', radialCenterX = null, radialCenterY = null, angStepDeg = 6, previewScale = 1, onProgress = null }) {
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const rect = rectPolygon(minX, minY, maxX, maxY)

  const angle = (angleDeg * Math.PI) / 180
  const dir = [Math.cos(angle), Math.sin(angle)]
  const n = [-dir[1], dir[0]]

  // RNG/noise for jitter
  const { noise2D } = makeRNG(seed)

  // Two samplers:
  // - sampleGray: raw grayscale (0..1) from image
  // - sampleMask: binary 0/1 from pre-dithered mask
  // Build normalized bitmap once if requested
  let normLow = 0, normHigh = 1
  if (normalize && bitmap && bitmap.data && bitmap.data.length) {
    const [lo, hi] = histogramQuantilesFloat01(bitmap.data, normQLow, normQHigh)
    normLow = lo; normHigh = hi
  }
  const sampleGrayRaw = makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect)
  const sampleGray = (x, y) => {
    let g = sampleGrayRaw(x, y)
    if (normalize) g = Math.max(0, Math.min(1, (g - normLow) / Math.max(1e-6, (normHigh - normLow))))
    return g
  }
  let sampleMask = null
  if (bitmap && bitmap.data && bitmap.data.length) {
    if (method === 'floyd') {
      const bmp2 = normalize ? { width: bitmap.width, height: bitmap.height, data: bitmap.data.map ? bitmap.data.map(v=>Math.max(0, Math.min(1, (v - normLow) / Math.max(1e-6, (normHigh - normLow))))) : bitmap.data } : bitmap
      const mask = floydSteinbergDither(bmp2, gamma, invert)
      sampleMask = makeSampler(mask, minX, minY, maxX, maxY, preserveAspect)
    } else if (method === 'bayer') {
      const bmp2 = normalize ? { width: bitmap.width, height: bitmap.height, data: bitmap.data.map ? bitmap.data.map(v=>Math.max(0, Math.min(1, (v - normLow) / Math.max(1e-6, (normHigh - normLow))))) : bitmap.data } : bitmap
      const mask = bayerDither(bmp2, gamma, invert)
      sampleMask = makeSampler(mask, minX, minY, maxX, maxY, preserveAspect)
    }
  }

  // Two modes: 'lines' (existing scanline dithering) or dot grid shapes
  if (shape === 'lines' || !shape) {
    // Compute k range for scanlines
    const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
    const proj = corners.map(p => p[0]*n[0] + p[1]*n[1])
    let kmin = Math.min(...proj) - spacing
    let kmax = Math.max(...proj) + spacing

    const polylines = []
    const L = Math.hypot(width, height)
    // For preview, allow a larger minimum step to reduce work
    const step = Math.max(0.5, segment * (previewScale && previewScale < 1 ? (1 / Math.max(0.35, previewScale)) : 1))

    const doSquiggle = (squiggleAmp || 0) > 0 && (squigglePeriod || 0) > 0
    const omega = doSquiggle ? (2 * Math.PI / Math.max(1e-3, squigglePeriod)) : 0
    const wave = (phase) => {
      if (squiggleMode === 'zigzag') {
        // Triangle wave in [-1,1]
        return 2 / Math.PI * Math.asin(Math.sin(phase))
      }
      // Default sine
      return Math.sin(phase)
    }

    const estLines = Math.max(1, Math.ceil((kmax - kmin) / Math.max(1e-6, spacing)))
    let lineIdx = 0
    for (let k = kmin; k <= kmax; k += spacing, lineIdx++) {
      // base point along normal
      const center = [(minX+maxX)/2, (minY+maxY)/2]
      const t0 = k - (center[0]*n[0] + center[1]*n[1])
      const p0 = [center[0] + n[0]*t0, center[1] + n[1]*t0]
      const a = [p0[0] - dir[0]*L, p0[1] - dir[1]*L]
      const b = [p0[0] + dir[0]*L, p0[1] + dir[1]*L]

      // Intersect with page rect edges to get finite segment
      // Use coarse clipping: just clamp t using min/max intersection with rect bounds via sampling steps
      const total = Math.ceil((2*L) / step)
      let on = false
      let cur = []
      for (let i = 0; i <= total; i++) {
        const t = i / total
        let x = a[0] + (b[0]-a[0]) * t
        let y = a[1] + (b[1]-a[1]) * t

        // Apply squiggle along normal
        if (doSquiggle) {
          // approximate arc length from line start
          const s = i * step
          let amp = squiggleAmp
          if (squiggleDarkness) {
            let g0 = sampleGray(x, y)
            if (invert) g0 = 1 - g0
            if (gamma !== 1) g0 = Math.pow(g0, gamma)
            const tDark = 1 - g0
            amp *= tDark
          }
          // Amplitude/phase jitter via noise
          if (squiggleJitterAmp) {
            const nval = noise2D(x * squiggleJitterScale, y * squiggleJitterScale)
            amp *= 1 + squiggleJitterAmp * nval
          }
          let phase = s * omega + lineIdx * 0.7 // base phase; small offset per line
          if (squigglePhaseJitter) {
            const nphase = noise2D((x + 1000) * squiggleJitterScale, (y - 777) * squiggleJitterScale)
            phase += squigglePhaseJitter * nphase
          }
          const w = wave(phase)
          x += n[0] * amp * w
          y += n[1] * amp * w
        }

        if (x < minX || x > maxX || y < minY || y > maxY) {
          if (on) { polylines.push(cur); cur = []; on = false }
          continue
        }
        let keep
        if (sampleMask) {
          // Pre-dithered mask: 1 = ink
          keep = sampleMask(x, y) >= 0.5
        } else {
          // simple threshold at 0.5
          let g = sampleGray(x, y)
          if (invert) g = 1 - g
          if (gamma !== 1) g = Math.pow(g, gamma)
          keep = g < 0.5
        }
        if (keep && pointInAny([x,y], clipPolys)) {
          cur.push([x, y])
          on = true
        } else if (on) {
          polylines.push(cur)
          cur = []
          on = false
        }
      }
      if (cur.length) polylines.push(cur)
      if (onProgress && (lineIdx & 15) === 0) {
        try { onProgress(Math.max(0, Math.min(1, lineIdx / estLines))) } catch {}
      }
    }
    if (onProgress) { try { onProgress(1) } catch {} }

    return polylines
  }

  // Radial dots distributed on concentric rings
  if (shape === 'radialDots') {
    const polylines = []
    const cx = (Number.isFinite(+radialCenterX) ? +radialCenterX : (minX + maxX) * 0.5)
    const cy = (Number.isFinite(+radialCenterY) ? +radialCenterY : (minY + maxY) * 0.5)
    const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
    let maxR = 0
    for (const [px,py] of corners) maxR = Math.max(maxR, Math.hypot(px - cx, py - cy))
    const rmin = Math.max(spacing, 0.5)
    const dth = Math.max(1 * Math.PI/180, (angStepDeg||6) * Math.PI / 180)
    for (let r = rmin; r <= maxR + spacing; r += Math.max(0.5, spacing)) {
      const steps = Math.max(8, Math.ceil((Math.PI * 2) / dth))
      for (let i = 0; i < steps; i++) {
        const th = i * dth
        const x = cx + Math.cos(th) * r
        const y = cy + Math.sin(th) * r
        if (x < minX || x > maxX || y < minY || y > maxY) continue
        if (!pointInAny([x,y], clipPolys)) continue
        let g = sampleGray(x, y)
        if (invert) g = 1 - g
        if (gamma !== 1) g = Math.pow(g, gamma)
        const t = 1 - g
        const rad = Math.max(0, dotMin + (dotMax - dotMin) * t)
        if (rad <= 1e-3) continue
        polylines.push(circlePoly(x, y, rad, 18))
      }
    }
    return polylines
  }

  // Radial rings (concentric arcs)
  if (shape === 'rings') {
    const polylines = []
    const cx = (Number.isFinite(+radialCenterX) ? +radialCenterX : (minX + maxX) * 0.5)
    const cy = (Number.isFinite(+radialCenterY) ? +radialCenterY : (minY + maxY) * 0.5)
    const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
    let maxR = 0
    for (const [px,py] of corners) maxR = Math.max(maxR, Math.hypot(px - cx, py - cy))
    const rmin = Math.max(spacing, 0.5)
    for (let r = rmin; r <= maxR + spacing; r += Math.max(0.5, spacing)) {
      const stepAng = Math.max(0.02, (segment || 0.5) / Math.max(r, 1e-3))
      const total = Math.max(24, Math.ceil((Math.PI * 2) / stepAng))
      let on = false
      let cur = []
      for (let i = 0; i <= total; i++) {
        const th = (i / total) * Math.PI * 2
        const x = cx + Math.cos(th) * r
        const y = cy + Math.sin(th) * r
        if (x < minX || x > maxX || y < minY || y > maxY) {
          if (on) { polylines.push(cur); cur = []; on = false }
          continue
        }
        let keep
        if (sampleMask) {
          keep = sampleMask(x, y) >= 0.5
        } else {
          let g = sampleGray(x, y)
          if (invert) g = 1 - g
          if (gamma !== 1) g = Math.pow(g, gamma)
          keep = g < 0.5
        }
        if (keep && pointInAny([x,y], clipPolys)) {
          cur.push([x, y])
          on = true
        } else if (on) {
          polylines.push(cur)
          cur = []
          on = false
        }
      }
      if (cur.length) polylines.push(cur)
    }
    return polylines
  }

  // Dot grid shapes (circle, ellipse, square) oriented to the screen angle
  const polylines = []
  const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
  const projU = corners.map(p => p[0]*dir[0] + p[1]*dir[1])
  const projV = corners.map(p => p[0]*n[0] + p[1]*n[1])
  const imin = Math.floor((Math.min(...projU) - spacing*0.5) / spacing)
  const imax = Math.ceil((Math.max(...projU) + spacing*0.5) / spacing)
  const jmin = Math.floor((Math.min(...projV) - spacing*0.5) / spacing)
  const jmax = Math.ceil((Math.max(...projV) + spacing*0.5) / spacing)

  const ellipsePoly = (cx, cy, rx, ry, sides = 18) => {
    // Oriented by dir (rx along dir, ry along n)
    const out = []
    for (let i = 0; i <= sides; i++) {
      const t = (i / sides) * Math.PI * 2
      const ux = Math.cos(t), vy = Math.sin(t)
      const px = cx + dir[0]*(rx*ux) + n[0]*(ry*vy)
      const py = cy + dir[1]*(rx*ux) + n[1]*(ry*vy)
      out.push([px, py])
    }
    return out
  }

  for (let j = jmin; j <= jmax; j++) {
    for (let i = imin; i <= imax; i++) {
      const cx = dir[0]*(i*spacing) + n[0]*(j*spacing)
      const cy = dir[1]*(i*spacing) + n[1]*(j*spacing)
      if (cx < minX || cx > maxX || cy < minY || cy > maxY) continue
      if (!pointInAny([cx, cy], clipPolys)) continue
      let g = sampleGray(cx, cy)
      if (invert) g = 1 - g
      if (gamma !== 1) g = Math.pow(g, gamma)
      const t = 1 - g // darker -> bigger
      const r = Math.max(0, dotMin + (dotMax - dotMin) * t)
      if (r <= 1e-3) continue
      if (shape === 'circle') {
        polylines.push(circlePoly(cx, cy, r, 16))
      } else if (shape === 'ellipse') {
        const rx = r * Math.max(1e-3, dotAspect)
        const ry = r / Math.max(1e-3, dotAspect)
        polylines.push(ellipsePoly(cx, cy, rx, ry, 20))
      } else if (shape === 'square') {
        const rx = r, ry = r
        // rotated rectangle by axes dir/n
        const p1 = [cx + dir[0]*rx + n[0]*ry, cy + dir[1]*rx + n[1]*ry]
        const p2 = [cx - dir[0]*rx + n[0]*ry, cy - dir[1]*rx + n[1]*ry]
        const p3 = [cx - dir[0]*rx - n[0]*ry, cy - dir[1]*rx - n[1]*ry]
        const p4 = [cx + dir[0]*rx - n[0]*ry, cy + dir[1]*rx - n[1]*ry]
        polylines.push([p1,p2,p3,p4,p1])
      } else {
        // fallback to circle
        polylines.push(circlePoly(cx, cy, r, 16))
      }
    }
  }

  return polylines
}
