import React, { useEffect, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
  // Examples are now handled by <ExamplesPanel/>
import JSZip from 'jszip'
import { mdiContentSave, mdiPlus, mdiDelete, mdiEye, mdiEyeOff, mdiDownload, mdiShuffleVariant, mdiArrowUp, mdiArrowDown, mdiCrosshairsGps, mdiDotsVertical, mdiArrowCollapseVertical, mdiArrowExpandVertical, mdiFileDocumentOutline, mdiExportVariant, mdiLightbulbOutline, mdiLayersOutline, mdiLayersPlus, mdiStarPlus, mdiStar, mdiStarOutline, mdiSwapHorizontal, mdiFolderOpen, mdiRefresh, mdiClose, mdiImageMultipleOutline, mdiPalette, mdiFitToPageOutline, mdiSelectAll, mdiVectorSelection, mdiEraser, mdiStarOff, mdiCheck, mdiVectorSquare, mdiZipBox, mdiMinus, mdiFileCode, mdiUndo, mdiRedo } from '@mdi/js'
import { Icon } from './components/Icon.jsx'
import Select from './components/Select.jsx'
import ExamplesPanel from './components/panels/ExamplesPanel.jsx'
import LayersPanel from './components/panels/LayersPanel.jsx'
import ToolsPanel from './components/panels/ToolsPanel.jsx'
import ImportPanel from './components/panels/ImportPanel.jsx'
import ExportPanel from './components/panels/ExportPanel.jsx'
import { polylineToPath } from './lib/geometry.js'
import { buildSVG } from './lib/svg.js'
import { toGcode } from './lib/gcode.js'
import { getExporter } from './lib/exporters/index.js'
import { spirograph } from './lib/generators/spirograph.js'
import { starLattice } from './lib/generators/starLattice.js'
import { isometricCity } from './lib/generators/isometricCity.js'
import { mdiPattern, mdiIconOptions } from './lib/generators/mdiPattern.js'
import { flowField } from './lib/generators/flowField.js'
import { retroPipes } from './lib/generators/retroPipes.js'
import { hatchFill } from './lib/generators/hatchFill.js'
import { svgImport } from './lib/generators/svgImport.js'
import { extractPolylinesFromSvgText } from './lib/svgParse.js'
import { voronoiShatter } from './lib/generators/voronoiShatter.js'
import { pixelMosaic } from './lib/generators/pixelMosaic.js'
import { halftone } from './lib/generators/halftone.js'
import { fileToGrayscale, fileToRGB } from './lib/imageLoad.js'
import { mdiIconField } from './lib/generators/mdiIconField.js'
import { orderPolylines, joinPolylines } from './lib/pathopt.js'
import { simplifyPolylines } from './lib/simplify.js'
import { useDebouncedValue } from './lib/useDebounced.js'
import { isoContours } from './lib/generators/isoContours.js'
import { superformulaRings } from './lib/generators/superformula.js'
import { waveMoire } from './lib/generators/waveMoire.js'
import { streamlines } from './lib/generators/streamlines.js'
import { reactionContours } from './lib/generators/reactionContours.js'
import { quasicrystalContours } from './lib/generators/quasicrystalContours.js'
import { stripeBands } from './lib/generators/stripeBands.js'
import { polarStarburst } from './lib/generators/polarStarburst.js'
import { flowRibbons } from './lib/generators/flowRibbons.js'
import { lsystem } from './lib/generators/lsystem.js'
import { phyllotaxis } from './lib/generators/phyllotaxis.js'
import { truchet } from './lib/generators/truchet.js'
import { hilbert } from './lib/generators/hilbert.js'
import { maze } from './lib/generators/maze.js'
import { pathWarp } from './lib/generators/pathWarp.js'
import { imageContours } from './lib/generators/imageContours.js'
import { poissonStipple } from './lib/generators/poissonStipple.js'
import { tspArt } from './lib/generators/tspArt.js'
import { harmonograph } from './lib/generators/harmonograph.js'
import { deJong } from './lib/generators/deJong.js'
import { reactionStrokes } from './lib/generators/reactionStrokes.js'
import { clifford } from './lib/generators/clifford.js'
import { sunflowerBands } from './lib/generators/sunflowerBands.js'
import { combinator } from './lib/generators/combinator.js'
import './styles.css'
import { computeRendered as renderAll } from './lib/renderer.js'
import { applyPathPlanning } from './lib/pipeline/decorators.js'
import { getGenerators } from './lib/generators/registry.js'
import { useHistory } from './lib/useHistory.js'

// Cross-browser unique ID helper (crypto.randomUUID fallback)
const uid = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(16)
      crypto.getRandomValues(buf)
      // RFC 4122 v4
      buf[6] = (buf[6] & 0x0f) | 0x40
      buf[8] = (buf[8] & 0x3f) | 0x80
      const hex = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
    }
  } catch {}
  return Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36)
}

const PALETTE = [
  { name: 'Cyan', value: '#00AEEF' },
  { name: 'Magenta', value: '#EC008C' },
  { name: 'Yellow', value: '#FFF200' },
  { name: 'Black', value: '#111111' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Pink', value: '#f472b6' }
]

// Common paper sizes in millimeters (portrait orientation: w <= h)
const PAPER_SIZES = [
  { label: 'Custom', key: 'custom', w: null, h: null },
  { label: 'A0 (841 × 1189)', key: 'A0', w: 841, h: 1189 },
  { label: 'A1 (594 × 841)', key: 'A1', w: 594, h: 841 },
  { label: 'A2 (420 × 594)', key: 'A2', w: 420, h: 594 },
  { label: 'A3 (297 × 420)', key: 'A3', w: 297, h: 420 },
  { label: 'A4 (210 × 297)', key: 'A4', w: 210, h: 297 },
  { label: 'A5 (148 × 210)', key: 'A5', w: 148, h: 210 },
  { label: 'B0 (1000 × 1414)', key: 'B0', w: 1000, h: 1414 },
  { label: 'B1 (707 × 1000)', key: 'B1', w: 707, h: 1000 },
  { label: 'B2 (500 × 707)', key: 'B2', w: 500, h: 707 },
  { label: 'B3 (353 × 500)', key: 'B3', w: 353, h: 500 },
  { label: 'B4 (250 × 353)', key: 'B4', w: 250, h: 353 },
  { label: 'B5 (176 × 250)', key: 'B5', w: 176, h: 250 },
  { label: 'US Letter (215.9 × 279.4)', key: 'LETTER', w: 215.9, h: 279.4 },
  { label: 'US Legal (215.9 × 355.6)', key: 'LEGAL', w: 215.9, h: 355.6 },
  { label: 'Tabloid (279.4 × 431.8)', key: 'TABLOID', w: 279.4, h: 431.8 },
  { label: 'Arch A (228.6 × 304.8)', key: 'ARCHA', w: 228.6, h: 304.8 },
  { label: 'Arch B (304.8 × 457.2)', key: 'ARCHB', w: 304.8, h: 457.2 },
  { label: 'Arch C (457.2 × 609.6)', key: 'ARCHC', w: 457.2, h: 609.6 },
  { label: 'Arch D (609.6 × 914.4)', key: 'ARCHD', w: 609.6, h: 914.4 },
  { label: 'Arch E (914.4 × 1219.2)', key: 'ARCHE', w: 914.4, h: 1219.2 },
]
const COLOR_OPTIONS = PALETTE.map(p => ({ label: p.name, value: p.value }))

// GENERATORS are sourced from the central registry; we keep them in a memo so
// a reload action (or plugin load) can refresh the list without page reload.
// Note: we compute inside the component (not at module scope) to allow updates.
 
  // Quasicrystal presets helper
  const qcPresetValues = (name) => {
    switch (name) {
      case 'star-7':
        return { waves: 7, freq: 0.08, contrast: 1.2, iso: 0.0, rotateDeg: 0, warp: 0.15 }
      case 'bloom-9':
        return { waves: 9, freq: 0.09, contrast: 1.35, iso: 0.0, rotateDeg: 10, warp: 0.2 }
      case 'flower-5':
        return { waves: 5, freq: 0.065, contrast: 1.15, iso: 0.0, rotateDeg: 0, warp: 0.1 }
      default:
        return {}
    }
  }
  // Superformula presets helper
  const superPresetValues = (name) => {
    switch (name) {
      case 'star':
        return { m: 10, n1: 0.25, n2: 0.25, n3: 0.25, morph: 0.2, rings: 64, steps: 1000, inner: 0.1 }
      case 'gear':
        return { m: 12, n1: 0.16, n2: 0.3, n3: 0.3, morph: 0.3, rings: 60, steps: 1100, inner: 0.1 }
      case 'petal':
        return { m: 8, n1: 0.5, n2: 0.25, n3: 0.25, morph: 0.15, rings: 70, steps: 1000, inner: 0.08 }
      case 'bloom':
        return { m: 6, n1: 0.35, n2: 0.22, n3: 0.22, morph: 0.35, rings: 72, steps: 1100, inner: 0.12 }
      case 'spiky':
        return { m: 14, n1: 0.18, n2: 0.22, n3: 0.22, morph: 0.6, rings: 64, steps: 1200, inner: 0.08 }
      default:
        return {}
    }
  }



  // Distance from point to segment and to polygon edges
  const distPtSeg = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay
    const wx = px - ax, wy = py - ay
    const c1 = vx*wx + vy*wy
    if (c1 <= 0) return Math.hypot(px - ax, py - ay)
    const c2 = vx*vx + vy*vy
    if (c2 <= 0) return Math.hypot(px - ax, py - ay)
    const t = Math.max(0, Math.min(1, c1 / c2))
    const qx = ax + t * vx, qy = ay + t * vy
    return Math.hypot(px - qx, py - qy)
  }
  const polyMinEdgeDist = (pt, poly) => {
    let best = Infinity
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i], b = poly[i+1]
      const d = distPtSeg(pt[0], pt[1], a[0], a[1], b[0], b[1])
      if (d < best) best = d
    }
    return best
  }

const defaultDoc = {
  width: 420, // ~A4 landscape 420x297
  height: 297,
  margin: 16,
  paperSize: 'custom',
  orientation: 'landscape',
  bleed: 0,
  previewHeight: 60, // viewport height percentage for preview
  seed: Math.random().toString(36).slice(2, 10),
  strokeWidth: 1.2,
  bg: '#0b0f14', // paper color (backwards compat)
  appBg: '#0b0f14', // app/viewport background around paper
  showPaperBorder: true,
  paperBorderColor: '#475569',
  showMarginBorder: false,
  marginBorderColor: '#64748b',
  showTravel: false,
  travelColor: '#38bdf8',
  showOrderNumbers: false,
  orderNumberColor: '#e5e7eb',
  showToolpathControls: false,
  // G-code defaults
  feed: 1800,
  travel: 3000,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  optimize: 'nearest', // 'none' | 'nearest'
  optimizeJoin: true, // join contiguous paths
  penUp: 5,
  penDown: 0,
  safeZ: 5,
  penMode: 'servo',
  servoUp: 'M3 S180',
  servoDown: 'M3 S0',
  delayAfterUp: 0.2,
  delayAfterDown: 0.2,
  exportMode: 'layers' // 'combined' | 'layers' | 'colors'
  , previewZoom: 1,
  previewPanX: 0,
  previewPanY: 0,
  previewAutoFit: true,
  previewUpscale: false,
  fastPreview: true,
  previewQuality: 0.6,
  showGrid: false,
  gridSizePx: 12,
  showStart: true,
  startMarkerColor: '#22c55e',
  startUseMargin: true,
  startPreset: 'top-left',
  clipOutput: 'none' // 'none' | 'paper' | 'margin'
}

const newLayer = (i = 0) => ({
  id: uid(),
  name: `Layer ${i+1}`,
  color: PALETTE[i % PALETTE.length].value,
  visible: true,
  generator: 'spirograph',
  // Use current registry defaults at call-time to avoid stale references
  params: { ...getGenerators()['spirograph'].params },
  uiCollapsed: false
})

