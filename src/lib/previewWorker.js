// Web Worker: off-main-thread renderer for previews
// Receives { id, layers, doc, mdiCache, bitmaps, quality, optimizeJoin }
// Sends { id, type:'progress', progress } and { id, type:'done', outputs, paths } or { id, type:'error', message }

import { computeRendered } from './renderer.js'
import { polylineToPath } from './geometry.js'
import { applyPathPlanning } from './pipeline/decorators.js'

self.onmessage = async (e) => {
  const { id, layers, doc, mdiCache, bitmaps, quality, optimizeJoin } = e.data || {}
  try {
    const q = Number.isFinite(quality) ? quality : 1
    const isPreview = (q < 0.999) || (doc && doc.fastPreview)
    // For preview responsiveness, disable ordering/joining in renderer consumers
    const docForPreview = isPreview ? { ...(doc || {}), optimize: 'none' } : (doc || {})
    const outputs = computeRendered(layers || [], docForPreview, mdiCache || {}, bitmaps || {}, q, (p) => {
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
      const doJoin = Boolean(optimizeJoin) && !isPreview
      const planned = applyPathPlanning(polylines || [], docForPreview, doJoin)
      return { layer, d: planned.map(polylineToPath).join(' ') }
    })
    self.postMessage({ id, type: 'done', outputs, paths })
  } catch (err) {
    self.postMessage({ id, type: 'error', message: String(err && err.message || err) })
  }
}
