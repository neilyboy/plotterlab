import { mdiFlower, mdiStarFourPoints, mdiHeart, mdiRobot, mdiHexagonMultiple } from '@mdi/js'
import { makeRNG } from '../random.js'
import { sampleSvgPathMulti } from '../svgPathSample.js'

const ICONS = [
  { key: 'flower', name: 'mdiFlower', d: mdiFlower },
  { key: 'star', name: 'mdiStarFourPoints', d: mdiStarFourPoints },
  { key: 'heart', name: 'mdiHeart', d: mdiHeart },
  { key: 'robot', name: 'mdiRobot', d: mdiRobot },
  { key: 'hex', name: 'mdiHexagonMultiple', d: mdiHexagonMultiple },
]

// Path sampling now imported from svgPathSample.js for worker safety

function transform(poly, { x = 0, y = 0, scale = 1, rotate = 0 }) {
  const s = Math.sin(rotate)
  const c = Math.cos(rotate)
  return poly.map(([px, py]) => {
    // Center icon around (0,0) from 24x24 MDI viewBox
    const cx = (px - 12) * scale
    const cy = (py - 12) * scale
    const rx = cx * c - cy * s
    const ry = cx * s + cy * c
    return [rx + x, ry + y]
  })
}

// Normalizer kept here for reference and to pre-normalize before API requests if needed
export function normalizeMdiName(name) {
  if (!name) return 'mdiFlower'
  let n = String(name).trim()
  if (n.startsWith('mdi:')) n = n.slice(4)
  if (!n.startsWith('mdi')) {
    const parts = n.replace(/[_:]+/g,'-').split('-').filter(Boolean)
    const pascal = parts.map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join('')
    return 'mdi' + pascal
  }
  return n
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

// params: iconIndex, iconName, cols, rows, spacing, scale, rotation, jitter, margin, samples, clipPolys, clipRule
export function mdiPattern({ iconIndex = 0, iconName = 'mdiFlower', iconD, cols = 6, rows = 5, spacing = 40, scale = 6, rotation = 0, jitter = 0.05, margin = 20, samples = 400, width = 420, height = 297, seed = 'seed', clipPolys = [], clipRule = 'union' }) {
  const chosenD = iconD || ICONS.find(i => i.name === normalizeMdiName(iconName))?.d || ICONS[Math.max(0, Math.min(ICONS.length - 1, iconIndex))].d
  const basePolys = sampleSvgPathMulti(chosenD, samples)
  const { range } = makeRNG(seed)

  const polylines = []
  const startX = margin + spacing / 2
  const startY = margin + spacing / 2

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = startX + i * spacing
      const y = startY + j * spacing
      const jitterX = range(-1, 1) * spacing * jitter
      const jitterY = range(-1, 1) * spacing * jitter
      const angle = rotation + range(-1, 1) * Math.PI * jitter * 0.5
      for (const bp of basePolys) {
        const tr = transform(bp, { x: x + jitterX, y: y + jitterY, scale, rotate: angle })
        if (!clipPolys || clipPolys.length === 0) {
          polylines.push(tr)
        } else {
          // clip each segment
          for (let k = 0; k < tr.length - 1; k++) {
            const segs = clipSegmentByRule(tr[k], tr[k+1], clipPolys, clipRule)
            for (const s of segs) polylines.push(s)
          }
        }
      }
    }
  }

  return polylines
}

export const mdiIconOptions = ICONS.map((i, idx) => ({ label: i.key, value: idx, name: i.name }))
