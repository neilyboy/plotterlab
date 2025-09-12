// Shared renderer used in main thread and Web Worker
// Generates polylines for all visible layers using provided params

import { simplifyPolylines } from './simplify.js'
import { hatchFill } from './generators/hatchFill.js'
import { halftone } from './generators/halftone.js'
import { mdiPattern } from './generators/mdiPattern.js'
import { mdiIconField } from './generators/mdiIconField.js'
import { pixelMosaic } from './generators/pixelMosaic.js'
import { isoContours } from './generators/isoContours.js'
import { superformulaRings } from './generators/superformula.js'
import { waveMoire } from './generators/waveMoire.js'
import { streamlines } from './generators/streamlines.js'
import { reactionContours } from './generators/reactionContours.js'
import { quasicrystalContours } from './generators/quasicrystalContours.js'
import { stripeBands } from './generators/stripeBands.js'
import { polarStarburst } from './generators/polarStarburst.js'
import { flowField } from './generators/flowField.js'
import { flowRibbons } from './generators/flowRibbons.js'
import { retroPipes } from './generators/retroPipes.js'
import { starLattice } from './generators/starLattice.js'
import { spirograph } from './generators/spirograph.js'
import { isometricCity } from './generators/isometricCity.js'
import { voronoiShatter } from './generators/voronoiShatter.js'
import { svgImport } from './generators/svgImport.js'
import { lsystem } from './generators/lsystem.js'
import { phyllotaxis } from './generators/phyllotaxis.js'
import { truchet } from './generators/truchet.js'
import { hilbert } from './generators/hilbert.js'
import { pathWarp } from './generators/pathWarp.js'
import { imageContours } from './generators/imageContours.js'
import { poissonStipple } from './generators/poissonStipple.js'
import { tspArt } from './generators/tspArt.js'
import { harmonograph } from './generators/harmonograph.js'
import { deJong } from './generators/deJong.js'
import { maze } from './generators/maze.js'
import { reactionStrokes } from './generators/reactionStrokes.js'
import { clifford } from './generators/clifford.js'
import { sunflowerBands } from './generators/sunflowerBands.js'
import { combinator } from './generators/combinator.js'

const GENERATORS = {
  spirograph: { name: 'Spirograph', fn: spirograph, params: {} },
  polarStarburst: { name: 'Polar Starburst', fn: polarStarburst, params: {} },
  flowRibbons: { name: 'Flow Ribbons', fn: flowRibbons, params: {} },
  mdiIconField: { name: 'MDI Icon Field', fn: mdiIconField, params: {} },
  hatchFill: { name: 'Hatch Fill', fn: hatchFill, params: {} },
  mdiPattern: { name: 'MDI Pattern', fn: mdiPattern, params: {} },
  flowField: { name: 'Flow Field', fn: flowField, params: {} },
  voronoiShatter: { name: 'Voronoi Shatter', fn: voronoiShatter, params: {} },
  pixelMosaic: { name: 'Pixel Mosaic', fn: pixelMosaic, params: {} },
  halftone: { name: 'Halftone / Dither', fn: halftone, params: {} },
  isometricCity: { name: 'Isometric City', fn: isometricCity, params: {} },
  isoContours: { name: 'Iso Contours', fn: isoContours, params: {} },
  superformulaRings: { name: 'Superformula Rings', fn: superformulaRings, params: {} },
  waveMoire: { name: 'Wave Moiré', fn: waveMoire, params: {} },
  streamlines: { name: 'Streamlines', fn: streamlines, params: {} },
  reactionContours: { name: 'Reaction Contours', fn: reactionContours, params: {} },
  quasicrystalContours: { name: 'Quasicrystal Contours', fn: quasicrystalContours, params: {} },
  stripeBands: { name: 'Stripe Bands', fn: stripeBands, params: {} },
  starLattice: { name: 'Star Lattice', fn: starLattice, params: {} },
  retroPipes: { name: 'Retro Pipes', fn: retroPipes, params: {} },
  svgImport: { name: 'SVG Import', fn: svgImport, params: {} },
  lsystem: { name: 'L-system', fn: lsystem, params: {} },
  phyllotaxis: { name: 'Phyllotaxis', fn: phyllotaxis, params: {} },
  truchet: { name: 'Truchet Tiles', fn: truchet, params: {} },
  hilbert: { name: 'Hilbert Curve', fn: hilbert, params: {} },
  pathWarp: { name: 'Path Warp', fn: pathWarp, params: {} },
  imageContours: { name: 'Image Contours', fn: imageContours, params: {} },
  poissonStipple: { name: 'Poisson Stipple', fn: poissonStipple, params: {} },
  tspArt: { name: 'TSP Art', fn: tspArt, params: {} }
  , harmonograph: { name: 'Harmonograph', fn: harmonograph, params: {} }
  , deJong: { name: 'De Jong Attractor', fn: deJong, params: {} }
  , maze: { name: 'Maze', fn: maze, params: {} }
  , reactionStrokes: { name: 'Reaction Strokes', fn: reactionStrokes, params: {} }
  , clifford: { name: 'Clifford Attractor', fn: clifford, params: {} }
  , sunflowerBands: { name: 'Sunflower Bands', fn: sunflowerBands, params: {} }
  , combinator: { name: 'Combinator', fn: combinator, params: {} }
}

