// Hatch fill generator with optional clipping to polygons
// Generates straight parallel lines at angleDeg, spaced by `spacing`, across
// the page (respecting margin). Optionally clips lines to given clip polygons.

function pointInPolygon(p, poly) {
  // Ray-casting algorithm
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1]
    const xj = poly[j][0], yj = poly[j][1]
    const intersect = ((yi > p[1]) !== (yj > p[1])) &&
      (p[0] < (xj - xi) * (p[1] - yi) / ((yj - yi) || 1e-12) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function segIntersect(a, b, c, d) {
  // Returns intersection point of segment ab with segment cd (if exists), else null
  const r = [b[0]-a[0], b[1]-a[1]]
  const s = [d[0]-c[0], d[1]-c[1]]
  const rxs = r[0]*s[1] - r[1]*s[0]
  const qpxr = (c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]
  if (Math.abs(rxs) < 1e-12 && Math.abs(qpxr) < 1e-12) return null // colinear - ignore
  if (Math.abs(rxs) < 1e-12) return null // parallel
  const t = ((c[0]-a[0])*s[1] - (c[1]-a[1])*s[0]) / rxs
  const u = ((c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]) / rxs
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [a[0] + t*r[0], a[1] + t*r[1], t]
  }
  return null
}

function clipSegmentToPolygon(a, b, poly) {
  // Clip line segment ab to (possibly concave) polygon poly.
  // Strategy: split by all intersections, sort by t, keep inside intervals.
  const pts = []
  const insideA = pointInPolygon(a, poly)
  const insideB = pointInPolygon(b, poly)
  pts.push([a[0], a[1], 0, insideA])
  pts.push([b[0], b[1], 1, insideB])
  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i]
    const q = poly[i+1]
    const inter = segIntersect(a, b, p, q)
    if (inter) pts.push([inter[0], inter[1], inter[2], true])
  }
  // If polygon closed, also check last->first (already ensured if input closed)
  if (poly.length > 2) {
    const p = poly[poly.length-1]
    const q = poly[0]
    const inter = segIntersect(a, b, p, q)
    if (inter) pts.push([inter[0], inter[1], inter[2], true])
  }
  // Sort by t
  pts.sort((u, v) => u[2] - v[2])
  const segments = []
  for (let i = 0; i < pts.length - 1; i++) {
    const t0 = (pts[i][2] + pts[i+1][2]) * 0.5
    const mid = [a[0] + (b[0]-a[0]) * t0, a[1] + (b[1]-a[1]) * t0]
    if (pointInPolygon(mid, poly)) {
      segments.push([[pts[i][0], pts[i][1]], [pts[i+1][0], pts[i+1][1]]])
    }
  }
  return segments
}

function clipSegmentToPolygons(a, b, polys) {
  // Union: keep segment pieces that lie inside ANY of the polygons
  if (!polys || polys.length === 0) return [[[a[0], a[1]], [b[0], b[1]]]]
  const unionParts = []
  for (const poly of polys) {
    const parts = clipSegmentToPolygon(a, b, poly)
    for (const p of parts) unionParts.push(p)
  }
  return unionParts
}

function rectPolygon(x0, y0, x1, y1) {
  return [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]
}

function uniqueTs(ts) {
  const out = []
  const eps = 1e-6
  ts.sort((a,b)=>a-b)
  for (const t of ts) {
    if (out.length === 0 || Math.abs(t - out[out.length-1]) > eps) out.push(t)
  }
  return out
}

