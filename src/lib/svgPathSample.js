// DOM-free SVG path sampler utilities for use in both main thread and Web Worker
// Exports:
// - splitPathD(d): string[]
// - sampleSvgPathSingle(d, samples): [ [x,y], ... ]
// - sampleSvgPathMulti(d, samples): Array< Array<[x,y]> >

const PATH_CACHE = new Map()

export function splitPathD(d) {
  if (typeof d !== 'string') return []
  const s = d.trim()
  if (!s) return []
  const parts = []
  let start = 0
  for (let i = 1; i < s.length; i++) {
    const c = s[i]
    if (c === 'M' || c === 'm') {
      parts.push(s.slice(start, i).trim())
      start = i
    }
  }
  parts.push(s.slice(start).trim())
  return parts.filter(Boolean)
}

function dist(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.hypot(dx, dy)
}

// Basic path parser producing absolute segments
function parsePathAbs(d) {
  const tokens = []
  const re = /[a-zA-Z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g
  let m
  while ((m = re.exec(d)) !== null) tokens.push(m[0])
  let i = 0
  const segs = []
  let cmd = ''
  let x = 0, y = 0, x0 = 0, y0 = 0 // current point and subpath start
  let prevCtrl = null

  function num() { return parseFloat(tokens[i++]) }
  function hasMore() { return i < tokens.length }

  while (i < tokens.length) {
    const t = tokens[i]
    if (/[a-zA-Z]/.test(t)) { cmd = tokens[i++]; } // consume command
    const rel = (cmd >= 'a' && cmd <= 'z')
    switch (cmd) {
      case 'M': case 'm': {
        const nx = num(), ny = num()
        x = rel ? x + nx : nx; y = rel ? y + ny : ny
        x0 = x; y0 = y
        segs.push({ type: 'M', x, y })
        // Subsequent pairs are implicit L
        while (hasMore() && !/[a-zA-Z]/.test(tokens[i])) {
          const lx = num(), ly = num()
          const x1 = rel ? x + lx : lx
          const y1 = rel ? y + ly : ly
          segs.push({ type: 'L', x1: x, y1: y, x2: x1, y2: y1 })
          x = x1; y = y1
        }
        prevCtrl = null
        break
      }
      case 'L': case 'l': {
        const nx = num(), ny = num()
        const x1 = x, y1 = y
        x = rel ? x + nx : nx; y = rel ? y + ny : ny
        segs.push({ type: 'L', x1, y1, x2: x, y2: y })
        prevCtrl = null
        break
      }
      case 'H': case 'h': {
        const nx = num()
        const x1 = x, y1 = y
        x = rel ? x + nx : nx
        segs.push({ type: 'L', x1, y1, x2: x, y2: y })
        prevCtrl = null
        break
      }
      case 'V': case 'v': {
        const ny = num()
        const x1 = x, y1 = y
        y = rel ? y + ny : ny
        segs.push({ type: 'L', x1, y1, x2: x, y2: y })
        prevCtrl = null
        break
      }
      case 'C': case 'c': {
        const x1 = rel ? x + num() : num(); const y1 = rel ? y + num() : num()
        const x2 = rel ? x + num() : num(); const y2 = rel ? y + num() : num()
        const x3 = rel ? x + num() : num(); const y3 = rel ? y + num() : num()
        segs.push({ type: 'C', x1, y1, x2, y2, x3, y3, x0: x, y0: y })
        prevCtrl = [x2, y2]
        x = x3; y = y3
        break
      }
      case 'S': case 's': {
        const x2 = rel ? x + num() : num(); const y2 = rel ? y + num() : num()
        const x3 = rel ? x + num() : num(); const y3 = rel ? y + num() : num()
        let x1 = x, y1 = y
        if (prevCtrl) { x1 = 2*x - prevCtrl[0]; y1 = 2*y - prevCtrl[1] }
        segs.push({ type: 'C', x1, y1, x2, y2, x3, y3, x0: x, y0: y })
        prevCtrl = [x2, y2]
        x = x3; y = y3
        break
      }
      case 'Q': case 'q': {
        const qx1 = rel ? x + num() : num(); const qy1 = rel ? y + num() : num()
        const qx2 = rel ? x + num() : num(); const qy2 = rel ? y + num() : num()
        segs.push({ type: 'Q', x1: qx1, y1: qy1, x2: qx2, y2: qy2, x0: x, y0: y })
        prevCtrl = [qx1, qy1]
        x = qx2; y = qy2
        break
      }
      case 'T': case 't': {
        const qx2 = rel ? x + num() : num(); const qy2 = rel ? y + num() : num()
        let x1t = x, y1t = y
        if (prevCtrl) { x1t = 2*x - prevCtrl[0]; y1t = 2*y - prevCtrl[1] }
        segs.push({ type: 'Q', x1: x1t, y1: y1t, x2: qx2, y2: qy2, x0: x, y0: y })
        prevCtrl = [x1t, y1t]
        x = qx2; y = qy2
        break
      }
      case 'A': case 'a': {
        const rx = Math.abs(num())
        const ry = Math.abs(num())
        const phi = (num() * Math.PI) / 180
        const fa = num() ? 1 : 0
        const fs = num() ? 1 : 0
        const ex = rel ? x + num() : num()
        const ey = rel ? y + num() : num()
        segs.push({ type: 'A', rx, ry, phi, fa, fs, x1: x, y1: y, x2: ex, y2: ey })
        x = ex; y = ey
        prevCtrl = null
        break
      }
      case 'Z': case 'z': {
        segs.push({ type: 'Z', x1: x, y1: y, x2: x0, y2: y0 })
        x = x0; y = y0
        prevCtrl = null
        break
      }
      default: {
        // If we encounter an unknown token, advance to avoid infinite loop
        i++
        break
      }
    }
  }
  return segs
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t
  const x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
  const y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
  return [x, y]
}
function quadPoint(p0, p1, p2, t) {
  const u = 1 - t
  const x = u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0]
  const y = u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]
  return [x, y]
}

