// Parse SVG text into polylines using browser DOM APIs. Designed for client-side use.
// Supported elements: path (sampled), polyline, polygon, line, rect
// transform support: translate, scale, rotate(angle[, cx, cy])

function parseTransform(str) {
  if (!str) return (pt) => pt
  const cmds = []
  const re = /(translate|scale|rotate)\(([^\)]*)\)/g
  let m
  while ((m = re.exec(str))) {
    const name = m[1]
    const args = m[2].split(/[,\s]+/).filter(Boolean).map(Number)
    if (name === 'translate') {
      const [tx = 0, ty = 0] = args
      cmds.push((pt) => [pt[0] + tx, pt[1] + ty])
    } else if (name === 'scale') {
      const [sx = 1, sy = sx] = args
      cmds.push((pt) => [pt[0] * sx, pt[1] * sy])
    } else if (name === 'rotate') {
      const [ang = 0, cx = 0, cy = 0] = args
      const rad = (ang * Math.PI) / 180
      const s = Math.sin(rad), c = Math.cos(rad)
      cmds.push((pt) => {
        const x = pt[0] - cx
        const y = pt[1] - cy
        return [x * c - y * s + cx, x * s + y * c + cy]
      })
    }
  }
  return (pt) => cmds.reduce((p, f) => f(p), pt)
}

function applyTransform(poly, tf) {
  return poly.map(p => tf(p))
}

function parsePointsAttr(str) {
  if (!str) return []
  const nums = str.trim().split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
  const out = []
  for (let i = 0; i < nums.length - 1; i += 2) out.push([nums[i], nums[i+1]])
  return out
}

function samplePath(pathElem, step = 1) {
  const len = pathElem.getTotalLength()
  const n = Math.max(2, Math.ceil(len / Math.max(0.001, step)))
  const pts = []
  for (let i = 0; i <= n; i++) {
    const p = pathElem.getPointAtLength((i / n) * len)
    pts.push([p.x, p.y])
  }
  return pts
}

function splitPathD(d) {
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

function samplePathD(d, step = 1) {
  const NS = 'http://www.w3.org/2000/svg'
  const path = document.createElementNS(NS, 'path')
  path.setAttribute('d', d)
  return samplePath(path, step)
}

export function extractPolylinesFromSvgText(svgText, options = {}) {
  const { detail = 1 } = options
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg') || doc
  const out = []

  const handle = (elem) => {
    const tf = parseTransform(elem.getAttribute('transform'))
    if (elem.tagName === 'path') {
      try {
        const d = elem.getAttribute('d') || ''
        const subs = splitPathD(d)
        if (subs.length <= 1) {
          const pts = samplePathD(d, detail)
          if (pts.length) out.push(applyTransform(pts, tf))
        } else {
          for (const sd of subs) {
            const pts = samplePathD(sd, detail)
            if (pts.length) out.push(applyTransform(pts, tf))
          }
        }
      } catch (e) { /* ignore non-renderable paths */ }
    } else if (elem.tagName === 'polyline') {
      const pts = parsePointsAttr(elem.getAttribute('points'))
      if (pts.length) out.push(applyTransform(pts, tf))
    } else if (elem.tagName === 'polygon') {
      const pts = parsePointsAttr(elem.getAttribute('points'))
      if (pts.length) {
        if (pts[0][0] !== pts[pts.length-1][0] || pts[0][1] !== pts[pts.length-1][1]) pts.push(pts[0])
        out.push(applyTransform(pts, tf))
      }
    } else if (elem.tagName === 'line') {
      const x1 = Number(elem.getAttribute('x1')||0)
      const y1 = Number(elem.getAttribute('y1')||0)
      const x2 = Number(elem.getAttribute('x2')||0)
      const y2 = Number(elem.getAttribute('y2')||0)
      out.push(applyTransform([[x1,y1],[x2,y2]], tf))
    } else if (elem.tagName === 'rect') {
      const x = Number(elem.getAttribute('x')||0)
      const y = Number(elem.getAttribute('y')||0)
      const w = Number(elem.getAttribute('width')||0)
      const h = Number(elem.getAttribute('height')||0)
      const r = [[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]
      out.push(applyTransform(r, tf))
    }
    // recurse
    for (const child of Array.from(elem.children)) handle(child)
  }

  handle(svg)
  return out
}