function clipSegmentByRule(a, b, polys, rule = 'union') {
  if (!polys || polys.length === 0) return [[[a[0], a[1]], [b[0], b[1]]]]
  // Build split parameters along ab by intersecting with each polygon edge
  const ts = [0, 1]
  for (const poly of polys) {
    for (let i = 0; i < poly.length - 1; i++) {
      const p = poly[i]
      const q = poly[i+1]
      const inter = segIntersect(a, b, p, q)
      if (inter) ts.push(Math.max(0, Math.min(1, inter[2])))
    }
  }
  const T = uniqueTs(ts)
  const pieces = []
  for (let i = 0; i < T.length - 1; i++) {
    const t0 = T[i], t1 = T[i+1]
    if (t1 - t0 < 1e-6) continue
    const midT = (t0 + t1) * 0.5
    const mid = [a[0] + (b[0]-a[0]) * midT, a[1] + (b[1]-a[1]) * midT]
    let insideCount = 0
    for (const poly of polys) if (pointInPolygon(mid, poly)) insideCount++
    let keep = false
    switch (rule) {
      case 'evenodd': keep = (insideCount % 2) === 1; break
      case 'intersect': keep = insideCount === polys.length; break
      case 'difference': {
        // First polygon minus union of the rest
        const inFirst = polys[0] ? pointInPolygon(mid, polys[0]) : false
        let inOthers = false
        for (let k = 1; k < polys.length && !inOthers; k++) inOthers = inOthers || pointInPolygon(mid, polys[k])
        keep = inFirst && !inOthers
        break
      }
      case 'union':
      default:
        keep = insideCount > 0
    }
    if (keep) {
      pieces.push([
        [a[0] + (b[0]-a[0]) * t0, a[1] + (b[1]-a[1]) * t0],
        [a[0] + (b[0]-a[0]) * t1, a[1] + (b[1]-a[1]) * t1]
      ])
    }
  }
  return pieces
}

export function hatchFill({ width = 420, height = 297, margin = 20, angleDeg = 45, spacing = 6, offset = 0, cross = false, crossOffset = 0, clipPolys = [], clipGroups = [], clipRule = 'union' }) {
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const rect = rectPolygon(minX, minY, maxX, maxY)

  function gen(angleDegLocal, offsetLocal) {
    const angle = (angleDegLocal * Math.PI) / 180
    const dir = [Math.cos(angle), Math.sin(angle)] // along the line
    const n = [-dir[1], dir[0]] // normal
    // Compute k-range by projecting rectangle corners onto normal
    const corners = [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]
    const proj = corners.map(p => p[0]*n[0] + p[1]*n[1])
    let kmin = Math.min(...proj)
    let kmax = Math.max(...proj)
    kmin -= spacing // a bit extra
    kmax += spacing
    const step = Math.max(0.001, spacing)
    const polylines = []
    const startK = kmin + (offsetLocal % step + step) % step
    for (let k = startK; k <= kmax; k += step) {
      // Construct a long segment along dir that crosses the rectangle
      const center = [(minX+maxX)/2, (minY+maxY)/2]
      const t0 = k - (center[0]*n[0] + center[1]*n[1])
      const p0 = [center[0] + n[0]*t0, center[1] + n[1]*t0]
      const L = Math.hypot(width, height)
      const a = [p0[0] - dir[0]*L, p0[1] - dir[1]*L]
      const b = [p0[0] + dir[0]*L, p0[1] + dir[1]*L]

      // First clip to page rect
      const rectSegs = clipSegmentToPolygon(a, b, rect)
      for (const seg of rectSegs) {
        if (clipGroups && clipGroups.length) {
          // Each group: [outer, ...inners] => compute (outer - union(inners))
          for (const grp of clipGroups) {
            if (!grp || grp.length === 0) continue
            const parts = clipSegmentByRule(seg[0], seg[1], grp, 'difference')
            for (const pp of parts) polylines.push(pp)
          }
        } else {
          const pieces = clipSegmentByRule(seg[0], seg[1], clipPolys, clipRule)
          for (const pp of pieces) polylines.push(pp)
        }
      }
    }
    return polylines
  }

  const out = gen(angleDeg, offset)
  if (cross) {
    const out2 = gen(angleDeg + 90, crossOffset)
    return out.concat(out2)
  }
  return out
}