// Geometry helpers for global clipping
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
function clipSegmentToPolygon(a, b, poly) {
  const pts = []
  const insideA = pointInPolygon(a, poly)
  const insideB = pointInPolygon(b, poly)
  pts.push([a[0], a[1], 0, insideA])
  pts.push([b[0], b[1], 1, insideB])
  for (let i = 0; i < poly.length - 1; i++) {
    const p = poly[i], q = poly[i+1]
    const inter = segIntersect(a, b, p, q)
    if (inter) pts.push([inter[0], inter[1], inter[2], true])
  }
  pts.sort((u,v)=>u[2]-v[2])
  const segments = []
  for (let i = 0; i < pts.length - 1; i++) {
    const t0 = (pts[i][2] + pts[i+1][2]) * 0.5
    const mid = [a[0] + (b[0]-a[0]) * t0, a[1] + (b[1]-a[1]) * t0]
    if (pointInPolygon(mid, poly)) segments.push([[pts[i][0], pts[i][1]],[pts[i+1][0], pts[i+1][1]]])
  }
  return segments
}
const rectPolygon = (x0,y0,x1,y1) => [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]
function clipPolysToRect(polys, x0, y0, x1, y1) {
  const rect = rectPolygon(x0,y0,x1,y1)
  const out = []
  for (const pl of (polys||[])) {
    for (let i = 0; i < pl.length - 1; i++) {
      const segs = clipSegmentToPolygon(pl[i], pl[i+1], rect)
      for (const s of segs) out.push(s)
    }
  }
  return out
}

// Clip arbitrary polylines to an array of closed polygons (union rule)
function clipPolysToPolygons(polys, clipPolys) {
  if (!Array.isArray(clipPolys) || clipPolys.length === 0) return []
  const out = []
  for (const pl of (polys||[])) {
    for (let i = 0; i < (pl?.length||0) - 1; i++) {
      const a = pl[i], b = pl[i+1]
      for (const poly of clipPolys) {
        const segs = clipSegmentToPolygon(a, b, poly)
        for (const s of segs) out.push(s)
      }
    }
  }
  return out
}

// Clip a single segment to multiple polygons using a rule ('union' | 'evenodd').
function clipSegToPolysGeneric(a, b, polys, rule = 'union') {
  const ts = [0, 1]
  for (const poly of (polys||[])) {
    for (let i = 0; i < poly.length - 1; i++) {
      const inter = segIntersect(a, b, poly[i], poly[i+1])
      if (inter) ts.push(inter[2])
    }
  }
  ts.sort((x,y)=>x-y)
  const segs = []
  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i], t1 = ts[i+1]
    if (t1 - t0 < 1e-6) continue
    const tm = (t0 + t1) * 0.5
    const mid = [a[0] + (b[0]-a[0]) * tm, a[1] + (b[1]-a[1]) * tm]
    let count = 0
    for (const poly of (polys||[])) if (pointInPolygon(mid, poly)) count++
    const inside = (rule === 'evenodd') ? ((count & 1) === 1) : (count > 0)
    if (inside) {
      segs.push([[a[0] + (b[0]-a[0]) * t0, a[1] + (b[1]-a[1]) * t0], [a[0] + (b[0]-a[0]) * t1, a[1] + (b[1]-a[1]) * t1]])
    }
  }
  return segs
}

