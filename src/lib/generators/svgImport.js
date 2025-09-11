// Simple SVG import generator: applies transform params to pre-parsed polylines
// Optionally clips to provided polygons using a rule ('union','evenodd','intersect','difference').
export function svgImport({ srcPolylines = [], scale = 1, offsetX = 0, offsetY = 0, rotate = 0, rotateDeg, clipPolys = [], clipRule = 'union' }) {
  const rot = typeof rotateDeg === 'number' ? (rotateDeg * Math.PI / 180) : rotate
  const s = Math.sin(rot)
  const c = Math.cos(rot)
  const transformPoint = ([x, y]) => {
    const rx = x * c - y * s
    const ry = x * s + y * c
    return [rx * scale + offsetX, ry * scale + offsetY]
  }

  const polys = srcPolylines.map(poly => poly.map(transformPoint))
  if (!clipPolys || clipPolys.length === 0) return polys

  function pointInPolygon(p, poly) {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1]
      const xj = poly[j][0], yj = poly[j][1]
      const intersect = ((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / ((yj - yi) || 1e-12) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  function segIntersect(a, b, c, d) {
    const r = [b[0]-a[0], b[1]-a[1]]
    const s = [d[0]-c[0], d[1]-c[1]]
    const rxs = r[0]*s[1] - r[1]*s[0]
    const qpxr = (c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]
    if (Math.abs(rxs) < 1e-12 && Math.abs(qpxr) < 1e-12) return null
    if (Math.abs(rxs) < 1e-12) return null
    const t = ((c[0]-a[0])*s[1] - (c[1]-a[1])*s[0]) / rxs
    const u = ((c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]) / rxs
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return [a[0] + t*r[0], a[1] + t*r[1], t]
    return null
  }

  function uniqueTs(ts) {
    const out = []
    const eps = 1e-6
    ts.sort((a,b)=>a-b)
    for (const t of ts) if (out.length === 0 || Math.abs(t - out[out.length-1]) > eps) out.push(t)
    return out
  }

  function clipSegmentByRule(a, b, polys, rule = 'union') {
    if (!polys || polys.length === 0) return [[[a[0], a[1]], [b[0], b[1]]]]
    const ts = [0, 1]
    for (const poly of polys) {
      for (let i = 0; i < poly.length - 1; i++) {
        const p = poly[i], q = poly[i+1]
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

  // Clip transformed polylines
  const out = []
  for (const pl of polys) {
    for (let i = 0; i < pl.length - 1; i++) {
      const segs = clipSegmentByRule(pl[i], pl[i+1], clipPolys, clipRule)
      for (const s of segs) out.push(s)
    }
  }
  return out
}
