// Image Contours (Marching Squares)
// Extract iso-contours from a grayscale bitmap mapped onto the page rect.

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

export function imageContours({ bitmap, width = 420, height = 297, margin = 20, cols = 140, rows = 100, levels = 8, invert = false, gamma = 1.0, preserveAspect = true, onProgress }) {
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const sample = makeSampler(bitmap, minX, minY, maxX, maxY, preserveAspect)

  cols = Math.max(2, Math.floor(cols))
  rows = Math.max(2, Math.floor(rows))
  levels = Math.max(1, Math.floor(levels))

  // Sample scalar field at grid nodes
  const grid = new Float32Array((cols + 1) * (rows + 1))
  const nx = cols + 1, ny = rows + 1
  for (let j = 0; j < ny; j++) {
    const y = minY + (j / rows) * (maxY - minY)
    for (let i = 0; i < nx; i++) {
      const x = minX + (i / cols) * (maxX - minX)
      let g = sample(x, y)
      if (invert) g = 1 - g
      if (gamma !== 1) g = Math.pow(g, gamma)
      grid[j * nx + i] = g
    }
    if (onProgress && (j & 7) === 0) onProgress(j / ny * 0.3)
  }

  // Marching Squares helper: interpolate along edge
  const interp = (x0, y0, x1, y1, v0, v1, t) => {
    const a = (t - v0) / Math.max(1e-9, (v1 - v0))
    return [x0 + (x1 - x0) * a, y0 + (y1 - y0) * a]
  }

  const out = []
  const thresholds = []
  for (let k = 1; k <= levels; k++) thresholds.push(k / (levels + 1))

  const cellW = (maxX - minX) / cols
  const cellH = (maxY - minY) / rows

  let processed = 0
  const totalCells = cols * rows * levels
  for (let l = 0; l < thresholds.length; l++) {
    const T = thresholds[l]
    for (let j = 0; j < rows; j++) {
      const y0 = minY + j * cellH
      const y1 = y0 + cellH
      for (let i = 0; i < cols; i++) {
        const x0 = minX + i * cellW
        const x1 = x0 + cellW
        const v00 = grid[j * nx + i]
        const v10 = grid[j * nx + i + 1]
        const v01 = grid[(j + 1) * nx + i]
        const v11 = grid[(j + 1) * nx + i + 1]
        let idx = 0
        if (v00 > T) idx |= 1
        if (v10 > T) idx |= 2
        if (v11 > T) idx |= 4
        if (v01 > T) idx |= 8
        if (idx === 0 || idx === 15) { processed++; continue }

        // Edge intersections
        const e = new Array(4).fill(null)
        // left (v00-v01)
        if ((idx & 1) !== (idx & 8)) e[0] = interp(x0, y0, x0, y1, v00, v01, T)
        // top (v00-v10)
        if ((idx & 1) !== (idx & 2)) e[1] = interp(x0, y0, x1, y0, v00, v10, T)
        // right (v10-v11)
        if ((idx & 2) !== (idx & 4)) e[2] = interp(x1, y0, x1, y1, v10, v11, T)
        // bottom (v01-v11)
        if ((idx & 8) !== (idx & 4)) e[3] = interp(x0, y1, x1, y1, v01, v11, T)

        // Cases: we add up to two segments per cell
        const addSeg = (a, b) => { if (a && b) out.push([a, b]) }
        switch (idx) {
          case 1: case 14: addSeg(e[1], e[0]); break
          case 2: case 13: addSeg(e[2], e[1]); break
          case 3: case 12: addSeg(e[2], e[0]); break
          case 4: case 11: addSeg(e[3], e[2]); break
          case 5:          addSeg(e[1], e[3]); addSeg(e[0], e[2]); break // ambiguous
          case 6: case 9:  addSeg(e[3], e[1]); break
          case 7: case 8:  addSeg(e[0], e[3]); break
          case 10:         addSeg(e[0], e[2]); break
        }
        processed++
        if (onProgress && (processed % 5000 === 0)) onProgress(0.3 + 0.7 * (processed / totalCells))
      }
    }
  }
  return out
}
