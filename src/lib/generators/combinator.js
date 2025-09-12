// Combinator: boolean-like ops on two source polygon sets (outline approximation)
// Returns stitched polylines representing boundaries. Works best for clean, non-self-
// intersecting rings. Holes/overlaps are approximated as union of rings.

function segIntersect(a, b, c, d) {
  const r = [b[0]-a[0], b[1]-a[1]]
  const s = [d[0]-c[0], d[1]-c[1]]
  const rxs = r[0]*s[1] - r[1]*s[0]
  const qpxr = (c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]
  if (Math.abs(rxs) < 1e-12 && Math.abs(qpxr) < 1e-12) return null
  if (Math.abs(rxs) < 1e-12) return null
  const t = ((c[0]-a[0])*s[1] - (c[1]-a[1])*s[0]) / rxs
  const u = ((c[0]-a[0])*r[1] - (c[1]-a[1])*r[0]) / rxs
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return t
  return null
}

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

function insideUnion(pt, polys) {
  for (const poly of (polys||[])) if (pointInPolygon(pt, poly)) return true
  return false
}

function splitSegmentByPolys(a, b, polys) {
  const ts = [0, 1]
  for (const poly of (polys||[])) {
    for (let i = 0; i < poly.length - 1; i++) {
      const t = segIntersect(a, b, poly[i], poly[i+1])
      if (t !== null) ts.push(t)
    }
  }
  ts.sort((x,y)=>x-y)
  const out = []
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i], t1 = ts[i+1]
    if (t1 - t0 < 1e-6) continue
    const tm = (t0 + t1) * 0.5
    const mx = a[0] + (b[0]-a[0]) * tm
    const my = a[1] + (b[1]-a[1]) * tm
    const inside = insideUnion([mx, my], polys)
    out.push([t0, t1, inside])
  }
  return out
}

function stitchSegments(segments) {
  // segments: array of [[x0,y0],[x1,y1]]
  const key = (pt) => `${Math.round(pt[0] * 10)},${Math.round(pt[1] * 10)}`
  const map = new Map()
  for (const [p, q] of segments) {
    const kp = key(p), kq = key(q)
    const a = map.get(kp) || { p, next: [], prev: [] }
    const b = map.get(kq) || { p: q, next: [], prev: [] }
    a.next.push(kq)
    b.prev.push(kp)
    map.set(kp, a)
    map.set(kq, b)
  }
  const visited = new Set()
  const polylines = []
  for (const [k0] of map.entries()) {
    if (visited.has(k0)) continue
    let curK = k0
    const pts = []
    while (true) {
      const n = map.get(curK)
      if (!n || visited.has(curK)) break
      visited.add(curK)
      pts.push(n.p)
      curK = n.next[0]
      if (!curK) break
      if (curK === k0) { pts.push(map.get(curK).p); break }
    }
    if (pts.length >= 4) polylines.push(pts)
  }
  return polylines
}

export function combinator({ ringsA = [], ringsB = [], op = 'intersect' }) {
  const segs = []
  const pushSegsFrom = (rings, other, keepInside) => {
    for (const poly of (rings||[])) {
      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i], b = poly[i+1]
        const parts = splitSegmentByPolys(a, b, other)
        for (const [t0, t1, inside] of parts) {
          const keep = keepInside ? inside : !inside
          if (!keep) continue
          const x0 = a[0] + (b[0]-a[0]) * t0
          const y0 = a[1] + (b[1]-a[1]) * t0
          const x1 = a[0] + (b[0]-a[0]) * t1
          const y1 = a[1] + (b[1]-a[1]) * t1
          segs.push([[x0, y0], [x1, y1]])
        }
      }
    }
  }
  if (op === 'intersect') {
    pushSegsFrom(ringsA, ringsB, true)
    pushSegsFrom(ringsB, ringsA, true)
  } else if (op === 'difference') {
    pushSegsFrom(ringsA, ringsB, false) // A - B
  } else if (op === 'xor') {
    pushSegsFrom(ringsA, ringsB, false)
    pushSegsFrom(ringsB, ringsA, false)
  } else if (op === 'union') {
    // Approximate: boundaries outside the other set
    pushSegsFrom(ringsA, ringsB, false)
    pushSegsFrom(ringsB, ringsA, false)
  }
  return stitchSegments(segs)
}