export default function App() {
  // Generators registry state (supports plugin reloads)
  const [generatorNonce, setGeneratorNonce] = useState(0)
  const [loadingPlugins, setLoadingPlugins] = useState(false)
  const GENERATORS = useMemo(() => getGenerators(), [generatorNonce])
  // Load plugin scripts from /plugins/index.json and then refresh the generator registry
  const reloadGenerators = async () => {
    try {
      setLoadingPlugins(true)
      const res = await fetch(`/plugins/index.json?ts=${Date.now()}`)
      if (!res.ok) throw new Error(`Failed to load plugin index (${res.status})`)
      const list = await res.json()
      const urls = Array.isArray(list) ? list : []
      // Helper to load a script sequentially to preserve order
      const loadScript = (src) => new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src.includes('?') ? `${src}&ts=${Date.now()}` : `${src}?ts=${Date.now()}`
        s.async = false
        s.onload = () => resolve()
        s.onerror = (e) => reject(e)
        document.head.appendChild(s)
      })
      for (const u of urls) {
        const url = String(u || '')
        const abs = url.startsWith('/') ? url : `/${url}`
        await loadScript(abs)
      }
      // Bump nonce so UI re-reads the registry
      setGeneratorNonce(n => n + 1)
      showToast('Generators reloaded')
    } catch (err) {
      console.error('Plugin reload failed', err)
      showToast('Reload failed — check console')
    } finally {
      setLoadingPlugins(false)
    }
  }
  // Initial plugin load on mount (best-effort)
  useEffect(() => { reloadGenerators().catch(()=>{}) }, [])

  const [doc, setDoc] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plotterlab:doc'))
      return saved ? { ...defaultDoc, ...saved } : defaultDoc
    } catch {
      return defaultDoc
    }
  })
  const [customPaperSizes, setCustomPaperSizes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:paperCustoms')) || [] } catch { return [] }
  })
  const [paperFavorites, setPaperFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:paperFavs')) || [] } catch { return [] }
  })
  // Ephemeral text buffers for numeric inputs so the user can clear fields fully while typing
  const [numEdit, setNumEdit] = useState({})
  // Lightweight toast for user feedback (e.g., after plugin reload)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const showToast = (msg, ms = 2200) => {
    if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null }
    setToast(String(msg || ''))
    toastTimerRef.current = setTimeout(() => { setToast(null); toastTimerRef.current = null }, Math.max(800, ms))
  }
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); toastTimerRef.current = null }
    }
  }, [])
  // Keyboard/interaction helpers
  const [spaceDown, setSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(0)
  const [saveMessage, setSaveMessage] = useState('')
  const [showHelp, setShowHelp] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:showHelp')) || false } catch { return false }
  })
  // Help overlay refs for click-outside dismiss
  const helpRef = useRef(null)
  const helpBtnRef = useRef(null)
  // Enforce Super Compact UI across the app
  const compactUI = true
  const superCompact = true
  // Simple Tools/Layers tabs in the sidebar
  const [uiTab, setUiTab] = useState(() => {
    try { return localStorage.getItem('plotterlab:uiTab') || 'tools' } catch { return 'tools' }
  })
  // View preset selection for dropdown (ephemeral)
  const [viewPresetSel, setViewPresetSel] = useState('')
  const [layerMenuId, setLayerMenuId] = useState(null)
  const [groupOpen, setGroupOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:groupOpen')) || {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem('plotterlab:paperFavs', JSON.stringify(paperFavorites)) } catch(e){} }, [paperFavorites])
  useEffect(() => { try { localStorage.setItem('plotterlab:showHelp', JSON.stringify(showHelp)) } catch(e){} }, [showHelp])
  useEffect(() => { try { localStorage.setItem('plotterlab:uiTab', uiTab) } catch(e){} }, [uiTab])
  useEffect(() => { try { localStorage.setItem('plotterlab:groupOpen', JSON.stringify(groupOpen)) } catch(e){} }, [groupOpen])
  // Close any open layer menu on outside click; also dismiss help overlay on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      setLayerMenuId(null)
      if (showHelp) {
        const t = e.target
        const insideHelp = helpRef.current && helpRef.current.contains(t)
        const onHelpBtn = helpBtnRef.current && helpBtnRef.current.contains(t)
        if (!insideHelp && !onHelpBtn) setShowHelp(false)
      }
    }
    window.addEventListener('click', onDocClick)
    return () => window.removeEventListener('click', onDocClick)
  }, [showHelp])

  // Compact label helpers for sidebar forms (super compact enforced)
  const labelClass = superCompact
    ? 'flex flex-col gap-0 capitalize text-[11px]'
    : (compactUI ? 'flex flex-col gap-0.5 capitalize text-xs' : 'flex flex-col gap-1 capitalize')
  const labelRowClass = superCompact
    ? 'flex items-center gap-1 capitalize text-[11px]'
    : (compactUI ? 'flex items-center gap-1 capitalize text-xs' : 'flex items-center gap-2 capitalize')

  // Group open/close helpers with sensible default (open by default)
  const isGroupOpen = (layerId, key) => {
    const l = (groupOpen && groupOpen[layerId]) || {}
    return typeof l[key] === 'boolean' ? l[key] : true
  }
  const toggleGroup = (layerId, key) => {
    setGroupOpen(prev => {
      const p = prev || {}
      const l = { ...(p[layerId] || {}) }
      const cur = (typeof l[key] === 'boolean') ? l[key] : true
      l[key] = !cur
      return { ...p, [layerId]: l }
    })
  }

  // Numeric input renderer with ephemeral text buffer so users can clear fully while typing
  const renderNumParam = (layer, key, label) => {
    const bufKey = `${layer.id}:${key}`
    const bufVal = Object.prototype.hasOwnProperty.call(numEdit, bufKey) ? numEdit[bufKey] : ''
    const curVal = bufVal !== '' ? bufVal : (Number.isFinite(layer?.params?.[key]) ? layer.params[key] : '')
    const commit = (val) => {
      const n = Number(val)
      setLayers(ls => ls.map(l => l.id === layer.id ? { ...l, params: { ...l.params, [key]: Number.isFinite(n) ? n : 0 } } : l))
      setNumEdit(s => { const next = { ...s }; delete next[bufKey]; return next })
    }
    return (
      <label className={labelClass} key={`${layer.id}_${key}`}>
        {label}
        <input
          className="input"
          type="number"
          step="any"
          value={curVal}
          onChange={e => setNumEdit(s => ({ ...s, [bufKey]: e.target.value }))}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(e.currentTarget.value) }}
        />
      </label>
    )
  }

  const basePaperOptions = useMemo(() => [...PAPER_SIZES, ...customPaperSizes], [customPaperSizes])
  const paperOptions = useMemo(() => {
    const isFav = (k) => paperFavorites.includes(k)
    const arr = basePaperOptions.slice()
    arr.sort((a, b) => {
      const fa = isFav(a.key) ? 1 : 0
      const fb = isFav(b.key) ? 1 : 0
      if (fa !== fb) return fb - fa
      return a.label.localeCompare(b.label)
    })
    return arr
  }, [basePaperOptions, paperFavorites])
  const toggleFavoritePaper = (k) => setPaperFavorites(list => list.includes(k) ? list.filter(x=>x!==k) : [...list, k])
  const saveCurrentPaperAs = () => {
    const name = typeof window !== 'undefined' ? window.prompt('Name this paper size (e.g. My Letter Bleed)') : null
    if (!name) return
    const key = 'CUST_' + name.replace(/\s+/g,'_').replace(/[^A-Za-z0-9_\-]/g,'').slice(0,40)
    const baseW = Math.min(doc.width, doc.height)
    const baseH = Math.max(doc.width, doc.height)
    const entry = { label: `${name} (${baseW} × ${baseH})`, key, w: baseW, h: baseH }
    setCustomPaperSizes(list => {
      const next = [...list.filter(i => i.key !== key), entry]
      try { localStorage.setItem('plotterlab:paperCustoms', JSON.stringify(next)) } catch {}
      return next
    })
    setDoc(d => ({ ...d, paperSize: key }))
  }
  const deleteCurrentCustomPaper = () => {
    const k = doc.paperSize
    if (!k || !String(k).startsWith('CUST_')) return
    setCustomPaperSizes(list => {
      const next = list.filter(i => i.key !== k)
      try { localStorage.setItem('plotterlab:paperCustoms', JSON.stringify(next)) } catch {}
      return next
    })
    setDoc(d => ({ ...d, paperSize: 'custom' }))
  }

  const loadExample = async (file) => {
    if (!file) return
    try {
      showToast('Loading example...')
      const res = await fetch(`/presets/${file}`)
      const data = await res.json()
      if (data.doc) setDoc(d => ({ ...d, ...data.doc }))
      if (Array.isArray(data.layers)) setLayers(data.layers)
      showToast('Example loaded')
    } catch (e) {
      console.error('Load example failed', e)
      showToast('Failed to load example')
    }
  }
  // Default example helpers will be passed to ExamplesPanel
  // First-launch: load default preset once if configured and no saved state yet
  useEffect(() => {
    try {
      const seen = localStorage.getItem('plotterlab:seen')
      if (seen) return
      const def = localStorage.getItem('plotterlab:defaultPreset')
      if (!def) { localStorage.setItem('plotterlab:seen','1'); return }
      fetch(`/presets/${def}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          if (data.doc) setDoc(d => ({ ...d, ...data.doc }))
          if (Array.isArray(data.layers)) setLayers(data.layers)
        })
        .finally(() => { try { localStorage.setItem('plotterlab:seen','1') } catch {} })
    } catch {}
  }, [])

  // On-canvas clip shape picker
  const [picker, setPicker] = useState({ active: false, targetLayerId: null })
  // On-canvas transform gizmo (for svgImport layers)
  const [transform, setTransform] = useState({ active: false, layerId: null })

  // Compute a separation that fits isoContours vertically inside the page.
  const fitIsoSeparation = (layerId) => {
    try {
      setLayers(ls => ls.map(l => {
        if (l.id !== layerId) return l;
        if (l.generator !== 'isoContours') return l;
        const p = l.params || {};
        const lobes = Math.max(1, Math.floor(p.lobes ?? 2));
        const sigmaY = Number.isFinite(p.sigmaY) ? Number(p.sigmaY) : 55;
        const my = Number.isFinite(doc.marginY) ? Number(doc.marginY) : Number(doc.margin)||0;
        const H = Math.max(10, Number(doc.height) - 2*my);
        // 3-sigma envelope around extreme lobes; overall height ~ (lobes-1)*sep + 2*k*sigmaY
        const k = 3;
        const available = Math.max(10, H - 2*k*sigmaY);
        let sep = lobes > 1 ? (available / (lobes - 1)) : 0;
        // Clamp to sensible bounds
        const maxSep = H / Math.max(1, lobes);
        sep = Math.max(6, Math.min(sep, maxSep));
        const rounded = Math.round(sep * 10) / 10;
        return { ...l, params: { ...p, separation: rounded } };
      }));
      showToast('Separation fitted');
    } catch (e) {
      console.error('fitIsoSeparation error', e);
      showToast('Fit failed');
    }
  }

  // Iso Contours presets helper
  const isoPresetValues = (name) => {
    switch (name) {
      case 'hourglass':
        return { lobes: 2, separation: 80, sigmaX: 90, sigmaY: 55, bias: 0.18, levels: 60, warp: 0 }
      case 'lens':
        return { lobes: 2, separation: 30, sigmaX: 80, sigmaY: 80, bias: 0.16, levels: 64, warp: 0.1 }
      case 'bulb':
        return { lobes: 1, separation: 0, sigmaX: 120, sigmaY: 90, bias: 0.2, levels: 70, warp: 0 }
      case 'triple':
        return { lobes: 3, separation: 70, sigmaX: 90, sigmaY: 50, bias: 0.2, levels: 64, warp: 0 }
      default:
        return {}
    }
  }
  const [layers, setLayers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plotterlab:layers'))
      if (Array.isArray(saved) && saved.length) return saved
    } catch(e) {}
    return [newLayer(0), { ...newLayer(1), generator: 'starLattice', params: { ...GENERATORS.starLattice.params } }]
  })

  // Debounce state that drives heavy generators to avoid recomputing on every keystroke
  const dLayers = useDebouncedValue(layers, 60)
  // Exclude view-only props so moving zoom/grid sliders doesn't trigger preview recompute
  const docRenderInput = useMemo(() => {
    const {
      // preview + viewport controls
      previewZoom, previewPanX, previewPanY, previewAutoFit, previewUpscale, previewHeight,
      // overlays and UI-only toggles/colors
      showGrid, gridSizePx, showToolpathControls, showStart, startMarkerColor,
      showPaperBorder, paperBorderColor, showMarginBorder, marginBorderColor,
      showTravel, travelColor, showOrderNumbers, orderNumberColor,
      // background colors
      bg, appBg,
      // everything else remains for rendering
      ...rest
    } = doc || {}
    return rest
  }, [doc])
  const dDoc = useDebouncedValue(docRenderInput, 60)
  const dDocSig = useMemo(() => JSON.stringify(dDoc || {}), [dDoc])
  const dLayersSig = useMemo(() => JSON.stringify(dLayers || []), [dLayers])

  // Undo/Redo history integration
  const { canUndo, canRedo, undo, redo, snapshot, restoringRef: restoringHistory } = useHistory({
    getDocSnapshot: () => (docRenderInput || {}),
    getLayersSnapshot: () => (layers || []),
    setDoc,
    setLayers,
    max: 100
  })
  useEffect(() => {
    if (!restoringHistory.current) snapshot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dDocSig, dLayersSig])

  useEffect(() => { try { localStorage.setItem('plotterlab:doc', JSON.stringify(doc)) } catch(e){} }, [doc])
  useEffect(() => { try { localStorage.setItem('plotterlab:layers', JSON.stringify(layers)) } catch(e){} }, [layers])

  // Layer action handlers
  const addLayer = () => { setLayers(ls => [...ls, newLayer(ls.length)]); showToast('Layer added') }
  const removeLayer = (id) => { setLayers(ls => ls.filter(l => l.id !== id)); showToast('Layer removed') }
  const toggleVisible = (id) => setLayers(ls => ls.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  const moveLayer = (id, dir) => setLayers(ls => {
    const idx = ls.findIndex(l => l.id === id)
    if (idx < 0) return ls
    const ni = dir < 0 ? Math.max(0, idx - 1) : Math.min(ls.length - 1, idx + 1)
    if (ni === idx) return ls
    const copy = ls.slice()
    const [item] = copy.splice(idx, 1)
    copy.splice(ni, 0, item)
    return copy
  })
  const setAllLayersCollapsed = (flag) => setLayers(ls => ls.map(l => ({ ...l, uiCollapsed: !!flag })))

  // Presets: export/import
  const fileRef = useRef(null)
  const photoRef = useRef(null)
  const [photoMode, setPhotoMode] = useState(null) // 'mono' | 'cmyk'
  const imageRef = useRef(null)
  const [imageTargetLayerId, setImageTargetLayerId] = useState(null)
  const svgRef = useRef(null)
  // Bitmap cache keyed by layerId for image-driven generators (e.g., halftone)
  const [bitmaps, setBitmaps] = useState({})
  // Per-layer image loader handlers (Image Source group)
  const openImageForLayer = (layerId) => { setImageTargetLayerId(layerId); imageRef.current?.click() }
  const onImageFilePicked = async (e) => {
    const file = e.target.files?.[0]
    try {
      if (file && imageTargetLayerId) await onLayerImageSelected(imageTargetLayerId, file)
    } catch (err) {
      console.error('Image pick failed', err)
    } finally {
      setImageTargetLayerId(null)
      if (e.target) e.target.value = ''
    }
  }
  // Load an image file into a target layer's bitmap slot and record imageInfo
  const onLayerImageSelected = async (layerId, file) => {
    if (!file) return
    try {
      const bmp = await fileToRGB(file, 800)
      setBitmaps(m => ({ ...m, [layerId]: bmp }))
      setLayers(ls => ls.map(l => l.id === layerId ? { ...l, params: { ...l.params, imageInfo: `${bmp.width}x${bmp.height}` } } : l))
      showToast('Image loaded')
    } catch (e) {
      console.error('Image load failed', e)
      showToast('Image load failed')
    }
  }
  const clearLayerImage = (layerId) => {
    setBitmaps(m => { const n = { ...m }; delete n[layerId]; return n })
    setLayers(ls => ls.map(l => l.id === layerId ? ({ ...l, params: { ...l.params, imageInfo: '' } }) : l))
  }
  // Photo -> Halftone import (Mono/CMYK)
  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) { setPhotoMode(null); return }
    try {
      const bmp = await fileToRGB(file, 800)
      if (photoMode === 'mono') {
        const id = uid()
        const layer = {
          id,
          name: 'Photo (Mono Halftone)',
          color: '#111111',
          visible: true,
          generator: 'halftone',
          params: { ...GENERATORS['halftone'].params, imageInfo: `${bmp.width}x${bmp.height}`, shape: 'lines', spacing: 1.2, segment: 0.4, angleDeg: 0, method: 'floyd' },
          uiCollapsed: false
        }
        setLayers(ls => [...ls, layer])
        setBitmaps(m => ({ ...m, [id]: { width: bmp.width, height: bmp.height, data: bmp.data } }))
        showToast('Mono photo imported')
      } else if (photoMode === 'cmyk') {
        const { r: R, g: G, b: B } = bmp
        const n = bmp.width * bmp.height
        const Cb = new Float32Array(n)
        const Mb = new Float32Array(n)
        const Yb = new Float32Array(n)
        const Kb = new Float32Array(n)
        for (let i = 0; i < n; i++) {
          const r = R[i], g = G[i], b = B[i]
          const k = 1 - Math.max(r, g, b)
          Kb[i] = k
          if (k < 0.9999) {
            const denom = 1 - k
            Cb[i] = (1 - r - k) / denom
            Mb[i] = (1 - g - k) / denom
            Yb[i] = (1 - b - k) / denom
          } else {
            Cb[i] = 0; Mb[i] = 0; Yb[i] = 0
          }
        }
        const mkLayer = (name, color, angle) => ({
          id: uid(),
          name: `Photo (${name})`,
          color,
          visible: true,
          generator: 'halftone',
          params: { ...GENERATORS['halftone'].params, imageInfo: `${bmp.width}x${bmp.height}`, shape: 'lines', spacing: 1.2, segment: 0.4, angleDeg: angle, method: 'floyd' },
          uiCollapsed: false
        })
        const Lc = mkLayer('C', '#00AEEF', 15)
        const Lm = mkLayer('M', '#EC008C', 75)
        const Ly = mkLayer('Y', '#FFF200', 0)
        const Lk = mkLayer('K', '#111111', 45)
        setLayers(ls => [...ls, Lc, Lm, Ly, Lk])
        setBitmaps(m => ({
          ...m,
          [Lc.id]: { width: bmp.width, height: bmp.height, data: Cb },
          [Lm.id]: { width: bmp.width, height: bmp.height, data: Mb },
          [Ly.id]: { width: bmp.width, height: bmp.height, data: Yb },
          [Lk.id]: { width: bmp.width, height: bmp.height, data: Kb }
        }))
        showToast('CMYK photo imported')
      }
    } catch (err) {
      console.error('Photo import failed', err)
      showToast('Photo import failed')
    } finally {
      setPhotoMode(null)
      if (e.target) e.target.value = ''
    }
  }
  // Open photo picker with desired mode (mono|cmyk)
  const onPickPhoto = (mode) => { setPhotoMode(mode); photoRef.current?.click() }
  const stageRef = useRef(null)
  const fittingRef = useRef(false)
  const lastFitRef = useRef({ w: 0, h: 0 })
  const panRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 })
  // Transform drag ref
  const transformRef = useRef({
    dragging: false,
    type: null, // 'move' | 'scale' | 'rotate'
    startX: 0,
    startY: 0,
    centerX: 0,
    centerY: 0,
    r0: 1,
    a0: 0,
    orig: { offsetX: 0, offsetY: 0, scale: 1, rotateDeg: 0 }
  })

  const onWheelPreview = (e) => {
    // Prevent the page from scrolling while zooming the preview
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    const dz = e.deltaY < 0 ? 1.1 : 0.9
    const rect = svgRef.current?.getBoundingClientRect()
    setDoc(d => {
      const curZ = d.previewZoom || 1
      const nextZ = Math.max(0.2, Math.min(8, curZ * dz))
      if (!rect) return { ...d, previewZoom: nextZ, previewAutoFit: false }
      // Zoom to cursor: keep the world point under the cursor fixed
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const vw = d.width / curZ
      const vh = d.height / curZ
      const mmPerPxX = vw / rect.width
      const mmPerPxY = vh / rect.height
      const minX = d.previewPanX || 0
      const minY = d.previewPanY || 0
      const worldX = minX + px * mmPerPxX
      const worldY = minY + py * mmPerPxY
      const vw2 = d.width / nextZ
      const vh2 = d.height / nextZ
      let newMinX = worldX - px * (vw2 / rect.width)
      let newMinY = worldY - py * (vh2 / rect.height)
      // Clamp pan to document bounds
      newMinX = Math.max(0, Math.min(Math.max(0, d.width - vw2), newMinX))
      newMinY = Math.max(0, Math.min(Math.max(0, d.height - vh2), newMinY))
      return { ...d, previewZoom: nextZ, previewPanX: newMinX, previewPanY: newMinY, previewAutoFit: false }
    })
  }

  const onMouseMovePreview = (e) => {
    if (!panRef.current.active) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const z = Math.max(0.2, (doc.previewZoom || 1))
    const vw = doc.width / z
    const vh = doc.height / z
    const mmPerPxX = vw / rect.width
    const mmPerPxY = vh / rect.height
    const dx = (e.clientX - panRef.current.startX) * mmPerPxX
    const dy = (e.clientY - panRef.current.startY) * mmPerPxY
    setDoc(d => ({ ...d, previewPanX: panRef.current.panX - dx, previewPanY: panRef.current.panY - dy }))
  }

  const onMouseUpPreview = () => {
    panRef.current.active = false
    window.removeEventListener('mousemove', onMouseMovePreview)
    window.removeEventListener('mouseup', onMouseUpPreview)
    setIsPanning(false)
  }

  // Toggle a specific clip index for a target layer, optionally additive (Shift)
  const toggleClipIndexForLayer = (targetLayerId, srcId, idx, additive) => {
    setLayers(ls => ls.map(l => {
      if (l.id !== targetLayerId) return l
      const next = { ...l, params: { ...l.params, clipLayerId: srcId, clipMode: 'index', clipToPrevious: false } }
      const cur = Array.isArray(next.params.clipIndices) ? next.params.clipIndices.slice() : (Number.isFinite(next.params.clipIndex) ? [Math.max(0, Math.floor(next.params.clipIndex))] : [])
      const i = Math.max(0, Math.floor(idx))
      if (additive) {
        const pos = cur.indexOf(i)
        if (pos >= 0) cur.splice(pos, 1)
        else cur.push(i)
      } else {
        cur.length = 0; cur.push(i)
      }
      delete next.params.clipIndex
      next.params.clipIndices = cur
      return next
    }))
  }

  // Allow Esc to exit picking mode
  useEffect(() => {
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') {
        setPicker(p => ({ ...p, active: false }))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const onMouseDownPreview = (e) => {
    // Shape picking has priority
    if (picker.active) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const z = Math.max(0.2, (doc.previewZoom || 1))
        const vw = doc.width / z
        const vh = doc.height / z
        const mmPerPxX = vw / rect.width
        const mmPerPxY = vh / rect.height
        const minX = (doc.previewPanX || 0)
        const minY = (doc.previewPanY || 0)
        const x = minX + (e.clientX - rect.left) * mmPerPxX
        const y = minY + (e.clientY - rect.top) * mmPerPxY
        const tx = Math.max(0, Math.min(doc.width, x))
        const ty = Math.max(0, Math.min(doc.height, y))

        // Helper
        const pointInPolygon = (p, poly) => {
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
        // Use shared makeClipPolysLocal defined at component scope

        const target = layers.find(l => l.id === picker.targetLayerId)
        if (target) {
          const preferId = target.params?.clipLayerId
          const candidates = []
          if (preferId) {
            const src = rendered.find(r => r.layer.id === preferId && r.layer.visible)
            if (src) candidates.push(src)
          } else {
            for (const r of rendered) if (r.layer.visible && r.layer.id !== target.id) candidates.push(r)
          }
          let found = null
          for (const src of candidates) {
            const polys = makeClipPolysLocal(src.polylines)
            const containing = []
            for (let i = 0; i < polys.length; i++) {
              if (pointInPolygon([tx,ty], polys[i])) containing.push(i)
            }
            if (containing.length) {
              // Prefer the polygon whose centroid is closest to the click (intuitive for inner circles)
              const d2 = (a,b)=>{ const dx=a[0]-b[0], dy=a[1]-b[1]; return dx*dx+dy*dy }
              let pick = containing[0]
              let best = d2([tx,ty], centroidOfPoly(polys[pick]))
              for (let k = 1; k < containing.length; k++) {
                const cand = containing[k]
                const dd = d2([tx,ty], centroidOfPoly(polys[cand]))
                if (dd < best) { best = dd; pick = cand }
              }
              found = { srcId: src.layer.id, idx: pick }
              break
            }
          }
          if (found) {
            // For any generator: support multi-select (Shift toggles), using clipIndices array
            setLayers(ls => ls.map(l => {
              if (l.id !== target.id) return l
              const next = { ...l, params: { ...l.params, clipLayerId: found.srcId, clipMode: 'index', clipToPrevious: false } }
              const cur = Array.isArray(next.params.clipIndices) ? next.params.clipIndices.slice() : (Number.isFinite(next.params.clipIndex) ? [Math.max(0, Math.floor(next.params.clipIndex))] : [])
              const idx = Math.max(0, Math.floor(found.idx))
              if (e.shiftKey) {
                const pos = cur.indexOf(idx)
                if (pos >= 0) {
                  cur.splice(pos, 1)
                } else {
                  cur.push(idx)
                }
              } else {
                cur.length = 0; cur.push(idx)
              }
              delete next.params.clipIndex
              next.params.clipIndices = cur
              return next
            }))
          }
        }
      }
      // Keep picker active so user can select/toggle multiple indices.
      // Exit by clicking the Pick button again or switching tools.
      return
    }
    // Transform gizmo has next priority
    if (transform.active && transform.layerId) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const z = Math.max(0.2, (doc.previewZoom || 1))
        const vw = doc.width / z
        const vh = doc.height / z
        const mmPerPxX = vw / rect.width
        const mmPerPxY = vh / rect.height
        const minX = (doc.previewPanX || 0)
        const minY = (doc.previewPanY || 0)
        const x = minX + (e.clientX - rect.left) * mmPerPxX
        const y = minY + (e.clientY - rect.top) * mmPerPxY
        const entry = rendered.find(r => r.layer.id === transform.layerId)
        let b = null
        if (entry && entry.polylines && entry.polylines.length) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const p of entry.polylines) {
            for (const [px,py] of p) {
              if (!Number.isFinite(px) || !Number.isFinite(py)) continue
              if (px < minX) minX = px
              if (py < minY) minY = py
              if (px > maxX) maxX = px
              if (py > maxY) maxY = py
            }
          }
          if (minX < Infinity) b = { minX, minY, maxX, maxY }
        }
        if (b) {
          const cx = (b.minX + b.maxX) / 2
          const cy = (b.minY + b.maxY) / 2
          const handleR = 8 // mm
          const near = (px, py) => ((px-x)*(px-x) + (py-y)*(py-y)) <= (handleR*handleR)
          const tl = [b.minX, b.minY]
          const tr = [b.maxX, b.minY]
          const br = [b.maxX, b.maxY]
          const bl = [b.minX, b.maxY]
          const topMid = [(b.minX+b.maxX)/2, b.minY]
          const rot = [topMid[0], Math.max(0, b.minY - Math.max(10, (b.maxY-b.minY)*0.08))]
          let type = null
          if (near(...tl) || near(...tr) || near(...br) || near(...bl)) type = 'scale'
          else if (near(...rot)) type = 'rotate'
          else if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) type = 'move'
          if (type) {
            const layer = layers.find(l=>l.id===transform.layerId)
            const p = layer?.params || {}
            transformRef.current.dragging = true
            transformRef.current.type = type
            transformRef.current.startX = x
            transformRef.current.startY = y
            transformRef.current.centerX = cx
            transformRef.current.centerY = cy
            const dx0 = x - cx, dy0 = y - cy
            transformRef.current.r0 = Math.max(1e-6, Math.hypot(dx0, dy0))
            transformRef.current.a0 = Math.atan2(dy0, dx0)
            transformRef.current.orig = {
              offsetX: Number(p.offsetX)||0,
              offsetY: Number(p.offsetY)||0,
              scale: Number(p.scale)||1,
              rotateDeg: Number(p.rotateDeg||p.rotate||0)
            }
            window.addEventListener('mousemove', onMouseMoveTransform)
            window.addEventListener('mouseup', onMouseUpTransform)
            return
          }
        }
      }
    }
    // Shift+Click sets start point at clicked location
    if (e.shiftKey) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const z = Math.max(0.2, (doc.previewZoom || 1))
        const vw = doc.width / z
        const vh = doc.height / z
        const mmPerPxX = vw / rect.width
        const mmPerPxY = vh / rect.height
        const minX = (doc.previewPanX || 0)
        const minY = (doc.previewPanY || 0)
        const x = minX + (e.clientX - rect.left) * mmPerPxX
        const y = minY + (e.clientY - rect.top) * mmPerPxY
        const cx = Math.max(0, Math.min(doc.width, x))
        const cy = Math.max(0, Math.min(doc.height, y))
        setDoc(d => ({ ...d, startX: cx, startY: cy, startPreset: 'custom' }))
      }
      return
    }
    // Middle mouse always pans; space+drag is an explicit pan mode
    if (e.button === 1) { e.preventDefault() }
    panRef.current.active = true
    panRef.current.startX = e.clientX
    panRef.current.startY = e.clientY
    panRef.current.panX = doc.previewPanX || 0
    panRef.current.panY = doc.previewPanY || 0
    // user interaction: disable auto-fit so it doesn't fight the user
    setDoc(d => ({ ...d, previewAutoFit: false }))
    setIsPanning(true)
    window.addEventListener('mousemove', onMouseMovePreview)
    window.addEventListener('mouseup', onMouseUpPreview)
  }

  // Attach a non-passive wheel listener so we can preventDefault to stop page scroll
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (ev) => onWheelPreview(ev)
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [svgRef])

  // Transform drag handlers
  const onMouseMoveTransform = (e) => {
    if (!transformRef.current.dragging || !transform.layerId) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const z = Math.max(0.2, (doc.previewZoom || 1))
    const vw = doc.width / z
    const vh = doc.height / z
    const mmPerPxX = vw / rect.width
    const mmPerPxY = vh / rect.height
    const minX = (doc.previewPanX || 0)
    const minY = (doc.previewPanY || 0)
    const x = minX + (e.clientX - rect.left) * mmPerPxX
    const y = minY + (e.clientY - rect.top) * mmPerPxY
    const t = transformRef.current
    const orig = t.orig
    if (t.type === 'move') {
      const dx = x - t.startX
      const dy = y - t.startY
      setLayers(ls => ls.map(l => l.id===transform.layerId ? { ...l, params: { ...l.params, offsetX: orig.offsetX + dx, offsetY: orig.offsetY + dy } } : l))
    } else if (t.type === 'scale') {
      const r = Math.max(1e-6, Math.hypot(x - t.centerX, y - t.centerY))
      const s = Math.max(0.01, orig.scale * (r / t.r0))
      setLayers(ls => ls.map(l => l.id===transform.layerId ? { ...l, params: { ...l.params, scale: s } } : l))
    } else if (t.type === 'rotate') {
      const a1 = Math.atan2(y - t.centerY, x - t.centerX)
      const deltaDeg = (a1 - t.a0) * 180 / Math.PI
      setLayers(ls => ls.map(l => l.id===transform.layerId ? { ...l, params: { ...l.params, rotateDeg: orig.rotateDeg + deltaDeg } } : l))
    }
  }
  const onMouseUpTransform = () => {
    transformRef.current.dragging = false
    transformRef.current.type = null
    window.removeEventListener('mousemove', onMouseMoveTransform)
    window.removeEventListener('mouseup', onMouseUpTransform)
  }

  // Quasicrystal animation quick controls in toolbar (declare before effect dependencies)
  const anyQc = useMemo(() => layers.some(l => l.generator === 'quasicrystalContours'), [layers])
  const anyQcAnimating = useMemo(() => layers.some(l => l.generator === 'quasicrystalContours' && !!l.params?.animatePhase), [layers])
  const toggleQcAnimate = () => setLayers(ls => ls.map(l => l.generator === 'quasicrystalContours' ? ({ ...l, params: { ...l.params, animatePhase: !l.params?.animatePhase } }) : l))
  const resetQcPhase = () => setLayers(ls => ls.map(l => l.generator === 'quasicrystalContours' ? ({ ...l, params: { ...l.params, phase: 0 } }) : l))

  // Animate quasicrystal phase (preview only)
  useEffect(() => {
    let rafId = 0
    let last = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const tick = (t) => {
      const now = typeof performance !== 'undefined' ? t : Date.now()
      const dt = Math.max(0, (now - last) / 1000)
      last = now
      setLayers(ls => {
        let changed = false
        const out = ls.map(l => {
          if (l.generator === 'quasicrystalContours' && l.params?.animatePhase) {
            const spd = Number(l.params.phaseSpeed ?? 1)
            const ph = Number(l.params.phase ?? 0) + dt * spd
            changed = true
            return { ...l, params: { ...l.params, phase: ph } }
          }
          return l
        })
        return changed ? out : ls
      })
      rafId = requestAnimationFrame(tick)
    }
    if (doc.fastPreview && anyQcAnimating) rafId = requestAnimationFrame(tick)
    return () => { try { cancelAnimationFrame(rafId) } catch {} }
  }, [doc.fastPreview, anyQcAnimating])

  // Compute a best-fit zoom to fill the visible container area
  const fitPreview = (force = false) => {
    const cont = stageRef.current
    if (!cont) return
    // Prefer client box to avoid including scroll height
    const cw = cont.clientWidth
    const ch = cont.clientHeight
    const rect = cont.getBoundingClientRect()
    const w = Math.max(cw || 0, rect.width || 0)
    const h = Math.max(ch || 0, rect.height || 0)
    if (!w || !h) return
    // Avoid re-fitting when size didn't really change (prevents jumpiness on minor layout jitters)
    if (!force) {
      const lw = lastFitRef.current.w
      const lh = lastFitRef.current.h
      if (Math.abs(w - lw) < 2 && Math.abs(h - lh) < 2) return
    }
    const pad = 24 // px padding within the container
    const availW = Math.max(1, w - pad)
    const availH = Math.max(1, h - pad)
    const scaleW = availW / doc.width
    const scaleH = availH / doc.height
    let z = Math.min(scaleW, scaleH)
    if (!doc.previewUpscale) z = Math.min(1, z) // downscale-only mode by default
    z = Math.max(0.2, Math.min(8, z))
    if (fittingRef.current) return
    fittingRef.current = true
    setDoc(d => ({ ...d, previewZoom: z, previewPanX: 0, previewPanY: 0 }))
    lastFitRef.current = { w, h }
    setTimeout(() => { fittingRef.current = false }, 0)
  }

  // Auto-fit on first render and when doc size changes if user hasn't moved the view
  useEffect(() => {
    if (doc.previewAutoFit || ((doc.previewZoom ?? 1) === 1 && (doc.previewPanX ?? 0) === 0 && (doc.previewPanY ?? 0) === 0)) {
      fitPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.width, doc.height])

  // Also fit once on initial mount to avoid starting low on first load
  // Keyboard shortcuts: +/- zoom, 0 reset, F fit, C content, G toggle G-code, Space pan visual hint
  useEffect(() => {
    const isTypingTarget = (el) => {
      const tag = (el?.tagName || '').toLowerCase()
      return el?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'
    }
    const zoomBy = (factor) => {
      const rect = svgRef.current?.getBoundingClientRect()
      setDoc(d => {
        const curZ = d.previewZoom || 1
        const nextZ = Math.max(0.2, Math.min(8, curZ * factor))
        if (!rect) return { ...d, previewZoom: nextZ, previewAutoFit: false }
        const px = rect.width / 2
        const py = rect.height / 2
        const vw = d.width / curZ
        const vh = d.height / curZ
        const mmPerPxX = vw / rect.width
        const mmPerPxY = vh / rect.height
        const minX = d.previewPanX || 0
        const minY = d.previewPanY || 0
        const worldX = minX + px * mmPerPxX
        const worldY = minY + py * mmPerPxY
        const vw2 = d.width / nextZ
        const vh2 = d.height / nextZ
        let newMinX = worldX - px * (vw2 / rect.width)
        let newMinY = worldY - py * (vh2 / rect.height)
        newMinX = Math.max(0, Math.min(Math.max(0, d.width - vw2), newMinX))
        newMinY = Math.max(0, Math.min(Math.max(0, d.height - vh2), newMinY))
        return { ...d, previewZoom: nextZ, previewPanX: newMinX, previewPanY: newMinY, previewAutoFit: false }
      })
    }
    const onKeyDown = (e) => {
      // Do not trigger global shortcuts while typing in inputs/selects/contenteditable
      if (isTypingTarget(e.target)) return
      // Undo/Redo (Ctrl/Cmd + Z/Y)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); return }
        if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); redo(); return }
      }
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault(); zoomBy(1.1); break
        case '-':
        case '_':
          e.preventDefault(); zoomBy(0.9); break
        case '0':
          e.preventDefault(); setDoc(d => ({ ...d, previewZoom: 1, previewPanX: 0, previewPanY: 0, previewAutoFit: false })); break
        case 'f': case 'F':
          e.preventDefault(); fitPreview(true); break
        case 'c': case 'C':
          e.preventDefault(); fitToContent(); break
        case 'g': case 'G':
          e.preventDefault(); setDoc(d => ({ ...d, showToolpathControls: !d.showToolpathControls })); break
        case 'h': case 'H':
          e.preventDefault(); setShowHelp(v => !v); break
        case '?':
          e.preventDefault(); setShowHelp(v => !v); break
        case 'Escape':
          e.preventDefault(); setShowHelp(false); break
        case ' ': // Space shows pan cursor hint
          if (!spaceDown) setSpaceDown(true)
          break
        default: break
      }
    }
    const onKeyUp = (e) => { if (e.key === ' ') setSpaceDown(false) }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [fitPreview, spaceDown])
  useEffect(() => {
    let raf1 = requestAnimationFrame(() => {
      let raf2 = requestAnimationFrame(() => fitPreview())
      // store second id on first id variable for cleanup chain
      raf1 = raf2
    })
    const onResize = () => { if (doc.previewAutoFit) fitPreview() }
    window.addEventListener('resize', onResize)
    return () => {
      try { cancelAnimationFrame(raf1) } catch {}
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Auto-fit when the preview container resizes (sidebar width changes, window resize)
  useEffect(() => {
    if (!stageRef.current) return
    const ro = new ResizeObserver(() => { if (doc.previewAutoFit) fitPreview() })
    ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [stageRef, doc.previewAutoFit])
  // Export all visible layers as individual SVG files (ZIP)
  const downloadSVGs = () => {
    setSaveMessage('Preparing SVGs...')
    setIsSaving(true)
    setSaveProgress(0)
    showToast('Preparing SVGs...')
    setTimeout(async () => {
      try {
        const zip = new JSZip()
        const full = renderAll(layers, doc, mdiCache, bitmaps, 1)
        for (const entry of full) {
          if (!entry || !entry.layer || !entry.layer.visible) continue
          const planned = applyPathPlanning(entry.polylines, doc, doc.optimizeJoin)
          const d = planned.map(polylineToPath).join(' ')
          const svg = buildSVG({ width: doc.width, height: doc.height, bleed: doc.bleed,
            paths: [{ d, stroke: entry.layer.color, strokeWidth: doc.strokeWidth }] })
          const safe = (entry.layer.name || 'layer').replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '')
          zip.file(`${safe}.svg`, svg)
        }
        setSaveMessage('Zipping SVGs...')
        const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          setSaveProgress(metadata.percent)
        })
        setSaveMessage('Saving file...')
        saveAs(blob, `svgs_${doc.seed}.zip`)
        showToast('SVG layers saved')
      } catch (e) {
        console.error('SVG export failed', e)
        showToast('SVG export failed')
      } finally {
        setIsSaving(false)
      }
    }, 16)
  }

  const exportPreset = () => {
    setSaveMessage('Saving preset...');
    setIsSaving(true);
    showToast('Saving preset...')
    try {
      const preset = { doc, layers }
      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
      saveAs(blob, `preset_${doc.seed}.json`)
      showToast('Preset saved')
    } catch (e) {
      console.error('Export preset failed', e)
      showToast('Export preset failed')
    } finally {
      setIsSaving(false)
    }
  }
  const openImport = () => fileRef.current?.click()
  const regenerateSeed = () => {
    setDoc(d => ({ ...d, seed: Math.random().toString(36).slice(2, 10) }))
    showToast('Seed randomized')
  }
  const handleImport = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      showToast('Loading preset...')
      const text = await f.text()
      const data = JSON.parse(text)
      if (data.doc) setDoc(d => ({ ...d, ...data.doc }))
      if (Array.isArray(data.layers)) setLayers(data.layers)
      showToast('Preset loaded')
    } catch (err) {
      console.error('Import preset failed', err)
      showToast('Import preset failed')
    } finally {
      e.target.value = ''
    }
  }

  // Cache of mdi name -> path data from server
  const [mdiCache, setMdiCache] = useState({})
  useEffect(() => {
    const controller = new AbortController()
    const needed = new Set()
    for (const l of layers) {
      if (l.generator === 'mdiPattern') {
        const name = l.params?.iconName
        if (name && !(name in mdiCache)) needed.add(name)
      } else if (l.generator === 'mdiIconField') {
        const csv = l.params?.namesCsv || ''
        const parts = String(csv).split(/[;,\s]+/).filter(Boolean)
        for (const p of parts) if (!(p in mdiCache)) needed.add(p)
      }
    }
    if (needed.size === 0) return
    ;(async () => {
      const updates = {}
      for (const name of needed) {
        try {
          const res = await fetch(`/api/mdi/${encodeURIComponent(name)}`, { signal: controller.signal })
          if (!res.ok) { updates[name] = null; continue }
          const json = await res.json()
          updates[name] = json?.d || null
        } catch (e) {
          updates[name] = null
        }
      }
      setMdiCache(prev => ({ ...prev, ...updates }))
    })()
    return () => controller.abort()
  }, [layers])


  // Preview rendering with progress (off-main-thread via Web Worker when available)
  const [rendered, setRendered] = useState([])
  const [previewProgress, setPreviewProgress] = useState(0)
  const [previewDetail, setPreviewDetail] = useState(null)
  const [progressVisible, setProgressVisible] = useState(false)
  const [previewNonce, setPreviewNonce] = useState(0)
  const workerRef = useRef(null)
  const jobIdRef = useRef(0)
  const [workerPaths, setWorkerPaths] = useState(null)
  const lastPathsRef = useRef([])
  const lastEstimateRef = useRef({ drawLen: 0, travelLen: 0, totalLen: 0, drawMin: 0, travelMin: 0, totalMin: 0, fmt: (m)=>`${Math.floor(m)}m 0s`, penLifts: 0 })
  const resetPreview = () => {
    try { if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null } } catch {}
    setWorkerPaths(null)
    setPreviewNonce(n => n + 1)
    setProgressVisible(false)
  }
  const cancelPreview = () => {
    try { if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null } } catch {}
    setProgressVisible(false)
  }

  const previewQuality = useMemo(() => (doc.fastPreview ? Math.max(0.2, Math.min(1, Number(doc.previewQuality) || 0.6)) : 1), [doc.fastPreview, doc.previewQuality])
  // Debounced inputs for heavy computation; prefer Web Worker
  useEffect(() => {
    let cancelled = false
    const id = ++jobIdRef.current
    setWorkerPaths(null)
    setProgressVisible(true)
    setPreviewProgress(0)
    setPreviewDetail(null)
    // Try worker first
    try {
      const w = new Worker(new URL('./lib/previewWorker.js', import.meta.url), { type: 'module' })
      workerRef.current = w
      const lastProgressUpdateRef = { t: 0, p: -1 }
      w.onmessage = (e) => {
        const msg = e.data || {}
        if (msg.id !== id) return // stale
        if (msg.type === 'progress') {
          if (cancelled) return
          const pct = Math.max(0, Math.min(1, Number(msg.progress) || 0))
          const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
          if ((now - lastProgressUpdateRef.t) > 80 || Math.abs(pct - lastProgressUpdateRef.p) > 0.02) {
            lastProgressUpdateRef.t = now; lastProgressUpdateRef.p = pct
            setPreviewProgress(pct)
          }
          if (msg.detail) setPreviewDetail({ idx: Math.round(Number(msg.detail.idx) || 0), total: Math.round(Number(msg.detail.total) || 0), layerName: msg.detail.layerName || '', layerId: msg.detail.layerId || null })
        } else if (msg.type === 'done') {
          if (cancelled) return
          setRendered(Array.isArray(msg.outputs) ? msg.outputs : [])
          setWorkerPaths(Array.isArray(msg.paths) ? msg.paths : null)
          if (Array.isArray(msg.paths)) lastPathsRef.current = msg.paths
          setProgressVisible(false)
          try { w.terminate() } catch {}
          if (workerRef.current === w) workerRef.current = null
        } else if (msg.type === 'error') {
          console.error('Preview worker error:', msg.message)
          if (!cancelled) setProgressVisible(false)
          try { w.terminate() } catch {}
          if (workerRef.current === w) workerRef.current = null
        }
      }
      w.postMessage({ id, layers: dLayers, doc: (dDoc || doc), mdiCache, bitmaps, quality: previewQuality, optimizeJoin: !!doc.optimizeJoin })
      return () => {
        cancelled = true
        try { if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null } } catch {}
      }
    } catch (err) {
      console.warn('Worker preview unavailable; falling back to main thread', err)
      // Fallback to main-thread compute (debounced inputs mitigate hitching)
      try {
        const outs = renderAll(dLayers, dDoc || doc, mdiCache, bitmaps, previewQuality, (p) => {
          if (cancelled) return
          const pct = Math.max(0, Math.min(1, Number(p?.pct) || 0))
          setPreviewProgress(pct)
          setPreviewDetail({ idx: Math.round(Number(p?.idx) || 0), total: Math.round(Number(p?.total) || 0), layerName: p?.layerName || '', layerId: p?.layerId || null })
        })
        if (!cancelled) setRendered(outs)
      } catch (e) {
        console.error('Preview render failed', e)
        if (!cancelled) setRendered([])
      } finally {
        if (!cancelled) setProgressVisible(false)
      }
      return () => { cancelled = true }
    }
  }, [dLayers, dDocSig, mdiCache, bitmaps, previewQuality, previewNonce, doc.optimizeJoin])

  // Path data for SVG preview by layer (post planning)
  const svgPaths = useMemo(() => {
    if (Array.isArray(workerPaths) && workerPaths.length) return workerPaths.filter(p => p?.layer?.visible)
    if (progressVisible) return Array.isArray(lastPathsRef.current) ? lastPathsRef.current.filter(p => p?.layer?.visible) : []
    const out = []
    for (const entry of rendered) {
      if (!entry?.layer?.visible) continue
      const planned = applyPathPlanning(entry.polylines || [], doc, doc.optimizeJoin)
      const d = planned.map(polylineToPath).join(' ')
      out.push({ layer: entry.layer, d })
    }
    return out
  }, [progressVisible, workerPaths, rendered, doc.optimizeJoin, doc.width, doc.height, doc.strokeWidth])

  // Overlay of order numbers (uses planned order)
  const overlayOrder = useMemo(() => {
    if (!doc.showOrderNumbers) return []
    const out = []
    for (const entry of rendered) {
      if (!entry?.layer?.visible) continue
      const planned = applyPathPlanning(entry.polylines || [], doc, doc.optimizeJoin)
      for (const p of planned) out.push(p)
    }
    return out
  }, [rendered, doc.showOrderNumbers, doc.optimizeJoin])

  // Travel path overlay (optional). For now, no-op unless implemented.
  const travelD = useMemo(() => '', [rendered, doc.optimizeJoin])

  // Stats overlay
  const statsCounts = useMemo(() => {
    let polys = 0, segs = 0
    for (const r of rendered) {
      polys += (r.polylines?.length || 0)
      for (const p of (r.polylines || [])) segs += Math.max(0, p.length - 1)
    }
    return { polys, segs }
  }, [rendered])

  // ViewBox + styling helpers
  // Tie SVG viewBox to previewZoom and pan, so zooming/panning affects the preview.
  const viewBox = useMemo(() => {
    const z = Math.max(0.2, Number(doc.previewZoom) || 1)
    const vw = doc.width / z
    const vh = doc.height / z
    let minX = Number(doc.previewPanX) || 0
    let minY = Number(doc.previewPanY) || 0
    // Clamp within document bounds
    minX = Math.max(0, Math.min(Math.max(0, doc.width - vw), minX))
    minY = Math.max(0, Math.min(Math.max(0, doc.height - vh), minY))
    return `${minX} ${minY} ${vw} ${vh}`
  }, [doc.width, doc.height, doc.previewZoom, doc.previewPanX, doc.previewPanY])
  const gcodeChipStyle = useMemo(() => ({ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(2px)' }), [])
  // Grid colors and lines
  const gridDotColor = useMemo(() => {
    // Simple luminance check on app background to pick contrasting grid
    const hex = String(doc.appBg || '#1f2937').replace('#','')
    const r = parseInt(hex.slice(0,2), 16) || 31
    const g = parseInt(hex.slice(2,4), 16) || 41
    const b = parseInt(hex.slice(4,6), 16) || 55
    const lum = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255)
    return lum < 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)'
  }, [doc.appBg])
  const gridData = useMemo(() => {
    if (!doc.showGrid) return null
    const step = Math.max(2, Number(doc.gridSizePx) || 12)
    const vx = []
    const hy = []
    for (let x = 0; x <= doc.width + 1e-6; x += step) vx.push(Math.round(x))
    for (let y = 0; y <= doc.height + 1e-6; y += step) hy.push(Math.round(y))
    // Ensure edges are present
    if (vx[0] !== 0) vx.unshift(0)
    if (vx[vx.length-1] !== doc.width) vx.push(doc.width)
    if (hy[0] !== 0) hy.unshift(0)
    if (hy[hy.length-1] !== doc.height) hy.push(doc.height)
    return { vx, hy }
  }, [doc.showGrid, doc.gridSizePx, doc.width, doc.height])

  // Length and time estimate for G-code panel
  const lengthEstimate = useMemo(() => {
    if (progressVisible && lastEstimateRef.current) return lastEstimateRef.current
    // Planned polylines across all visible layers in order
    const plannedAll = []
    for (const entry of rendered) {
      if (!entry?.layer?.visible) continue
      const planned = applyPathPlanning(entry.polylines || [], doc, doc.optimizeJoin)
      for (const p of planned) plannedAll.push(p)
    }
    const dist = (a,b) => Math.hypot((b[0]-a[0])||0, (b[1]-a[1])||0)
    let drawLen = 0
    for (const poly of plannedAll) {
      for (let i=0;i<(poly.length-1);i++) drawLen += dist(poly[i], poly[i+1])
    }
    let travelLen = 0
    for (let i=0;i<(plannedAll.length-1);i++) {
      const A = plannedAll[i], B = plannedAll[i+1]
      if (A.length && B.length) travelLen += dist(A[A.length-1], B[0])
    }
    const totalLen = drawLen + travelLen
    const feed = Math.max(1, Number(doc.feed)||1800)
    const travel = Math.max(1, Number(doc.travel)||3000)
    const drawMin = drawLen / feed
    const travelMin = travelLen / travel
    const totalMin = drawMin + travelMin
    const fmt = (mins) => {
      const m = Math.floor(mins)
      const s = Math.round((mins - m) * 60)
      if (m >= 60) {
        const h = Math.floor(m / 60)
        const mm = m % 60
        return `${h}h ${mm}m`
      }
      return `${m}m ${s}s`
    }
    const penLifts = Math.max(0, plannedAll.length - 1)
    const est = { drawLen, travelLen, totalLen, drawMin, travelMin, totalMin, fmt, penLifts }
    lastEstimateRef.current = est
    return est
  }, [progressVisible, rendered, doc.optimizeJoin, doc.feed, doc.travel])

  // Clip overlays for picking closed polygons on a source layer
  const makeClipPolysLocal = (polys) => {
    const dist2 = (a, b) => { const dx = a[0]-b[0], dy = a[1]-b[1]; return dx*dx+dy*dy }
    const isClosed = (p, eps2 = 0.64) => p.length>=3 && dist2(p[0], p[p.length-1]) <= eps2
    const out = []
    for (const p of (polys||[])) {
      if (!p || p.length < 2) continue
      if (isClosed(p)) { const q = p.slice(); if (dist2(q[0], q[q.length-1])>1e-6) q.push(q[0]); if (q.length>=4) out.push(q) }
      else if (p.length >= 3) { const q = p.slice(); if (dist2(q[0], q[q.length-1])>1e-6) q.push(q[0]); if (q.length>=4) out.push(q) }
    }
    // Sort by centroid for stable indices
    const centroid = (poly) => {
      let a = 0, cx = 0, cy = 0
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const x0 = poly[j][0], y0 = poly[j][1]
        const x1 = poly[i][0], y1 = poly[i][1]
        const f = (x0 * y1 - x1 * y0)
        a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
      }
      a *= 0.5
      if (Math.abs(a) < 1e-6) return [poly[0][0], poly[0][1]]
      return [cx / (6 * a), cy / (6 * a)]
    }
    out.sort((A,B)=>{
      const ca = centroid(A), cb = centroid(B)
      if (Math.abs(ca[0]-cb[0]) > 1e-6) return ca[0] - cb[0]
      if (Math.abs(ca[1]-cb[1]) > 1e-6) return ca[1] - cb[1]
      const area = (poly) => { let s=0; for (let i=0,j=poly.length-1;i<poly.length;j=i++) { s += (poly[j][0]*poly[i][1] - poly[i][0]*poly[j][1]) } return Math.abs(s*0.5) }
      return area(A) - area(B)
    })
    return out
  }

  const clipOverlays = useMemo(() => {
    if (!picker.active || !picker.targetLayerId) return []
    const target = layers.find(l => l.id === picker.targetLayerId)
    if (!target) return []
    // Find source layer polylines based on target clip settings
    let srcEntry = null
    if (target.params?.clipLayerId) {
      srcEntry = rendered.find(r => r.layer.id === target.params.clipLayerId)
    } else if (target.params?.clipToPrevious) {
      const idx = layers.findIndex(l => l.id === target.id)
      if (idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          const r = rendered.find(rr => rr.layer.id === layers[i].id)
          if (r && r.layer.visible && (r.polylines?.length)) { srcEntry = r; break }
        }
      }
    }
    if (!srcEntry) return []
    const closed = makeClipPolysLocal(srcEntry.polylines || [])
    const labels = closed.map((poly, idx) => {
      let a=0,cx=0,cy=0
      for (let i=0,j=poly.length-1;i<poly.length;j=i++) { const x0=poly[j][0],y0=poly[j][1],x1=poly[i][0],y1=poly[i][1]; const f=(x0*y1-x1*y0); a+=f; cx+=(x0+x1)*f; cy+=(y0+y1)*f }
      a*=0.5; const c = Math.abs(a)<1e-6 ? [poly[0][0],poly[0][1]] : [cx/(6*a), cy/(6*a)]
      return { idx, c }
    })
    return [{ layerId: target.id, sourceLayerId: srcEntry.layer.id, polys: closed, labels }]
  }, [picker, layers, rendered])

  // Transform overlay (computed when manipulating an svgImport layer) — not active by default
  const transformOverlay = null

  const downloadGcode = () => {
  setSaveMessage('Preparing G-code...');
  setIsSaving(true);
  setSaveProgress(0);
  showToast('Preparing G-code...')

  setTimeout(async () => {
    try {
      const zip = new JSZip()
      const full = renderAll(layers, doc, mdiCache, bitmaps, 1)

      const exporter = getExporter(doc.exportMode || 'layers')
      const files = exporter({ entries: full, doc, applyPathPlanning, toGcode })
      for (const f of files) {
        if (!f || !f.name) continue
        zip.file(f.name, f.content || '')
      }

      setSaveMessage('Zipping G-code...');
      const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setSaveProgress(metadata.percent)
      })
      setSaveMessage('Saving file...');
      saveAs(blob, `gcode_${doc.seed}.zip`)
      showToast('G-code saved')
    } catch (e) {
      console.error('G-code export failed', e)
      showToast('G-code export failed')
    } finally {
      setIsSaving(false)
    }
  }, 16)
}


  const downloadLayerSvg = (layerId) => {
    setSaveMessage('Saving SVG...')
    setIsSaving(true)
    setSaveProgress(0)
    setTimeout(async () => {
      try {
        const full = renderAll(layers, doc, mdiCache, bitmaps, 1)
        const entry = full.find(e => e.layer.id === layerId)
        if (!entry) throw new Error('Layer not found')
        const planned = applyPathPlanning(entry.polylines, doc, doc.optimizeJoin)
        const d = planned.map(polylineToPath).join(' ')
        const svg = buildSVG({ width: doc.width, height: doc.height, bleed: doc.bleed, paths: [{ d, stroke: entry.layer.color, strokeWidth: doc.strokeWidth }] })
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        setSaveMessage('Saving file...')
        saveAs(blob, `${entry.layer.name.replace(/\s+/g, '_')}.svg`)
        showToast('Layer SVG saved')
      } catch (e) {
        console.error('SVG export failed', e)
        showToast('SVG export failed')
      } finally {
        setIsSaving(false)
      }
    }, 16)
  }

  // Fit-to-content utilities
  const boundsOfPolys = (polys) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let count = 0
    for (const p of polys) {
      for (const [x,y] of p) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        count++
      }
    }
    return count ? { minX, minY, maxX, maxY } : null
  }

  const fitBounds = (b) => {
    if (!b) { fitPreview(true); return }
    const cont = stageRef.current
    if (!cont) return
    const cw = cont.clientWidth, ch = cont.clientHeight
    const padPx = 24
    const availW = Math.max(1, cw - padPx)
    const availH = Math.max(1, ch - padPx)
    const w = Math.max(1e-6, b.maxX - b.minX)
    const h = Math.max(1e-6, b.maxY - b.minY)
    let z = Math.min(availW / w, availH / h)
    if (!doc.previewUpscale) z = Math.min(1, z)
    z = Math.max(0.2, Math.min(8, z))
    const vw = doc.width / z
    const vh = doc.height / z
    let minX = b.minX - (vw - w) / 2
    let minY = b.minY - (vh - h) / 2
    minX = Math.max(0, Math.min(doc.width - vw, minX))
    minY = Math.max(0, Math.min(doc.height - vh, minY))
    setDoc(d => ({ ...d, previewZoom: z, previewPanX: minX, previewPanY: minY, previewAutoFit: false }))
  }

  const fitToContent = () => {
    const all = rendered.flatMap(r => r.layer.visible ? r.polylines : [])
    const b = boundsOfPolys(all)
    fitBounds(b)
  }

  // Saved view presets (A/B) helpers
  const saveView = (slot) => {
    try {
      const data = {
        z: Math.max(0.2, Math.min(8, Number(doc.previewZoom) || 1)),
        x: Number(doc.previewPanX) || 0,
        y: Number(doc.previewPanY) || 0
      }
      localStorage.setItem(`plotterlab:view:${slot}`, JSON.stringify(data))
      showToast(`View saved ${slot.toUpperCase()}`)
    } catch {}
  }
  const loadView = (slot) => {
    try {
      const raw = localStorage.getItem(`plotterlab:view:${slot}`)
      if (!raw) { showToast(`No view saved ${slot.toUpperCase()}`); return }
      const v = JSON.parse(raw)
      if (!v || !Number.isFinite(v.z)) { showToast('Invalid saved view'); return }
      setDoc(d => ({
        ...d,
        previewZoom: Math.max(0.2, Math.min(8, Number(v.z) || 1)),
        previewPanX: Number(v.x) || 0,
        previewPanY: Number(v.y) || 0,
        previewAutoFit: false
      }))
      showToast(`View loaded ${slot.toUpperCase()}`)
    } catch {}
  }

  const fitToLayer = (layerId) => {
    const entry = rendered.find(r => r.layer.id === layerId && r.layer.visible)
    const b = entry ? boundsOfPolys(entry.polylines) : null
    fitBounds(b)
  }

  // Start preset helper (supports asymmetric margins)
  const computeStart = (name, width, height, marginX, marginY, useMargin) => {
    const mx = Number.isFinite(marginX) ? marginX : 0
    const my = Number.isFinite(marginY) ? marginY : 0
    const minX = useMargin ? mx : 0
    const minY = useMargin ? my : 0
    const maxX = useMargin ? (width - mx) : width
    const maxY = useMargin ? (height - my) : height
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2
    let x = minX, y = minY
    switch (name) {
      case 'top-left': x = minX; y = minY; break
      case 'top-center': x = midX; y = minY; break
      case 'top-right': x = maxX; y = minY; break
      case 'center-left': x = minX; y = midY; break
      case 'center': x = midX; y = midY; break
      case 'center-right': x = maxX; y = midY; break
      case 'bottom-left': x = minX; y = maxY; break
      case 'bottom-center': x = midX; y = maxY; break
      case 'bottom-right': x = maxX; y = maxY; break
      default: break
    }
    return { x, y }
  }

  const applyPaperSize = (key) => {
    if (!key || key === 'custom') { setDoc(d=>({ ...d, paperSize: 'custom' })); return }
    const ps = paperOptions.find(p => p.key === key)
    if (!ps || !ps.w || !ps.h) return
    const landscape = (doc.orientation || 'landscape') === 'landscape'
    let w = ps.w, h = ps.h
    if (landscape && w < h) { const t = w; w = h; h = t }
    if (!landscape && w > h) { const t = w; w = h; h = t }
    setDoc(d => {
      const usePreset = d.startPreset && d.startPreset !== 'custom'
      if (!usePreset) return { ...d, width: w, height: h, paperSize: key }
      const { x, y } = computeStart(d.startPreset, w, h, (Number.isFinite(d.marginX)?d.marginX:d.margin), (Number.isFinite(d.marginY)?d.marginY:d.margin), d.startUseMargin)
      return { ...d, width: w, height: h, paperSize: key, startX: x, startY: y }
    })
  }

  const applyOrientation = (ori) => {
    setDoc(d => {
      const next = { ...d, orientation: ori }
      if (d.paperSize && d.paperSize !== 'custom') {
        const ps = paperOptions.find(p => p.key === d.paperSize)
        if (ps && ps.w && ps.h) {
          const w = ori === 'landscape' ? Math.max(ps.w, ps.h) : Math.min(ps.w, ps.h)
          const h = ori === 'landscape' ? Math.min(ps.w, ps.h) : Math.max(ps.w, ps.h)
          if (d.startPreset && d.startPreset !== 'custom') {
            const { x, y } = computeStart(d.startPreset, w, h, (Number.isFinite(d.marginX)?d.marginX:d.margin), (Number.isFinite(d.marginY)?d.marginY:d.margin), d.startUseMargin)
            return { ...next, width: w, height: h, startX: x, startY: y }
          }
          return { ...next, width: w, height: h }
        }
      } else {
        // custom size: swap if needed
        const needsSwap = (ori === 'landscape' && d.width < d.height) || (ori === 'portrait' && d.width > d.height)
        if (needsSwap) {
          const w = d.height, h = d.width
          if (d.startPreset && d.startPreset !== 'custom') {
            const { x, y } = computeStart(d.startPreset, w, h, (Number.isFinite(d.marginX)?d.marginX:d.margin), (Number.isFinite(d.marginY)?d.marginY:d.margin), d.startUseMargin)
            return { ...next, width: w, height: h, startX: x, startY: y }
          }
          return { ...next, width: w, height: h }
        }
      }
      return next
    })
  }

  const applyStartPreset = (name, useMarginOverride = null) => {
    setDoc(d => {
      const useMargin = (useMarginOverride !== null) ? !!useMarginOverride : !!d.startUseMargin
      const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
      const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
      const minX = useMargin ? mx : 0
      const minY = useMargin ? my : 0
      const maxX = useMargin ? (d.width - mx) : d.width
      const maxY = useMargin ? (d.height - my) : d.height
      const midX = (minX + maxX) / 2
      const midY = (minY + maxY) / 2
      let x = minX, y = minY
      switch (name) {
        case 'top-left': x = minX; y = minY; break
        case 'top-center': x = midX; y = minY; break
        case 'top-right': x = maxX; y = minY; break
        case 'center-left': x = minX; y = midY; break
        case 'center': x = midX; y = midY; break
        case 'center-right': x = maxX; y = midY; break
        case 'bottom-left': x = minX; y = maxY; break
        case 'bottom-center': x = midX; y = maxY; break
        case 'bottom-right': x = maxX; y = maxY; break
        default: break
      }
      const next = { ...d, startX: x, startY: y, startPreset: name }
      if (useMarginOverride !== null) next.startUseMargin = useMargin
      return next
    })
  }

  return (
    <div className="h-screen overflow-hidden grid grid-cols-[minmax(320px,380px)_1fr] lg:grid-cols-[minmax(360px,420px)_1fr] gap-0">
      <aside className={`bg-panel border-r border-white/5 p-4 h-screen overflow-y-auto ui-super`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold tracking-wide">Plotter Lab</h1>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            className={`btn ${uiTab==='tools' ? 'bg-white/10 border-white/30' : ''}`}
            onClick={()=>{ setUiTab('tools'); showToast('Tools') }}
            title="Tools"
          >Tools</button>
          <button
            className={`btn ${uiTab==='layers' ? 'bg-white/10 border-white/30' : ''}`}
            onClick={()=>{ setUiTab('layers'); showToast('Layers') }}
            title="Layers"
          >Layers</button>
        </div>
        {/* Progress pill moved into stage container (see below) */}

        {uiTab==='tools' && (
        <section className="space-y-3">
          <ToolsPanel
            compactUI={compactUI}
            superCompact={superCompact}
            doc={doc}
            setDoc={setDoc}
            labelClass={labelClass}
            paperOptions={paperOptions}
            paperFavorites={paperFavorites}
            saveCurrentPaperAs={saveCurrentPaperAs}
            deleteCurrentCustomPaper={deleteCurrentCustomPaper}
            toggleFavoritePaper={toggleFavoritePaper}
            applyPaperSize={applyPaperSize}
            applyOrientation={applyOrientation}
            computeStart={computeStart}
            numEdit={numEdit}
            setNumEdit={setNumEdit}
            regenerateSeed={regenerateSeed}
          />

          <ExamplesPanel
            compactUI={compactUI}
            onLoadExample={loadExample}
          />

          <ImportPanel
            compactUI={compactUI}
            imageRef={imageRef}
            onImageFilePicked={onImageFilePicked}
            photoRef={photoRef}
            onPhotoSelected={onPhotoSelected}
            onPickPhoto={onPickPhoto}
          />

          <ExportPanel
  compactUI={compactUI}
  exportMode={doc.exportMode}
  onChangeExportMode={(v)=>setDoc(d=>({...d,exportMode:v}))}
  onDownloadSVGs={downloadSVGs}
  onDownloadGcode={downloadGcode}
  onExportPreset={exportPreset}
  onOpenImport={openImport}
  fileRef={fileRef}
  onHandleImport={handleImport}
/>
{doc.exportMode === 'combined' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" checked={doc.pauseCombined ?? true} onChange={e=>setDoc(d=>({...d,pauseCombined:e.target.checked}))} />
                  Pause between layers
                </label>
                <label className="flex flex-col gap-1">
                  Pause G-code
                  <input className="input" value={doc.pauseCode ?? 'M0'} onChange={e=>setDoc(d=>({...d,pauseCode:e.target.value}))}/>
                </label>
                <label className="flex flex-col gap-1">
                  Pause Message
                  <input className="input" value={doc.pauseMessage ?? 'Change pen to <color>'} onChange={e=>setDoc(d=>({...d,pauseMessage:e.target.value}))}/>
                </label>
              </div>
            )}
        </section>
        )}

        {uiTab==='layers' && (
  <LayersPanel
    compactUI={compactUI}
    layers={layers}
    GENERATORS={GENERATORS}
    COLOR_OPTIONS={COLOR_OPTIONS}
    labelClass={labelClass}
    labelRowClass={labelRowClass}
    layerMenuId={layerMenuId}
    bitmaps={bitmaps}
    toggleVisible={toggleVisible}
    addLayer={addLayer}
    removeLayer={removeLayer}
    moveLayer={moveLayer}
    setAllLayersCollapsed={setAllLayersCollapsed}
    setLayers={setLayers}
    fitToLayer={fitToLayer}
    openImageForLayer={openImageForLayer}
    clearLayerImage={clearLayerImage}
    renderNumParam={renderNumParam}
    isGroupOpen={isGroupOpen}
    toggleGroup={toggleGroup}
    downloadLayerSvg={downloadLayerSvg}
    setLayerMenuId={setLayerMenuId}
    isoPresetValues={isoPresetValues}
    qcPresetValues={qcPresetValues}
    superPresetValues={superPresetValues}
    fitIsoSeparation={fitIsoSeparation}
    picker={picker}
    setPicker={setPicker}
    transform={transform}
    setTransform={setTransform}
    numEdit={numEdit}
    setNumEdit={setNumEdit}
  />
)}
      </aside>

      <main className="p-4 h-screen overflow-hidden flex flex-col" style={{ background: doc.appBg }}>
        <div ref={stageRef} className={`min-h-[360px] rounded-xl shadow-soft flex-1 flex items-start justify-center relative select-none overscroll-contain overflow-hidden ${ (spaceDown || isPanning) ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' } ${doc.showGrid ? 'bg-grid' : ''}`}
          style={{ backgroundColor: doc.appBg, backgroundSize: doc.showGrid ? `${doc.gridSizePx || 12}px ${doc.gridSizePx || 12}px` : undefined, '--grid-color': gridDotColor }}
          onWheel={onWheelPreview} onWheelCapture={onWheelPreview}>
          <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur rounded-md px-2 py-1 flex items-center gap-2">
            <button className="btn" onClick={()=>setDoc(d=>({...d, previewZoom: Math.max(0.2, (d.previewZoom||1)*0.9), previewAutoFit: false}))}>-</button>
            <input type="range" min="0.2" max="8" step="0.05" value={doc.previewZoom||1} onChange={e=>setDoc(d=>({...d, previewZoom: +e.target.value, previewAutoFit: false}))}/>
            <button className="btn" onClick={()=>setDoc(d=>({...d, previewZoom: Math.min(8, (d.previewZoom||1)*1.1), previewAutoFit: false}))}>+</button>
            <button className="btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Icon path={mdiUndo}/> {compactUI? null : 'Undo'}
            </button>
            <button className="btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              <Icon path={mdiRedo}/> {compactUI? null : 'Redo'}
            </button>
            <button className="btn" onClick={()=>{ setDoc(d=>({...d, previewZoom: 1, previewPanX: 0, previewPanY: 0, previewAutoFit: false })); showToast('View reset') }} title="Reset view">
              <Icon path={mdiRefresh}/> {compactUI? null : 'Reset'}
            </button>
            <button className="btn" onClick={()=>fitPreview(true)} title="Fit to page"><Icon path={mdiFitToPageOutline}/> {compactUI? null : 'Fit'}</button>
            <button className="btn" onClick={fitToContent} title="Fit to content"><Icon path={mdiSelectAll}/> {compactUI? null : 'Content'}</button>
            <select
              className="input text-xs py-1 px-2"
              value={viewPresetSel}
              onChange={e=>{
                const v = e.target.value
                setViewPresetSel(v)
                if (v === 'one') {
                  setDoc(d=>({ ...d, previewZoom: 1, previewPanX: 0, previewPanY: 0, previewAutoFit: false }));
                  showToast('1:1 view')
                } else if (v === 'fit') {
                  fitPreview(true)
                } else if (v === 'content') {
                  fitToContent()
                } else if (v === 'saveA') {
                  saveView('a')
                } else if (v === 'loadA') {
                  loadView('a')
                } else if (v === 'saveB') {
                  saveView('b')
                } else if (v === 'loadB') {
                  loadView('b')
                }
                // Reset selection back to placeholder
                setTimeout(()=>setViewPresetSel(''), 0)
              }}
              title="View presets and slots"
            >
              <option value="">Presets</option>
              <option value="one">1:1</option>
              <option value="fit">Fit Page</option>
              <option value="content">Fit Content</option>
              <option value="saveA">Save A</option>
              <option value="loadA">Load A</option>
              <option value="saveB">Save B</option>
              <option value="loadB">Load B</option>
            </select>
            <label className="flex items-center gap-1 text-xs opacity-80">
              <input type="checkbox" checked={!!doc.previewAutoFit} onChange={e=>setDoc(d=>({...d, previewAutoFit: e.target.checked}))} />
              Auto
            </label>
            <label className="flex items-center gap-1 text-xs opacity-80">
              <input type="checkbox" checked={!!doc.previewUpscale} onChange={e=>setDoc(d=>({...d, previewUpscale: e.target.checked}))} />
              Upscale
            </label>
            <label className="flex items-center gap-1 text-xs opacity-80">
              <input type="checkbox" checked={!!doc.showGrid} onChange={e=>setDoc(d=>({...d, showGrid: e.target.checked}))} />
              Grid
            </label>
            {doc.showGrid && (
              <div className="flex items-center gap-2 text-xs opacity-80">
                <span>Grid</span>
                <input type="range" min="6" max="30" step="1" value={doc.gridSizePx || 12} onChange={e=>setDoc(d=>({...d, gridSizePx: +e.target.value}))} />
              </div>
            )}
            
            {anyQc && (
              <div className="flex items-center gap-1 pl-2 ml-1 border-l border-white/10">
                <button className="btn" title={anyQcAnimating? 'Pause phase animation' : 'Play phase animation'} onClick={toggleQcAnimate}>
                  {anyQcAnimating ? '⏸' : '▶'}
                </button>
                <button className="btn" title="Reset phase to 0" onClick={resetQcPhase}><Icon path={mdiRefresh}/> {compactUI? null : 'Reset'}</button>
              </div>
            )}
            <div className="flex items-center gap-1 pl-2 ml-1 border-l border-white/10">
              <button className="btn" title="Reload generators" onClick={reloadGenerators} disabled={loadingPlugins}>
                <Icon path={mdiRefresh}/> {compactUI ? null : (loadingPlugins ? 'Reloading…' : 'Reload')}
              </button>
            </div>
            {picker.active && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/10">Pick: click to select • Shift+Click to add/remove</span>
            )}
            {/* Progress UI moved out of toolbar to avoid interfering with sliders */}
            <button className="btn" title={doc.showToolpathControls? 'Hide G-code settings' : 'Show G-code settings'} onClick={()=>setDoc(d=>({...d, showToolpathControls: !d.showToolpathControls}))}>
              {doc.showToolpathControls ? 'Hide G-code ↓' : 'G-code ↑'}
            </button>
          </div>
          {/* Stats overlay: polyline and segment counts */}
          <div className="absolute top-12 right-2 z-10 bg-black/55 backdrop-blur rounded-md px-2 py-1 text-xs border border-white/10">
            <span className="opacity-80">Polys</span> {statsCounts.polys} <span className="opacity-80">• Segs</span> {statsCounts.segs}
          </div>
          {/* Toast notification */}
          {toast && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-md text-sm border shadow-soft"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(2px)' }}
            >
              {toast}
            </div>
          )}
          {/* Bottom-right quick toggle for G-code panel (primary) */}
          <div className="absolute bottom-2 right-2 z-20">
            <button
              className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm border shadow-soft"
              style={gcodeChipStyle}
              title={doc.showToolpathControls ? 'Hide G-code settings' : 'Show G-code settings'}
              onClick={()=>setDoc(d=>({...d, showToolpathControls: !d.showToolpathControls}))}
            >
              {doc.showToolpathControls ? 'Hide G-code ↓' : 'G-code ↑'}
            </button>
          </div>
          {/* Keyboard help toggle chip */}
          <div className="absolute bottom-2 left-2 z-20">
            <button
              className="inline-flex items-center justify-center rounded-md w-7 h-7 text-sm border"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(2px)' }}
              title={showHelp ? 'Hide keyboard shortcuts (H)' : 'Show keyboard shortcuts (H)'}
              onClick={()=>setShowHelp(v=>!v)}
              ref={helpBtnRef}
            >
              ?
            </button>
          </div>
          {showHelp && (
            <div ref={helpRef} className="absolute bottom-12 left-2 z-20 p-3 rounded-md border shadow-soft text-xs fade-in w-[280px]"
                 style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)' }}>
              <div className="font-medium mb-2">Shortcuts</div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <div className="text-[11px] opacity-80 flex items-center gap-1 mb-1"><Icon path={mdiCrosshairsGps}/> <span>View & Zoom</span></div>
                  <ul className="space-y-0.5">
                    <li>F — Fit preview</li>
                    <li>C — Fit to content</li>
                    <li>+ / - — Zoom</li>
                    <li>0 — Reset zoom</li>
                    <li>Space — Hold to pan</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] opacity-80 flex items-center gap-1 mb-1"><Icon path={mdiLightbulbOutline}/> <span>Panels & Help</span></div>
                  <ul className="space-y-0.5">
                    <li>G — Toggle G-code panel</li>
                    <li>H / ? — Toggle this help</li>
                    <li>Esc — Close help</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] opacity-80 flex items-center gap-1 mb-1"><Icon path={mdiLayersOutline}/> <span>Layers & Picking</span></div>
                  <ul className="space-y-0.5">
                    <li>Click label or outline to pick a clip index</li>
                    <li>Shift+Click — Add/Remove selection</li>
                    <li>Esc — Exit picking mode</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* Progress pill inside stage (top-left) */}
          {progressVisible && (
            <div className="absolute top-2 left-2 z-20 bg-black/65 backdrop-blur rounded-md px-2 py-1 flex items-center gap-2 text-xs border border-white/10">
              <span className="px-2 py-0.5 rounded bg-white/10"
                title={previewDetail ? `Layer ${previewDetail.idx}/${previewDetail.total} — ${previewDetail.layerName || ''}` : undefined}>
                Rendering… {Math.floor(previewProgress * 100)}%
                {previewDetail && Number.isFinite(previewDetail.idx) && Number.isFinite(previewDetail.total) && (
                  <> · {previewDetail.idx}/{previewDetail.total}</>
                )}
                {previewDetail && previewDetail.layerName ? (
                  <> — {previewDetail.layerName}</>
                ) : null}
              </span>
              <button className="btn" title="Restart preview rendering" onClick={resetPreview}><Icon path={mdiRefresh}/> {compactUI? null : 'Reset'}</button>
              <button className="btn" title="Cancel preview rendering" onClick={cancelPreview}><Icon path={mdiClose}/> {compactUI? null : 'Cancel'}</button>
            </div>
          )}
          {isSaving && (
            <div className="absolute top-2 left-2 z-20 bg-black/65 backdrop-blur rounded-md px-2 py-1 flex items-center gap-2 text-xs border border-white/10">
              <span className="px-2 py-0.5 rounded bg-white/10">
                {saveMessage || 'Saving...'} {saveProgress > 0 && `${Math.floor(saveProgress)}%`}
              </span>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full block" viewBox={viewBox}
            onMouseDown={onMouseDownPreview}>
            <rect x="0" y="0" width={doc.width} height={doc.height} fill={doc.bg} />
            {/* SVG grid overlay for precise alignment; drawn on top of paper rect */}
            {doc.showGrid && gridData && (
              <g opacity="0.45">
                {gridData.vx.map((x,i)=> (
                  <line key={`gx${i}`} x1={x} y1={0} x2={x} y2={doc.height} stroke={gridDotColor} strokeWidth={x===0||x===doc.width?1.25:0.6} />
                ))}
                {gridData.hy.map((y,i)=> (
                  <line key={`gy${i}`} x1={0} y1={y} x2={doc.width} y2={y} stroke={gridDotColor} strokeWidth={y===0||y===doc.height?1.25:0.6} />
                ))}
              </g>
            )}
            {doc.showPaperBorder && (
              <rect x="0.5" y="0.5" width={Math.max(0, doc.width - 1)} height={Math.max(0, doc.height - 1)} fill="none" stroke={doc.paperBorderColor} strokeWidth={0.8} />
            )}
            {doc.showMarginBorder && (Number(doc.marginX ?? doc.margin) > 0 || Number(doc.marginY ?? doc.margin) > 0) && (()=>{
              const mx = Number.isFinite(Number(doc.marginX)) ? Number(doc.marginX) : Number(doc.margin)||0
              const my = Number.isFinite(Number(doc.marginY)) ? Number(doc.marginY) : Number(doc.margin)||0
              return (
                <rect x={mx + 0.5} y={my + 0.5} width={Math.max(0, doc.width - 2*mx - 1)} height={Math.max(0, doc.height - 2*my - 1)} fill="none" stroke={doc.marginBorderColor} strokeWidth={0.8} strokeDasharray="6 4" />
              )
            })()}
            {svgPaths.map(({layer,d}) => layer.visible && (
              <path key={layer.id} d={d} fill="none" stroke={layer.color} strokeWidth={doc.strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
            ))}
            {doc.showTravel && travelD && (
              <path d={travelD} fill="none" stroke={doc.travelColor} strokeWidth={Math.max(0.4, doc.strokeWidth*0.6)} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {doc.showStart && Number.isFinite(doc.startX) && Number.isFinite(doc.startY) && (
              <g pointerEvents="none">
                <circle cx={doc.startX} cy={doc.startY} r={4.5} fill={doc.startMarkerColor} stroke="#000" strokeWidth={1} />
                <path d={`M ${doc.startX-8} ${doc.startY} L ${doc.startX+8} ${doc.startY}`} stroke={doc.startMarkerColor} strokeWidth={1.2} />
                <path d={`M ${doc.startX} ${doc.startY-8} L ${doc.startX} ${doc.startY+8}`} stroke={doc.startMarkerColor} strokeWidth={1.2} />
                <text x={doc.startX+10} y={doc.startY-8} fill={doc.startMarkerColor} fontSize="8" fontWeight="600">S</text>
              </g>
            )}
            {doc.showOrderNumbers && overlayOrder.length > 0 && overlayOrder.map((poly, idx) => (
              poly.length ? (
                <g key={`n${idx}`}>
                  <circle cx={poly[0][0]} cy={poly[0][1]} r={4} fill={doc.orderNumberColor} opacity={0.8} />
                  <text x={poly[0][0]} y={poly[0][1]} fill="#000" fontSize="6" textAnchor="middle" dominantBaseline="central">{idx+1}</text>
                </g>
              ) : null
            ))}
            {transformOverlay && (
              <g>
                <rect x={transformOverlay.b.minX} y={transformOverlay.b.minY}
                  width={Math.max(0, transformOverlay.b.maxX - transformOverlay.b.minX)}
                  height={Math.max(0, transformOverlay.b.maxY - transformOverlay.b.minY)}
                  fill="none" stroke="#22c55e" strokeWidth={0.8} strokeDasharray="6 4" />
                {/* Corner scale handles */}
                {[[transformOverlay.b.minX, transformOverlay.b.minY], [transformOverlay.b.maxX, transformOverlay.b.minY], [transformOverlay.b.maxX, transformOverlay.b.maxY], [transformOverlay.b.minX, transformOverlay.b.maxY]].map(([hx,hy],i)=> (
                  <rect key={`h${i}`} x={hx-2.5} y={hy-2.5} width={5} height={5} fill="#22c55e" stroke="#000" strokeWidth={0.5} />
                ))}
                {/* Rotation handle */}
                <line x1={(transformOverlay.b.minX+transformOverlay.b.maxX)/2} y1={transformOverlay.b.minY}
                      x2={transformOverlay.rot[0]} y2={transformOverlay.rot[1]} stroke="#22c55e" strokeWidth={0.8} />
                <circle cx={transformOverlay.rot[0]} cy={transformOverlay.rot[1]} r={3} fill="#22c55e" stroke="#000" strokeWidth={0.6} />
                {/* Center point */}
                <circle cx={transformOverlay.cx} cy={transformOverlay.cy} r={2} fill="#22c55e" />
              </g>
            )}
            {clipOverlays.map((ov, k) => (
              <g key={`clipov_${ov.layerId}_${k}`}>
                {/* Outline all clip polygons for the source layer (clickable) */}
                {ov.polys && ov.polys.map((p, i) => (
                  <path key={`poly_${i}`} d={polylineToPath(p)} fill="none"
                        stroke={ov.selectedIdx?.includes(i) ? '#22d3ee' : '#94a3b8'}
                        strokeWidth={ov.selectedIdx?.includes(i) ? 1.6 : 0.8}
                        strokeDasharray={ov.selectedIdx?.includes(i) ? '0' : '4 3'}
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(ev)=>{ ev.preventDefault(); ev.stopPropagation(); toggleClipIndexForLayer(ov.layerId, ov.sourceLayerId, i, ev.shiftKey) }} />
                ))}
                {/* Labels (clickable) */}
                {ov.labels.map(lab => (
                  <g key={`lab_${lab.idx}`} style={{ cursor: 'pointer' }}
                     onMouseDown={(ev)=>{ ev.preventDefault(); ev.stopPropagation(); toggleClipIndexForLayer(ov.layerId, ov.sourceLayerId, lab.idx, ev.shiftKey) }}>
                    <circle cx={lab.c[0]} cy={lab.c[1]} r={5} fill="#e5e7eb" opacity={0.9} />
                    <text x={lab.c[0]} y={lab.c[1]} fill="#000" fontSize="6.2" textAnchor="middle" dominantBaseline="central">{lab.idx}</text>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
        {/* Toolpath Controls (sticky footer, collapsible) */}
        {doc.showToolpathControls && (
        <div className="sticky bottom-0 z-20 bg-panel/70 backdrop-blur-sm border-t border-white/10 p-3 mt-4 rounded-t-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-80">G-code Settings</h3>
            <button className="btn" onClick={()=>setDoc(d=>({...d, showToolpathControls: false}))}>Hide G-code settings ↓</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          <label className="flex flex-col gap-1">Feed (mm/min)
            <input className="input" type="number" value={doc.feed} onChange={e=>setDoc(d=>({...d,feed:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Travel (mm/min)
            <input className="input" type="number" value={doc.travel} onChange={e=>setDoc(d=>({...d,travel:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Start X
            <input className="input" type="number" step="0.1" value={doc.startX} onChange={e=>setDoc(d=>({...d,startX:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Start Y
            <input className="input" type="number" step="0.1" value={doc.startY} onChange={e=>setDoc(d=>({...d,startY:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Origin X (mm)
            <input className="input" type="number" step="0.1" value={Number(doc.originX)||0} onChange={e=>setDoc(d=>({...d,originX:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Origin Y (mm)
            <input className="input" type="number" step="0.1" value={Number(doc.originY)||0} onChange={e=>setDoc(d=>({...d,originY:+e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Start Preset
            <Select value={doc.startPreset} onChange={(v)=>applyStartPreset(v)}
              options={[
                {label:'Top Left',value:'top-left'},
                {label:'Top Center',value:'top-center'},
                {label:'Top Right',value:'top-right'},
                {label:'Center Left',value:'center-left'},
                {label:'Center',value:'center'},
                {label:'Center Right',value:'center-right'},
                {label:'Bottom Left',value:'bottom-left'},
                {label:'Bottom Center',value:'bottom-center'},
                {label:'Bottom Right',value:'bottom-right'}
              ]}
            />
            <div className="mt-1 text-[10px] opacity-75">
              Using: <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{doc.startUseMargin ? 'Margin' : 'Paper'}</span>
            </div>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.startUseMargin} onChange={e=>{ const v = e.target.checked; applyStartPreset(doc.startPreset, v) }} />
            Use Margin for Preset
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.showStart} onChange={e=>setDoc(d=>({...d,showStart:e.target.checked}))} />
            Show Start
          </label>
          <label className="flex flex-col gap-1">Start Color
            <input type="color" className="input" value={doc.startMarkerColor} onChange={e=>setDoc(d=>({...d,startMarkerColor:e.target.value}))}/>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.showTravel} onChange={e=>setDoc(d=>({...d,showTravel:e.target.checked}))}/>
            Show Travel
          </label>
          <label className="flex items-center gap-2" title="Clip output to the Margin box so both drawing and travel remain inside the margin area.">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={doc.clipOutput === 'margin'}
              onChange={e=>{
                const enabled = e.target.checked
                setDoc(d=>{
                  const next = { ...d, clipOutput: enabled ? 'margin' : 'none' }
                  if (enabled && d.startPreset === 'custom') {
                    const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                    const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                    const minX = mx, minY = my
                    const maxX = d.width - mx, maxY = d.height - my
                    next.startX = Math.max(minX, Math.min(maxX, d.startX))
                    next.startY = Math.max(minY, Math.min(maxY, d.startY))
                  }
                  return next
                })
                if (enabled && doc.startPreset && doc.startPreset !== 'custom') {
                  // Recompute preset start inside margin
                  applyStartPreset(doc.startPreset, true)
                }
              }}
            />
            Crop at Margin (clip output + travel)
          </label>
          <label className="flex flex-col gap-1">Travel Color
            <input type="color" className="input" value={doc.travelColor} onChange={e=>setDoc(d=>({...d,travelColor:e.target.value}))}/>
          </label>
          <label className="flex flex-col gap-1">Optimize
            <Select value={doc.optimize} onChange={v=>setDoc(d=>({...d,optimize:v}))}
              options={[{label:'Nearest Neighbor', value:'nearest'},{label:'Nearest + Improve', value:'nearest+improve'},{label:'Off', value:'none'}]}/>
          </label>
          <label className="flex items-center gap-2" title="Merge adjacent paths into a single continuous line to reduce pen-up/down movements.">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.optimizeJoin} onChange={e=>setDoc(d=>({...d,optimizeJoin:e.target.checked}))}/>
            Join Paths
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" checked={!!doc.showOrderNumbers} onChange={e=>setDoc(d=>({...d,showOrderNumbers:e.target.checked}))}/>
            Show Path #
          </label>
          <label className="flex flex-col gap-1"># Color
            <input type="color" className="input" value={doc.orderNumberColor} onChange={e=>setDoc(d=>({...d,orderNumberColor:e.target.value}))}/>
          </label>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">Pen Mode
              <Select value={doc.penMode} onChange={v=>setDoc(d=>({...d,penMode:v}))}
                options={[{label:'Z Axis (mm)',value:'z'},{label:'Servo / Macro Commands',value:'servo'}]} />
            </label>
            {doc.penMode === 'z' ? (
              <label className="flex flex-col gap-1">Safe Z
                <input className="input" type="number" step="0.1" value={doc.safeZ} onChange={e=>setDoc(d=>({...d,safeZ:+e.target.value}))}/>
              </label>
            ) : (
              <label className="flex flex-col gap-1">-</label>
            )}
          </div>
          {doc.penMode === 'z' ? (
            <>
              <label className="flex flex-col gap-1">Pen Up Z
                <input className="input" type="number" step="0.1" value={doc.penUp} onChange={e=>setDoc(d=>({...d,penUp:+e.target.value}))}/>
              </label>
              <label className="flex flex-col gap-1">Pen Down Z
                <input className="input" type="number" step="0.1" value={doc.penDown} onChange={e=>setDoc(d=>({...d,penDown:+e.target.value}))}/>
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1">Pen Up Cmd
                <input className="input" value={doc.servoUp} onChange={e=>setDoc(d=>({...d,servoUp:e.target.value}))}/>
              </label>
              <label className="flex flex-col gap-1">Pen Down Cmd
                <input className="input" value={doc.servoDown} onChange={e=>setDoc(d=>({...d,servoDown:e.target.value}))}/>
              </label>
              <label className="flex flex-col gap-1">Delay After Up (s)
                <input className="input" type="number" step="0.05" value={doc.delayAfterUp} onChange={e=>setDoc(d=>({...d,delayAfterUp:+e.target.value}))}/>
              </label>
              <label className="flex flex-col gap-1">Delay After Down (s)
                <input className="input" type="number" step="0.05" value={doc.delayAfterDown} onChange={e=>setDoc(d=>({...d,delayAfterDown:+e.target.value}))}/>
              </label>
            </>
          )}
          <div className="col-span-2 lg:col-span-4 rounded-lg p-3 bg-black/20 border border-white/5 flex flex-wrap gap-6 items-center">
            <div>
              <div className="text-xs opacity-70">Draw Length</div>
              <div className="font-medium">{lengthEstimate.drawLen.toFixed(0)} mm</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Travel Length</div>
              <div className="font-medium">{lengthEstimate.travelLen.toFixed(0)} mm</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Total Length</div>
              <div className="font-medium">{lengthEstimate.totalLen.toFixed(0)} mm</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Pen Lifts</div>
              <div className="font-medium">{lengthEstimate.penLifts}</div>
            </div>
            <div className="ml-auto">
              <div className="text-xs opacity-70">Estimated Time</div>
              <div className="font-medium">{lengthEstimate.fmt(lengthEstimate.totalMin)} <span className="opacity-70">(draw {lengthEstimate.fmt(lengthEstimate.drawMin)}, travel {lengthEstimate.fmt(lengthEstimate.travelMin)})</span></div>
            </div>
          </div>
          </div>
        </div>
        )}
      </main>

      {/* Utility classes live in styles.css */}
    </div>
  )
}