function clipPolysToPolygonsWithRule(polys, clipPolys, rule = 'union') {
  if (!Array.isArray(clipPolys) || clipPolys.length === 0) return []
  const out = []
  for (const pl of (polys||[])) {
    for (let i = 0; i < (pl?.length||0) - 1; i++) {
      const a = pl[i], b = pl[i+1]
      const segs = clipSegToPolysGeneric(a, b, clipPolys, rule)
      for (const s of segs) out.push(s)
    }
  }
  return out
}

function areaOfPoly(p) {
  let a = 0
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    a += (p[j][0] * p[i][1] - p[i][0] * p[j][1])
  }
  return a * 0.5
}
const dist2 = (a, b) => { const dx = a[0]-b[0], dy = a[1]-b[1]; return dx*dx+dy*dy }
const isClosed = (p, eps2 = 1e-4) => p.length>=3 && dist2(p[0], p[p.length-1]) <= eps2

function makeClipPolys(polys) {
  const eps2 = 0.64 // ~0.8mm threshold for stitching
  const closed = []
  const opens = []
  for (const p of (polys||[])) {
    if (!p || p.length < 2) continue
    if (isClosed(p, eps2)) {
      if (dist2(p[0], p[p.length-1]) > 1e-6) {
        const q = p.slice(); q.push(q[0]); if (q.length>=4) closed.push(q)
      } else {
        closed.push(p)
      }
    } else {
      // Do not attempt to stitch different opens together; only consider auto-closing later
      opens.push(p.slice())
    }
  }
  // Auto-close any remaining opens with 3+ points to form a ring. This helps
  // when the source layer outputs a single loop polyline that didn't register
  // as closed due to numeric drift (e.g. spirograph).
  for (const O of opens) {
    if (!O || O.length < 3) continue
    const q = O.slice()
    if (dist2(q[0], q[q.length-1]) > 1e-6) q.push(q[0])
    if (q.length >= 4) closed.push(q)
  }
  const out = closed.filter(pp => pp.length >= 4)
  // Stable sort by centroid (x then y) for consistent indexing across UI and renderer
  const centroid = (p) => {
    let a = 0, cx = 0, cy = 0
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const x0 = p[j][0], y0 = p[j][1]
      const x1 = p[i][0], y1 = p[i][1]
      const f = (x0 * y1 - x1 * y0)
      a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
    }
    a *= 0.5
    if (Math.abs(a) < 1e-6) return [p[0][0], p[0][1]]
    return [cx / (6 * a), cy / (6 * a)]
  }
  out.sort((A,B)=>{
    const ca = centroid(A), cb = centroid(B)
    if (Math.abs(ca[0]-cb[0]) > 1e-6) return ca[0] - cb[0]
    if (Math.abs(ca[1]-cb[1]) > 1e-6) return ca[1] - cb[1]
    // Tiebreak by area magnitude so nested shapes (same centroid) have deterministic order
    const aa = Math.abs(areaOfPoly(A))
    const ab = Math.abs(areaOfPoly(B))
    return aa - ab
  })
  return out
}

function pickClipPolys(closed, mode, idx) {
  const arr = closed || []
  const m = mode || 'all'
  if (arr.length === 0) return []
  if (m === 'largest') {
    const sorted = arr.slice().sort((a,b) => Math.abs(areaOfPoly(b)) - Math.abs(areaOfPoly(a)))
    return sorted[0] ? [sorted[0]] : []
  }
  if (m === 'index') {
    const i = Math.max(0, Math.floor(idx || 0))
    return arr[i] ? [arr[i]] : []
  }
  return arr
}

