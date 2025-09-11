import { makeRNG } from '../random.js'

// Half-plane clipping for Voronoi using Sutherland–Hodgman
function clipAgainstBisector(poly, si, sj) {
  const mx = (si[0] + sj[0]) * 0.5
  const my = (si[1] + sj[1]) * 0.5
  const nx = sj[0] - si[0]
  const ny = sj[1] - si[1]
  const inside = (p) => ((p[0] - mx) * nx + (p[1] - my) * ny) <= 1e-9
  const intersect = (a, b) => {
    const bax = b[0] - a[0]
    const bay = b[1] - a[1]
    const denom = bax * nx + bay * ny
    if (Math.abs(denom) < 1e-12) return a // Parallel (shouldn’t happen often)
    const t = ((mx - a[0]) * nx + (my - a[1]) * ny) / denom
    return [a[0] + t * bax, a[1] + t * bay]
  }
  const out = []
  for (let i = 0, n = poly.length; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const ia = inside(a)
    const ib = inside(b)
    if (ia && ib) {
      out.push(b)
    } else if (ia && !ib) {
      out.push(intersect(a, b))
    } else if (!ia && ib) {
      out.push(intersect(a, b))
      out.push(b)
    }
  }
  return out
}

function centroid(poly) {
  let a = 0, cx = 0, cy = 0
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % n]
    const f = x1 * y2 - x2 * y1
    a += f
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  a *= 0.5
  if (Math.abs(a) < 1e-12) return poly[0]
  cx /= (6 * a)
  cy /= (6 * a)
  return [cx, cy]
}

function buildVoronoi(sites, bounds) {
  const [minX, minY, maxX, maxY] = bounds
  const rect = [ [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY] ]
  const cells = []
  for (let i = 0; i < sites.length; i++) {
    let poly = rect
    const si = sites[i]
    for (let j = 0; j < sites.length; j++) {
      if (i === j) continue
      const sj = sites[j]
      poly = clipAgainstBisector(poly, si, sj)
      if (poly.length === 0) break
    }
    if (poly.length >= 3) cells.push(poly)
  }
  return cells
}

export function voronoiShatter({ width = 420, height = 297, margin = 20, seed = 'seed', cells = 80, relax = 0, jitter = 0.0 }) {
  const { range, int } = makeRNG(seed)
  const minX = margin, minY = margin, maxX = width - margin, maxY = height - margin
  const w = maxX - minX, h = maxY - minY

  // Seed sites
  let sites = Array.from({ length: cells }, () => {
    const x = minX + range(0, 1) * w
    const y = minY + range(0, 1) * h
    const jx = (range(-1, 1) * w * 0.02) * jitter
    const jy = (range(-1, 1) * h * 0.02) * jitter
    return [x + jx, y + jy]
  })

  // Optional Lloyd relaxation
  for (let k = 0; k < relax; k++) {
    const cellsPolys = buildVoronoi(sites, [minX, minY, maxX, maxY])
    sites = cellsPolys.map(p => centroid(p))
  }

  const finalCells = buildVoronoi(sites, [minX, minY, maxX, maxY])

  // Return cell boundaries as closed polylines
  const polylines = finalCells.map(poly => {
    const closed = poly.slice()
    if (closed.length && (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1])) {
      closed.push(closed[0])
    }
    return closed
  })

  return polylines
}
