import { makeRNG } from '../random.js'

function roundCorners(poly, r = 0, segments = 4) {
  if (r <= 0 || poly.length < 3) return poly
  const out = [poly[0]]
  for (let i = 1; i < poly.length - 1; i++) {
    const p0 = poly[i - 1]
    const p1 = poly[i]
    const p2 = poly[i + 1]
    const v0 = [p1[0] - p0[0], p1[1] - p0[1]]
    const v1 = [p2[0] - p1[0], p2[1] - p1[1]]
    const len0 = Math.hypot(v0[0], v0[1])
    const len1 = Math.hypot(v1[0], v1[1])
    if (len0 === 0 || len1 === 0) continue
    const d0 = Math.min(r, len0 / 2)
    const d1 = Math.min(r, len1 / 2)
    const a0 = [v0[0] / len0, v0[1] / len0]
    const a1 = [v1[0] / len1, v1[1] / len1]
    const pA = [p1[0] - a0[0] * d0, p1[1] - a0[1] * d0]
    const pB = [p1[0] + a1[0] * d1, p1[1] + a1[1] * d1]
    out.push(pA)
    // simple linear interpolation along the corner
    for (let s = 1; s < segments; s++) {
      const t = s / segments
      out.push([pA[0] * (1 - t) + pB[0] * t, pA[1] * (1 - t) + pB[1] * t])
    }
    out.push(pB)
  }
  out.push(poly[poly.length - 1])
  return out
}

export function retroPipes({ width = 420, height = 297, margin = 20, cols = 24, rows = 16, runs = 3, steps = 240, turnProb = 0.35, round = 2, seed = 'seed' }) {
  const { int, range } = makeRNG(`${seed}:${width}x${height}:${cols}x${rows}:${runs}:${steps}`)
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const cellW = (maxX - minX) / cols
  const cellH = (maxY - minY) / rows
  const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ]

  const polylines = []

  for (let r = 0; r < runs; r++) {
    let x = int(0, cols - 1)
    let y = int(0, rows - 1)
    let d = dirs[int(0, dirs.length - 1)]
    const pts = []
    const toXY = (cx, cy) => [minX + cx * cellW + cellW / 2, minY + cy * cellH + cellH / 2]
    pts.push(toXY(x, y))

    for (let s = 0; s < steps; s++) {
      // maybe turn (seeded)
      if (range(0,1) < turnProb) {
        const perpendicular = d[0] !== 0 ? [ [0,1], [0,-1] ] : [ [1,0], [-1,0] ]
        d = perpendicular[int(0,1)]
      }
      let nx = x + d[0]
      let ny = y + d[1]
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        // bounce
        d = [-d[0], -d[1]]
        nx = x + d[0]
        ny = y + d[1]
      }
      x = nx; y = ny
      pts.push(toXY(x, y))
    }
    polylines.push(roundCorners(pts, round, 4))
  }

  return polylines
}