function scaleParamsForPreview(genKey, params, q) {
  if (!q || q >= 0.999) return params
  const keysToScaleInt = {
    spirograph: ['turns'],
    flowField: ['steps','cols','rows'],
    retroPipes: ['steps','runs'],
    mdiIconField: ['samples'],
    mdiPattern: ['samples'],
    voronoiShatter: ['cells'],
    pixelMosaic: ['cols','rows'],
    isometricCity: ['cols','rows'],
    isoContours: ['levels','cols','rows'],
    superformulaRings: ['rings','steps'],
    waveMoire: ['lines'],
    streamlines: ['seedsX','seedsY','maxSteps'],
    reactionContours: ['cols','rows','steps'],
    quasicrystalContours: ['cols','rows'],
    stripeBands: ['cols','rows','levels'],
    lsystem: ['iterations'],
    phyllotaxis: ['count'],
    truchet: ['cols','rows'],
    pathWarp: ['copies'],
    imageContours: ['cols','rows','levels'],
    poissonStipple: ['attempts'],
    tspArt: ['points']
    , harmonograph: ['steps']
    , deJong: ['iter']
    , maze: ['cols','rows']
    , reactionStrokes: ['cols','rows','steps','seedsX','seedsY','maxSteps']
    , clifford: ['iter']
    , sunflowerBands: ['count']
  }
  const k = keysToScaleInt[genKey] || []
  const out = { ...params }
  for (const name of k) {
    if (typeof out[name] === 'number' && Number.isFinite(out[name])) {
      const v = Math.max(1, Math.floor(out[name] * q))
      out[name] = v
    }
  }
  if (genKey === 'hatchFill' && typeof out.spacing === 'number') {
    out.spacing = Math.max(0.1, out.spacing / Math.max(0.5, q))
  }
  if (genKey === 'halftone') {
    const clampQ = Math.max(0.35, Math.min(1, q))
    if (typeof out.spacing === 'number' && Number.isFinite(out.spacing)) {
      // Larger spacing at low quality => fewer lines/dots
      out.spacing = Math.max(0.4, out.spacing / clampQ)
    }
    if (typeof out.segment === 'number' && Number.isFinite(out.segment)) {
      // Larger step at low quality => fewer samples per line/arc
      out.segment = Math.max(0.2, out.segment / clampQ)
    }
    // Hint to halftone generator to downscale bitmap for preview performance
    out.previewScale = clampQ
    // For preview, prefer faster Bayer dithering and skip normalization work
    if (q < 0.95) {
      if (out.method === 'floyd') out.method = 'bayer'
      out.normalize = false
    }
  }
  return out
}

