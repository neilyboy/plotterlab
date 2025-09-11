// Ramer–Douglas–Peucker simplification for polylines
// Tolerance is in the same units as coordinates (mm). 0 disables simplification.

function getSqSegDist(p, a, b) {
  let x = a[0], y = a[1]
  let dx = b[0] - x
  let dy = b[1] - y

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) { x = b[0]; y = b[1] }
    else if (t > 0) { x += dx * t; y += dy * t }
  }

  dx = p[0] - x
  dy = p[1] - y
  return dx * dx + dy * dy
}

function rdp(points, epsSq) {
  const last = points.length - 1
  if (last < 2) return points.slice()
  let index = -1
  let maxDist = -1
  for (let i = 1; i < last; i++) {
    const dist = getSqSegDist(points[i], points[0], points[last])
    if (dist > maxDist) {
      index = i
      maxDist = dist
    }
  }
  if (maxDist > epsSq) {
    const left = rdp(points.slice(0, index + 1), epsSq)
    const right = rdp(points.slice(index), epsSq)
    return left.slice(0, -1).concat(right)
  } else {
    return [points[0], points[last]]
  }
}

export function simplifyPolyline(poly, tolerance = 0) {
  const pts = Array.isArray(poly) ? poly : []
  if (tolerance <= 0 || pts.length <= 2) return pts.slice()
  const closed = pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]
  const work = closed ? pts.slice(0, -1) : pts
  const simplified = rdp(work, tolerance * tolerance)
  if (closed) {
    if (simplified.length < 3) return pts.slice()
    const first = simplified[0], last = simplified[simplified.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) simplified.push(first)
  }
  return simplified
}

export function simplifyPolylines(polylines, tolerance = 0) {
  if (!polylines || tolerance <= 0) return polylines
  return polylines.map(p => simplifyPolyline(p, tolerance))
}