// SVG spec elliptical arc conversion to center parameterization
function arcToCenter({ rx, ry, phi, fa, fs, x1, y1, x2, y2 }) {
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi)
  const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2
  const x1p = cosPhi * dx2 + sinPhi * dy2
  const y1p = -sinPhi * dx2 + cosPhi * dy2
  let rxs = rx * rx, rys = ry * ry
  const lambda = (x1p*x1p) / rxs + (y1p*y1p) / rys
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; rxs = rx*rx; rys = ry*ry }
  const sign = (fa === fs) ? -1 : 1
  const num = rxs*rys - rxs*y1p*y1p - rys*x1p*x1p
  const denom = rxs*y1p*y1p + rys*x1p*x1p
  const cc = Math.max(0, num / Math.max(1e-12, denom))
  const coef = sign * Math.sqrt(cc)
  const cxp = coef * (rx * y1p) / ry
  const cyp = coef * (-ry * x1p) / rx
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2

  function angle(u, v) {
    const dot = u[0]*v[0] + u[1]*v[1]
    const len = Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])
    let ang = Math.acos(Math.max(-1, Math.min(1, dot / Math.max(1e-12, len))))
    if ((u[0]*v[1] - u[1]*v[0]) < 0) ang = -ang
    return ang
  }
  const v1 = [(x1p - cxp) / rx, (y1p - cyp) / ry]
  const v2 = [(-x1p - cxp) / rx, (-y1p - cyp) / ry]
  let theta1 = angle([1,0], v1)
  let delta = angle(v1, v2)
  if (!fs && delta > 0) delta -= 2 * Math.PI
  if (fs && delta < 0) delta += 2 * Math.PI
  return { cx, cy, theta1, delta, rx, ry, phi }
}

function sampleArc(seg, steps) {
  const { cx, cy, theta1, delta, rx, ry, phi } = arcToCenter(seg)
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi)
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const th = theta1 + delta * t
    const x = cx + rx * Math.cos(th)
    const y = cy + ry * Math.sin(th)
    // rotate back
    const xr = cosPhi * (x - cx) - sinPhi * (y - cy) + cx
    const yr = sinPhi * (x - cx) + cosPhi * (y - cy) + cy
    pts.push([xr, yr])
  }
  return pts
}