export function computeRendered(layersArg, docArg, mdiCacheArg, bitmapsArg, quality = 1, progressCb) {
  // Some generators already constrain to page/margin rect; skip global clip for them to avoid
  // exploding segment counts (e.g., halftone scanlines sampled at small steps).
  const skipGlobalClip = (genKey) => genKey === 'halftone'
  const outputs = []
  const getLayerPolysById = (lid) => {
    if (!lid) return []
    const found = outputs.find(o => o.layer.id === lid)
    if (found) return found.polylines
    const tgt = layersArg.find(l => l.id === lid)
    if (!tgt || !tgt.visible) return []
    const gen2 = GENERATORS[tgt.generator]
    if (!gen2) return []
    let hadInnerProgress = false
    try {
      let extra2 = {}
      if (tgt.generator === 'mdiPattern') {
        extra2 = { ...extra2, iconD: mdiCacheArg[tgt.params?.iconName] }
      }
      if (tgt.generator === 'mdiIconField') {
        const csv = tgt.params?.namesCsv || ''
        const parts = String(csv).split(/[;,\s]+/).filter(Boolean)
        const iconDs = parts.map(n => mdiCacheArg[n]).filter(Boolean)
        if (iconDs.length) extra2 = { ...extra2, iconDs }
      }
      if (tgt.generator === 'pixelMosaic' || tgt.generator === 'halftone') {
        extra2 = { ...extra2, bitmap: bitmapsArg[tgt.id] }
      }
      const base2 = { ...gen2.params, ...tgt.params, ...extra2 }
      delete base2.clipToPrevious; delete base2.clipLayerId; delete base2.clipMode; delete base2.clipIndex
      const p2 = quality < 0.999 ? scaleParamsForPreview(tgt.generator, base2, quality) : base2
      const effMargin2 = (p2 && Number.isFinite(p2.margin)) ? p2.margin : docArg.margin
      let poly2 = gen2.fn({ ...p2, width: docArg.width, height: docArg.height, margin: effMargin2, seed: docArg.seed })
      // Apply same global clipping as main pipeline (unless gen already respects bounds)
      if (docArg.clipOutput && docArg.clipOutput !== 'none' && !skipGlobalClip(tgt.generator)) {
        const useMargin = docArg.clipOutput === 'margin'
        const mx = useMargin ? (Number.isFinite(docArg.marginX) ? docArg.marginX : (docArg.margin || 0)) : 0
        const my = useMargin ? (Number.isFinite(docArg.marginY) ? docArg.marginY : (docArg.margin || 0)) : 0
        const x0 = useMargin ? mx : 0
        const y0 = useMargin ? my : 0
        const x1 = useMargin ? (docArg.width - mx) : docArg.width
        const y1 = useMargin ? (docArg.height - my) : docArg.height
        poly2 = clipPolysToRect(poly2, x0, y0, x1, y1)
      }
      const tol2 = Number(tgt.params?.simplifyTol) || 0
      if (tol2 > 0) poly2 = simplifyPolylines(poly2, tol2)
      return poly2
    } catch {
      return []
    }
  }

  const total = layersArg.length
  let idx = 0
  for (const layer of layersArg) {
    if (!layer.visible) { outputs.push({ layer, polylines: [] }); idx++; progressCb && progressCb({ pct: Math.min(1, total? idx/total : 1), idx, total, layerName: layer?.name || '', layerId: layer?.id }); continue }
    const gen = GENERATORS[layer.generator]
    if (!gen) { outputs.push({ layer, polylines: [] }); idx++; progressCb && progressCb({ pct: Math.min(1, total? idx/total : 1), idx, total, layerName: layer?.name || '', layerId: layer?.id }); continue }
    try {
      let extra = {}
      if (layer.generator === 'mdiPattern') {
        extra = { ...extra, iconD: mdiCacheArg[layer.params?.iconName] }
      }
      if (layer.generator === 'mdiIconField') {
        const csv = layer.params?.namesCsv || ''
        const parts = String(csv).split(/[;,\s]+/).filter(Boolean)
        const iconDs = parts.map(n => mdiCacheArg[n]).filter(Boolean)
        if (iconDs.length) extra = { ...extra, iconDs }
      }
      if (layer.generator === 'pixelMosaic') {
        extra = { ...extra, bitmap: bitmapsArg[layer.id] }
      }
      if (layer.generator === 'halftone') {
        if (layer.params && (layer.params.clipLayerId || layer.params.clipToPrevious) && (layer.params.clipEnabled !== false)) {
          let closed = []
          if (layer.params.clipLayerId) {
            closed = makeClipPolys(getLayerPolysById(layer.params.clipLayerId))
          } else if (layer.params.clipToPrevious) {
            const prev = [...outputs].reverse().find(o => o.layer.visible && o.polylines && o.polylines.length)
            if (prev) closed = makeClipPolys(prev.polylines)
          }
          if (closed.length) {
            const which = layer.params?.clipMode || 'all'
            const idx2 = layer.params?.clipIndex || 0
            let clips = []
            if (which === 'index' && Array.isArray(layer.params?.clipIndices) && layer.params.clipIndices.length) {
              for (const i of layer.params.clipIndices) { const ii = Math.max(0, Math.floor(i||0)); if (closed[ii]) clips.push(closed[ii]) }
            } else {
              clips = pickClipPolys(closed, which, idx2)
            }
            extra = { ...extra, clipPolys: clips }
          }
        }
      }
      if (layer.generator === 'imageContours' || layer.generator === 'poissonStipple' || layer.generator === 'tspArt') {
        extra = { ...extra, bitmap: bitmapsArg[layer.id] }
      }
      if (layer.generator === 'pathWarp') {
        let src = []
        if (layer.params?.srcToPrevious) {
          const prev = [...outputs].reverse().find(o => o.layer.visible && o.polylines && o.polylines.length)
          if (prev) src = prev.polylines
        } else if (layer.params?.srcLayerId) {
          src = getLayerPolysById(layer.params.srcLayerId)
        }
        extra = { ...extra, srcPolys: src }
      }
      if (layer.generator === 'combinator') {
        const ringsA = layer.params?.srcA ? makeClipPolys(getLayerPolysById(layer.params.srcA)) : []
        const ringsB = layer.params?.srcB ? makeClipPolys(getLayerPolysById(layer.params.srcB)) : []
        extra = { ...extra, ringsA, ringsB }
      }
      if ((layer.generator === 'hatchFill' || layer.generator === 'mdiPattern' || layer.generator === 'svgImport') && layer.params && (layer.params.clipLayerId || layer.params.clipToPrevious) && (layer.params.clipEnabled !== false)) {
        let closed = []
        if (layer.params.clipLayerId) {
          closed = makeClipPolys(getLayerPolysById(layer.params.clipLayerId))
        } else if (layer.params.clipToPrevious) {
          const prev = [...outputs].reverse().find(o => o.layer.visible && o.polylines && o.polylines.length)
          if (prev) closed = makeClipPolys(prev.polylines)
        }
        if (closed.length) {
          const which = layer.params?.clipMode || 'all'
          const idx2 = layer.params?.clipIndex || 0
          let clips = []
          if (which === 'index' && Array.isArray(layer.params?.clipIndices) && layer.params.clipIndices.length) {
            for (const i of layer.params.clipIndices) { const ii = Math.max(0, Math.floor(i||0)); if (closed[ii]) clips.push(closed[ii]) }
          } else {
            clips = pickClipPolys(closed, which, idx2)
          }
          const rule = layer.params?.clipRule || 'union'
          extra = { ...extra, clipPolys: clips, clipRule: rule }
        }
      }
      // For mdiPattern/svgImport we also honor clipRule (already assigned above)
      const baseParams = { ...gen.params, ...layer.params, ...extra }
      const p = quality < 0.999 ? scaleParamsForPreview(layer.generator, baseParams, quality) : baseParams
      const effMargin = (p && Number.isFinite(p.margin)) ? p.margin : docArg.margin
      const onProgress = (f)=>{
        const frac = Math.max(0, Math.min(1, Number(f)||0))
        progressCb && progressCb({ pct: Math.min(1, (idx + frac) / Math.max(1,total)), idx: idx + frac, total, layerName: layer?.name || '', layerId: layer?.id })
      }
      let poly = gen.fn({ ...p, width: docArg.width, height: docArg.height, margin: effMargin, seed: docArg.seed, onProgress })
      // Generic polygon clip for generators that don't natively clip
      if (layer.params && (layer.params.clipLayerId || layer.params.clipToPrevious) && (layer.params.clipEnabled !== false) && !(layer.generator === 'hatchFill' || layer.generator === 'mdiPattern' || layer.generator === 'svgImport' || layer.generator === 'halftone')) {
        let closed = []
        if (layer.params.clipLayerId) {
          closed = makeClipPolys(getLayerPolysById(layer.params.clipLayerId))
        } else if (layer.params.clipToPrevious) {
          const prev = [...outputs].reverse().find(o => o.layer.visible && o.polylines && o.polylines.length)
          if (prev) closed = makeClipPolys(prev.polylines)
        }
        if (closed.length) {
          const which = layer.params?.clipMode || 'all'
          const idx2 = layer.params?.clipIndex || 0
          let clips = []
          if (which === 'index' && Array.isArray(layer.params?.clipIndices) && layer.params.clipIndices.length) {
            for (const i of layer.params.clipIndices) { const ii = Math.max(0, Math.floor(i||0)); if (closed[ii]) clips.push(closed[ii]) }
          } else {
            clips = pickClipPolys(closed, which, idx2)
          }
          if (clips && clips.length) {
            const rule = layer.params?.clipRule || 'union'
            poly = clipPolysToPolygonsWithRule(poly, clips, rule)
          } else {
            poly = []
          }
        }
      }
      // Global output clipping to paper or margin (unless gen already respects bounds)
      if (docArg.clipOutput && docArg.clipOutput !== 'none' && !skipGlobalClip(layer.generator)) {
        const useMargin = docArg.clipOutput === 'margin'
        const mx = useMargin ? (Number.isFinite(docArg.marginX) ? docArg.marginX : (docArg.margin || 0)) : 0
        const my = useMargin ? (Number.isFinite(docArg.marginY) ? docArg.marginY : (docArg.margin || 0)) : 0
        const x0 = useMargin ? mx : 0
        const y0 = useMargin ? my : 0
        const x1 = useMargin ? (docArg.width - mx) : docArg.width
        const y1 = useMargin ? (docArg.height - my) : docArg.height
        poly = clipPolysToRect(poly, x0, y0, x1, y1)
      }
      const tol = Number(layer.params?.simplifyTol) || 0
      if (tol > 0) poly = simplifyPolylines(poly, tol)
      outputs.push({ layer, polylines: poly })
    } catch (e) {
      console.error('Generator error', e)
      outputs.push({ layer, polylines: [] })
    }
    idx++;
    progressCb && progressCb({ pct: Math.min(1, total? idx/total : 1), idx, total, layerName: layer?.name || '', layerId: layer?.id })
  }
  return outputs
}
