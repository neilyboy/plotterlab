// Web Worker: off-main-thread renderer for previews
// Receives { id, layers, doc, mdiCache, bitmaps, quality, optimizeJoin }
// Sends { id, type:'progress', progress } and { id, type:'done', outputs, paths } or { id, type:'error', message }

import { computeRendered } from './renderer.js'
import { polylineToPath } from './geometry.js'
import { orderPolylines, joinPolylines } from './pathopt.js'

self.onmessage = async (e) => {
  const { id, layers, doc, mdiCache, bitmaps, quality, optimizeJoin } = e.data || {}
  try {
    const outputs = computeRendered(layers || [], doc || {}, mdiCache || {}, bitmaps || {}, quality || 1, (p) => {
      let pct = 0
      let detail = null
      if (typeof p === 'number') {
        pct = p
      } else if (p && typeof p === 'object') {
        pct = Number(p.pct)
        detail = p
      }
      if (!Number.isFinite(pct)) pct = 0
      pct = Math.max(0, Math.min(1, pct))
      self.postMessage({ id, type: 'progress', progress: pct, detail })
    })
    const paths = outputs.map(({ layer, polylines }) => {
      let polys = polylines || []
      // The preview can optionally apply path ordering and joining to reflect the final export.
      // This is heavier, so it's gated by the same settings as G-code export.
      if (doc.optimize && doc.optimize !== 'none') {
        polys = orderPolylines(polys, doc.optimize, doc.startX, doc.startY)
      }
      if (optimizeJoin) {
        polys = joinPolylines(polys)
      }
      return { layer, d: polys.map(polylineToPath).join(' ') }
    })
    self.postMessage({ id, type: 'done', outputs, paths })
  } catch (err) {
    self.postMessage({ id, type: 'error', message: String(err && err.message || err) })
  }
}