function approximateLengthOfSeg(seg) {
  switch (seg.type) {
    case 'L': return dist([seg.x1, seg.y1], [seg.x2, seg.y2])
    case 'C': {
      const p0 = [seg.x0, seg.y0], p1 = [seg.x1, seg.y1], p2 = [seg.x2, seg.y2], p3 = [seg.x3, seg.y3]
      let prev = p0, L = 0
      const n = 8
      for (let i = 1; i <= n; i++) { const pt = cubicPoint(p0, p1, p2, p3, i/n); L += dist(prev, pt); prev = pt }
      return L
    }
    case 'Q': {
      const p0 = [seg.x0, seg.y0], p1 = [seg.x1, seg.y1], p2 = [seg.x2, seg.y2]
      let prev = p0, L = 0
      const n = 6
      for (let i = 1; i <= n; i++) { const pt = quadPoint(p0, p1, p2, i/n); L += dist(prev, pt); prev = pt }
      return L
    }
    case 'A': {
      // approximate by arc radius * angle
      const { delta, rx, ry } = arcToCenter(seg)
      const r = (Math.abs(rx) + Math.abs(ry)) / 2
      return Math.abs(delta) * r
    }
    case 'Z': return dist([seg.x1, seg.y1], [seg.x2, seg.y2])
    default: return 0
  }
}

export function sampleSvgPathSingle(d, samples = 500) {
  if (typeof d !== 'string' || !d.trim()) return []
  let n = Number.isFinite(+samples) ? Math.floor(+samples) : 0
  if (n < 2) n = 2
  if (n > 800) n = 800
  const key = `${n}|${d}`
  if (PATH_CACHE.has(key)) return PATH_CACHE.get(key)

  try {
    const segs = parsePathAbs(d)
    // Compute total length
    let total = 0
    const lengths = segs.map(s => { const L = approximateLengthOfSeg(s); total += L; return L })
    if (total <= 0) return []
    const pts = []
    let acc = 0
    for (let si = 0; si < segs.length; si++) {
      const s = segs[si]
      const L = lengths[si]
      if (L <= 0) continue
      // allocate steps proportionally (ensure at least 1 step)
      let steps = Math.max(1, Math.round((L / total) * n))
      // sample
      if (s.type === 'L' || s.type === 'Z') {
        const p0 = [s.x1, s.y1], p1 = [s.x2, s.y2]
        for (let i = 0; i < steps; i++) {
          const t = i / steps
          const x = p0[0] + (p1[0] - p0[0]) * t
          const y = p0[1] + (p1[1] - p0[1]) * t
          if (pts.length === 0 || dist(pts[pts.length-1], [x, y]) > 1e-9) pts.push([x, y])
        }
        if (si === segs.length - 1) pts.push(p1)
      } else if (s.type === 'C') {
        const p0 = [s.x0, s.y0], p1 = [s.x1, s.y1], p2 = [s.x2, s.y2], p3 = [s.x3, s.y3]
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const pt = cubicPoint(p0, p1, p2, p3, t)
          if (pts.length === 0 || dist(pts[pts.length-1], pt) > 1e-9) pts.push(pt)
        }
      } else if (s.type === 'Q') {
        const p0 = [s.x0, s.y0], p1 = [s.x1, s.y1], p2 = [s.x2, s.y2]
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const pt = quadPoint(p0, p1, p2, t)
          if (pts.length === 0 || dist(pts[pts.length-1], pt) > 1e-9) pts.push(pt)
        }
      } else if (s.type === 'A') {
        const nSteps = Math.max(6, Math.min(80, Math.round((L / total) * n)))
        const arcPts = sampleArc(s, nSteps)
        for (let i = 0; i < arcPts.length; i++) {
          const pt = arcPts[i]
          if (pts.length === 0 || dist(pts[pts.length-1], pt) > 1e-9) pts.push(pt)
        }
      }
    }
    PATH_CACHE.set(key, pts)
    return pts
  } catch {
    return []
  }
}

export function sampleSvgPathMulti(d, samples = 500) {
  const subs = splitPathD(d)
  if (subs.length <= 1) return [sampleSvgPathSingle(d, samples)].filter(a => a && a.length)
  // approximate lengths for proportional allocation
  const approx = subs.map(sd => sampleSvgPathSingle(sd, Math.max(16, Math.floor(samples / subs.length))))
  const lengths = approx.map(arr => {
    let L = 0
    for (let i = 1; i < arr.length; i++) L += dist(arr[i-1], arr[i])
    return L
  })
  const total = lengths.reduce((a,b)=>a+b, 0) || 1
  const out = []
  for (let i = 0; i < subs.length; i++) {
    const frac = lengths[i] / total
    const n = Math.max(2, Math.floor(frac * samples) || Math.floor(samples / subs.length))
    const pts = sampleSvgPathSingle(subs[i], n)
    if (pts && pts.length) out.push(pts)
  }
  return out
}
