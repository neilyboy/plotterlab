import { makeRNG } from '../random.js'

function rectPoly(x, y, w, h) {
  return [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]
}

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

export function pixelMosaic({ width = 420, height = 297, margin = 20, cols = 32, rows = 24, density = 0.6, jitter = 0.0, style = 'squares', seed = 'seed', bitmap = null, levels = 3, invert = false, preserveAspect = true }) {
  const { range, int } = makeRNG(`${seed}:${cols}x${rows}:${density}:${style}`)
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const cw = (maxX - minX) / cols
  const ch = (maxY - minY) / rows

  const sample = makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect)
  const polylines = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = minX + c * cw
      const y = minY + r * ch
      const jx = (range(-1,1) * cw * 0.25) * jitter
      const jy = (range(-1,1) * ch * 0.25) * jitter
      const px = x + jx
      const py = y + jy
      const w = cw * (1 - jitter * 0.2)
      const h = ch * (1 - jitter * 0.2)

      let keep = true
      let lvl = 1
      if (sample) {
        let g = sample(x + cw/2, y + ch/2)
        if (invert) g = 1 - g
        // quantize darker -> higher level count
        lvl = Math.max(0, Math.min(levels, Math.floor((1 - g) * levels + 1e-6)))
        keep = lvl > 0
      } else {
        // fallback to density chance
        keep = range(0,1) <= density
      }
      if (!keep) continue

      if (style === 'squares') {
        if (sample) {
          // draw concentric squares based on level to simulate palette thresholds
          for (let k = 0; k < lvl; k++) {
            const inset = Math.min(w, h) * 0.04 * (k + 1)
            polylines.push(rectPoly(px + inset, py + inset, Math.max(0,w - 2*inset), Math.max(0,h - 2*inset)))
          }
        } else {
          polylines.push(rectPoly(px, py, w, h))
        }
      } else if (style === 'cross') {
        polylines.push([[px, py], [px+w, py+h]])
        if (lvl > 1) polylines.push([[px+w, py], [px, py+h]])
      } else if (style === 'plus') {
        polylines.push([[px + w/2, py], [px + w/2, py + h]])
        if (lvl > 1) polylines.push([[px, py + h/2], [px + w, py + h/2]])
      } else {
        // random among shapes
        const t = int(0, 2)
        if (t === 0) {
          polylines.push(rectPoly(px, py, w, h))
        } else if (t === 1) {
          polylines.push([[px, py], [px+w, py+h]])
          polylines.push([[px+w, py], [px, py+h]])
        } else {
          polylines.push([[px + w/2, py], [px + w/2, py + h]])
          polylines.push([[px, py + h/2], [px + w, py + h/2]])
        }
      }
    }
  }

  return polylines
}
