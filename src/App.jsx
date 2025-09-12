import React, { useEffect, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { mdiContentSave, mdiPlus, mdiDelete, mdiEye, mdiEyeOff, mdiDownload, mdiShuffleVariant, mdiArrowUp, mdiArrowDown, mdiCrosshairsGps, mdiDotsVertical, mdiArrowCollapseVertical, mdiArrowExpandVertical, mdiFileDocumentOutline, mdiExportVariant, mdiLightbulbOutline, mdiLayersOutline, mdiLayersPlus, mdiStarPlus, mdiStar, mdiStarOutline, mdiSwapHorizontal, mdiFolderOpen, mdiRefresh, mdiClose, mdiImageMultipleOutline, mdiPalette, mdiFitToPageOutline, mdiSelectAll, mdiVectorSelection, mdiEraser, mdiStarOff, mdiCheck, mdiVectorSquare, mdiZipBox, mdiMinus, mdiFileCode } from '@mdi/js'
import { Icon } from './components/Icon.jsx'
import Select from './components/Select.jsx'
import { polylineToPath } from './lib/geometry.js'
import { buildSVG } from './lib/svg.js'
import { toGcode } from './lib/gcode.js'
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
import { orderPolylines } from './lib/pathopt.js'
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

const GENERATORS = {
  spirograph: {
    name: 'Spirograph',
    fn: spirograph,
    params: {
      R: 120, // outer radius
      r: 35,  // inner radius
      d: 50,  // pen offset
      turns: 1300,
      step: 0.02,
      centerX: 210,
      centerY: 148,
      scale: 1,
      simplifyTol: 0
    }
  },
  polarStarburst: {
    name: 'Polar Starburst',
    fn: polarStarburst,
    params: {
      spikes: 72,
      spreadDeg: 6,
      linesPerSpike: 1,
      inner: 8,
      outer: null,
      jitterDeg: 2,
      lengthJitter: 0.15,
      centerX: null,
      centerY: null,
      margin: 20,
      simplifyTol: 0
    }
  },
  flowRibbons: {
    name: 'Flow Ribbons',
    fn: flowRibbons,
    params: {
      seedsX: 42,
      seedsY: 60,
      minSpacing: 1.6,
      stepLen: 0.9,
      maxSteps: 1800,
      centers: 3,
      sep: 160,
      sigma: 90,
      swirl: 1.25,
      swirlAlt: true,
      baseAngleDeg: -18,
      drift: 0.25,
      noiseAmp: 0.15,
      noiseScale: 0.010,
      followOnly: false,
      margin: 20,
      simplifyTol: 0
    }
  },
  mdiIconField: {
    name: 'MDI Icon Field',
    fn: mdiIconField,
    params: {
      namesCsv: 'mdiFlower,mdiRobot,mdiHeart',
      cols: 10,
      rows: 8,
      spacing: 36,
      jitter: 0.1,
      scaleMin: 5,
      scaleMax: 7,
      rotationJitter: 0.4,
      samples: 220,
      margin: 20,
      simplifyTol: 0
    }
  },
  hatchFill: {
    name: 'Hatch Fill',
    fn: hatchFill,
    params: {
      angleDeg: 45,
      spacing: 6,
      offset: 0,
      cross: false,
      crossOffset: 0,
      clipToPrevious: false,
      clipRule: 'union',
      margin: 20,
      simplifyTol: 0
    }
  },
  pixelMosaic: {
    name: 'Pixel Mosaic',
    fn: pixelMosaic,
    params: {
      cols: 32,
      rows: 24,
      density: 0.6,
      jitter: 0.0,
      style: 'squares',
      imageInfo: '',
      levels: 3,
      invert: false,
      preserveAspect: true,
      margin: 20,
      simplifyTol: 0
    }
  },
  halftone: {
    name: 'Halftone / Dither',
    fn: halftone,
    params: {
      imageInfo: '',
      spacing: 1.2,
      angleDeg: 0,
      segment: 0.4,
      method: 'floyd',
      gamma: 1.0,
      invert: false,
      preserveAspect: true,
      shape: 'lines', // 'lines' | 'circle' | 'ellipse' | 'square'
      dotMin: 0.3,
      dotMax: 2.0,
      dotAspect: 1.0,
      squiggleAmp: 0,
      squigglePeriod: 6,
      squiggleMode: 'sine', // 'sine' | 'zigzag'
      squiggleDarkness: true,
      squiggleJitterAmp: 0,
      squiggleJitterScale: 0.02,
      squigglePhaseJitter: 0,
      radialCenterX: '',
      radialCenterY: '',
      angStepDeg: 6,
      clipToPrevious: false,
      margin: 20,
      simplifyTol: 0
    }
  },
  retroPipes: {
    name: 'Retro Pipes',
    fn: retroPipes,
    params: {
      cols: 24,
      rows: 16,
      runs: 3,
      steps: 240,
      turnProb: 0.35,
      round: 2,
      margin: 20,
      simplifyTol: 0
    }
  },
  voronoiShatter: {
    name: 'Voronoi Shatter',
    fn: voronoiShatter,
    params: {
      cells: 80,
      relax: 1,
      jitter: 0.1,
      margin: 20,
      simplifyTol: 0
    }
  },
  starLattice: {
    name: 'Star Lattice',
    fn: starLattice,
    params: {
      cols: 11,
      rows: 15,
      spacing: 28,
      radius: 11,
      jitter: 0.0,
      margin: 20,
      simplifyTol: 0
    }
  },
  isometricCity: {
    name: 'Isometric City',
    fn: isometricCity,
    params: {
      cols: 12,
      rows: 10,
      density: 0.8,
      base: 18,
      height: 60,
      jitter: 0.15,
      margin: 20,
      simplifyTol: 0
    }
  },
  mdiPattern: {
    name: 'MDI Pattern',
    fn: mdiPattern,
    params: {
      iconIndex: 0,
      iconName: 'mdiFlower',
      cols: 6,
      rows: 5,
      spacing: 40,
      scale: 6,
      rotation: 0,
      jitter: 0.05,
      margin: 20,
      samples: 240,
      clipRule: 'union',
      simplifyTol: 0
    }
  },
  flowField: {
    name: 'Flow Field',
    fn: flowField,
    params: {
      cols: 36,
      rows: 60,
      scale: 6,
      steps: 220,
      separation: 6,
      margin: 20,
      curl: 0.9,
      jitter: 0.15,
      simplifyTol: 0
    }
  },
  isoContours: {
    name: 'Iso Contours',
    fn: isoContours,
    params: {
      cols: 140,
      rows: 100,
      levels: 60,
      separation: 70,
      lobes: 2,
      sigmaX: 80,
      sigmaY: 55,
      amplitude: 1,
      bias: 0.18,
      warp: 0,
      margin: 20,
      simplifyTol: 0
    }
  },
  superformulaRings: {
    name: 'Superformula Rings',
    fn: superformulaRings,
    params: {
      m: 8,
      a: 1,
      b: 1,
      n1: 0.35,
      n2: 0.3,
      n3: 0.3,
      rings: 60,
      steps: 900,
      inner: 0.08,
      rotateDeg: 0,
      morph: 0.25,
      twistDeg: 0,
      n23Lock: false,
      mRound: true,
      mEven: false,
      margin: 20,
      simplifyTol: 0
    }
  },
  waveMoire: {
    name: 'Wave Moiré',
    fn: waveMoire,
    params: {
      lines: 180,
      freqA: 0.036,
      freqB: 0.049,
      phase: 0,
      amp: 18,
      angleDeg: 12,
      warp: 0.4,
      margin: 20,
      simplifyTol: 0
    }
  },
  streamlines: {
    name: 'Streamlines',
    fn: streamlines,
    params: {
      seedsX: 36,
      seedsY: 26,
      minSpacing: 2.6,
      stepLen: 1.4,
      maxSteps: 480,
      noiseScale: 0.015,
      curl: 1.0,
      jitter: 0.35,
      followOnly: false,
      margin: 20,
      simplifyTol: 0
    }
  },
  stripeBands: {
    name: 'Stripe Bands',
    fn: stripeBands,
    params: {
      cols: 180,
      rows: 120,
      levels: 48,
      isoStart: -0.9,
      isoEnd: 0.9,
      freqX: 0.08,
      freqY: 0.06,
      radialFreq: 0.035,
      radialAmp: 0.6,
      angleDeg: 0,
      warp: 0.2,
      tubeDepth: false,
      tubePeriod: 12,
      tubeMinDuty: 0.15,
      tubeCurve: 'tri',
      margin: 20,
      simplifyTol: 0
    }
  },
  quasicrystalContours: {
    name: 'Quasicrystal Contours',
    fn: quasicrystalContours,
    params: {
      waves: 7,
      freq: 0.07,
      contrast: 1.2,
      phase: 0,
      cols: 180,
      rows: 120,
      iso: 0,
      rotateDeg: 0,
      warp: 0,
      animatePhase: false,
      phaseSpeed: 1.0,
      margin: 20,
      simplifyTol: 0
    }
  },
  reactionContours: {
    name: 'Reaction Contours',
    fn: reactionContours,
    params: {
      cols: 180,
      rows: 120,
      steps: 500,
      feed: 0.036,
      kill: 0.062,
      diffU: 0.16,
      diffV: 0.08,
      dt: 1.0,
      iso: 0.5,
      margin: 20,
      simplifyTol: 0
    }
  },
  svgImport: {
    name: 'SVG Import',
    fn: svgImport,
    params: {
      srcPolylines: [],
      detail: 1,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotateDeg: 0,
      clipRule: 'union',
      simplifyTol: 0
    }
  },
  lsystem: {
    name: 'L-system',
    fn: lsystem,
    params: {
      preset: 'koch', // 'koch' | 'dragon' | 'plant'
      iterations: 4,
      angleDeg: 60,
      step: 6,
      jitter: 0,
      margin: 20,
      simplifyTol: 0
    }
  },
  phyllotaxis: {
    name: 'Phyllotaxis',
    fn: phyllotaxis,
    params: {
      count: 1500,
      angleDeg: 137.507764,
      spacing: 2.8,
      connect: true,
      jitter: 0,
      dotSize: 1.4,
      margin: 20,
      simplifyTol: 0
    }
  },
  truchet: {
    name: 'Truchet Tiles',
    fn: truchet,
    params: {
      cols: 24,
      rows: 16,
      variant: 'curves', // 'curves' | 'lines'
      jitter: 0,
      margin: 20,
      simplifyTol: 0
    }
  },
  hilbert: {
    name: 'Hilbert Curve',
    fn: hilbert,
    params: {
      order: 6,
      margin: 20,
      simplifyTol: 0
    }
  },
  pathWarp: {
    name: 'Path Warp',
    fn: pathWarp,
    params: {
      srcLayerId: '',
      srcToPrevious: false,
      amp: 3.5,
      scale: 0.02,
      step: 1.2,
      copies: 1,
      rotateFlow: false,
      margin: 20,
      simplifyTol: 0
    }
  },
  imageContours: {
    name: 'Image Contours',
    fn: imageContours,
    params: {
      cols: 140,
      rows: 100,
      levels: 8,
      invert: false,
      gamma: 1.0,
      preserveAspect: true,
      imageInfo: '',
      margin: 20,
      simplifyTol: 0
    }
  },
  poissonStipple: {
    name: 'Poisson Stipple',
    fn: poissonStipple,
    params: {
      minDist: 6,
      attempts: 8000,
      useImage: true,
      invert: false,
      gamma: 1.0,
      preserveAspect: true,
      dotMin: 0.5,
      dotMax: 1.8,
      connectPath: false,
      imageInfo: '',
      margin: 20,
      simplifyTol: 0
    }
  },
  tspArt: {
    name: 'TSP Art',
    fn: tspArt,
    params: {
      points: 2000,
      useImage: true,
      invert: false,
      gamma: 1.0,
      preserveAspect: true,
      improveIters: 0,
      imageInfo: '',
      margin: 20,
      simplifyTol: 0
    }
  },
  harmonograph: {
    name: 'Harmonograph',
    fn: harmonograph,
    params: {
      Ax: 120, Ay: 80,
      fx: 0.21, fy: 0.19,
      px: 0, py: Math.PI/2,
      dx: 0.01, dy: 0.012,
      tMax: 60,
      steps: 8000,
      margin: 20,
      simplifyTol: 0
    }
  },
  deJong: {
    name: 'De Jong Attractor',
    fn: deJong,
    params: {
      a: 2.01, b: -2.53, c: 1.61, d: -0.33,
      iter: 120000,
      burn: 1000,
      margin: 20,
      simplifyTol: 0
    }
  },
  reactionStrokes: {
    name: 'Reaction Strokes',
    fn: reactionStrokes,
    params: {
      cols: 160,
      rows: 110,
      steps: 450,
      feed: 0.036,
      kill: 0.062,
      diffU: 0.16,
      diffV: 0.08,
      dt: 1.0,
      seedsX: 36,
      seedsY: 26,
      minSpacing: 2.4,
      stepLen: 1.1,
      maxSteps: 650,
      vMin: 0.18,
      vMax: 0.82,
      jitter: 0.25,
      margin: 20,
      simplifyTol: 0
    }
  },
  clifford: {
    name: 'Clifford Attractor',
    fn: clifford,
    params: { a: -1.7, b: 1.3, c: -0.1, d: -1.21, iter: 150000, burn: 1000, margin: 20, simplifyTol: 0 }
  },
  sunflowerBands: {
    name: 'Sunflower Bands',
    fn: sunflowerBands,
    params: {
      count: 900,
      spacing: 3.2,
      angleDeg: 137.50776405003785,
      dotSize: 2.0,
      bandPeriod: 7,
      bandDuty: 0.55,
      jitter: 0.15,
      margin: 20,
      simplifyTol: 0
    }
  },
  combinator: {
    name: 'Combinator',
    fn: combinator,
    params: {
      srcA: '',
      srcB: '',
      op: 'intersect', // intersect | union | difference | xor
      margin: 20,
      simplifyTol: 0
    }
  }

};
 
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
  params: { ...GENERATORS['spirograph'].params },
  uiCollapsed: false
})

export default function App() {
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
  // Keyboard/interaction helpers
  const [spaceDown, setSpaceDown] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [showHelp, setShowHelp] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:showHelp')) || false } catch { return false }
  })
  // Help overlay refs for click-outside dismiss
  const helpRef = useRef(null)
  const helpBtnRef = useRef(null)
  const [compactUI, setCompactUI] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:compactUI')) || false } catch { return false }
  })
  const [superCompact, setSuperCompact] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:superCompact')) || false } catch { return false }
  })
  const [layerMenuId, setLayerMenuId] = useState(null)
  const [groupOpen, setGroupOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('plotterlab:groupOpen')) || {} } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem('plotterlab:paperFavs', JSON.stringify(paperFavorites)) } catch(e){} }, [paperFavorites])
  useEffect(() => { try { localStorage.setItem('plotterlab:showHelp', JSON.stringify(showHelp)) } catch(e){} }, [showHelp])
  useEffect(() => { try { localStorage.setItem('plotterlab:compactUI', JSON.stringify(compactUI)) } catch(e){} }, [compactUI])
  useEffect(() => { try { localStorage.setItem('plotterlab:superCompact', JSON.stringify(superCompact)) } catch(e){} }, [superCompact])
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

  // Built-in Examples (served from /presets)
  const [examples, setExamples] = useState([])
  const [selectedExample, setSelectedExample] = useState('')
  useEffect(() => {
    let cancelled = false
    fetch('/presets/index.json')
      .then(r => r.ok ? r.json() : [])
      .then(list => { if (!cancelled && Array.isArray(list)) setExamples(list) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  const loadExample = async (file) => {
    if (!file) return
    try {
      const res = await fetch(`/presets/${file}`)
      const data = await res.json()
      if (data.doc) setDoc(d => ({ ...d, ...data.doc }))
      if (Array.isArray(data.layers)) setLayers(data.layers)
    } catch (e) {
      console.error('Load example failed', e)
    }
  }
  const setDefaultExample = () => {
    if (!selectedExample) return
    try { localStorage.setItem('plotterlab:defaultPreset', selectedExample) } catch {}
  }
  const clearDefaultExample = () => {
    try { localStorage.removeItem('plotterlab:defaultPreset') } catch {}
  }
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

  useEffect(() => { try { localStorage.setItem('plotterlab:doc', JSON.stringify(doc)) } catch(e){} }, [doc])
  useEffect(() => { try { localStorage.setItem('plotterlab:layers', JSON.stringify(layers)) } catch(e){} }, [layers])

  // Presets: export/import
  const fileRef = useRef(null)
  const photoRef = useRef(null)
  const [photoMode, setPhotoMode] = useState(null) // 'mono' | 'cmyk'
  const imageRef = useRef(null)
  const [imageTargetLayerId, setImageTargetLayerId] = useState(null)
  const svgRef = useRef(null)
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
  const clearLayerImage = (layerId) => {
    setBitmaps(m => { const n = { ...m }; delete n[layerId]; return n })
    setLayers(ls => ls.map(l => l.id === layerId ? ({ ...l, params: { ...l.params, imageInfo: '' } }) : l))
  }
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
      const isHatch = l.generator === 'hatchFill'
      const next = { ...l, params: { ...l.params, clipLayerId: srcId, clipMode: 'index', clipToPrevious: false } }
      if (isHatch) {
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
      } else {
        next.params.clipIndex = Math.max(0, Math.floor(idx))
        delete next.params.clipIndices
      }
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
            // For Hatch Fill: support multi-select (Shift toggles), using clipIndices array
            setLayers(ls => ls.map(l => {
              if (l.id !== target.id) return l
              const isHatch = l.generator === 'hatchFill'
              const next = { ...l, params: { ...l.params, clipLayerId: found.srcId, clipMode: 'index', clipToPrevious: false } }
              if (isHatch) {
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
              } else {
                next.params.clipIndex = Math.max(0, Math.floor(found.idx))
                delete next.params.clipIndices
              }
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
    if (doc.fastPreview) rafId = requestAnimationFrame(tick)
    return () => { try { cancelAnimationFrame(rafId) } catch {} }
  }, [doc.fastPreview])

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
  const exportPreset = () => {
    try {
      const preset = { doc, layers }
      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
      saveAs(blob, `preset_${doc.seed}.json`)
    } catch (e) {
      console.error('Export preset failed', e)
    }
  }
  const openImport = () => fileRef.current?.click()
  const handleImport = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const text = await f.text()
      const data = JSON.parse(text)
      if (data.doc) setDoc(d => ({ ...d, ...data.doc }))
      if (Array.isArray(data.layers)) setLayers(data.layers)
    } catch (err) {
      console.error('Import preset failed', err)
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

  const addLayer = () => setLayers(ls => [...ls, newLayer(ls.length)])
  const removeLayer = (id) => setLayers(ls => ls.filter(l => l.id !== id))
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

  const regenerateSeed = () => setDoc(d => ({ ...d, seed: Math.random().toString(36).slice(2,10) }))

  // UI helpers
  const setAllLayersCollapsed = (flag) => setLayers(ls => ls.map(l => ({ ...l, uiCollapsed: !!flag })))

  // Compute a separation that fits the requested number of iso lobes vertically within the page
  const fitIsoSeparation = (layerId) => setLayers(ls => ls.map(l => {
    if (l.id !== layerId || l.generator !== 'isoContours') return l
    const lobes = Math.max(1, Math.floor(l.params?.lobes || 1))
    const effMargin = Number.isFinite(l.params?.margin) ? l.params.margin : doc.margin
    const H = Math.max(1, doc.height - 2 * effMargin)
    const sigmaY = Number(l.params?.sigmaY || 55)
    // Reserve a little headroom so outer rings don't clip; 3*sigmaY is a reasonable pad
    const pad = Math.max(0, 3 * sigmaY)
    const usable = Math.max(1, H - pad)
    const sep = lobes <= 1 ? 0 : (usable / (lobes - 1))
    return { ...l, params: { ...l.params, separation: Math.max(0, Math.round(sep)) } }
  }))

  // Per-layer SVG upload handler for svgImport generator
  const onLayerSvgSelected = async (layerId, file) => {
    if (!file) return
    try {
      const text = await file.text()
      const layer = layers.find(l => l.id === layerId)
      const det = layer?.params?.detail ?? 1
      const parsed = extractPolylinesFromSvgText(text, { detail: det })
      setLayers(ls => ls.map(l => l.id === layerId ? { ...l, params: { ...l.params, srcPolylines: parsed } } : l))
    } catch (e) {
      console.error('SVG parse failed', e)
    }
  }

  // Transient image bitmaps for halftone (not saved to localStorage)
  const [bitmaps, setBitmaps] = useState({})
  const onLayerImageSelected = async (layerId, file) => {
    if (!file) return
    try {
      // Load full RGB so we can split channels later; also includes grayscale in .data
      const bmp = await fileToRGB(file, 800)
      setBitmaps(m => ({ ...m, [layerId]: bmp }))
      setLayers(ls => ls.map(l => l.id === layerId ? { ...l, params: { ...l.params, imageInfo: `${bmp.width}x${bmp.height}` } } : l))
    } catch (e) {
      console.error('Image load failed', e)
    }
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
      } else if (photoMode === 'cmyk') {
        const N = bmp.r.length
        const Cb = new Float32Array(N)
        const Mb = new Float32Array(N)
        const Yb = new Float32Array(N)
        const Kb = new Float32Array(N)
        for (let i=0;i<N;i++) {
          const r = bmp.r[i], g = bmp.g[i], b = bmp.b[i]
          const c1 = 1 - r, m1 = 1 - g, y1 = 1 - b
          const k = Math.min(c1, m1, y1)
          const denom = (1 - k) || 1e-6
          const c = (c1 - k) / denom
          const m = (m1 - k) / denom
          const y = (y1 - k) / denom
          // Convert ink density to brightness for halftone (1 - density)
          Cb[i] = 1 - c
          Mb[i] = 1 - m
          Yb[i] = 1 - y
          Kb[i] = 1 - k
        }
        // Helper to create a halftone layer with a standard CMYK screen angle
        const mkLayer = (suffix, color, angleDeg) => ({
          id: uid(),
          name: `Photo (${suffix})`,
          color,
          visible: true,
          generator: 'halftone',
          params: { ...GENERATORS['halftone'].params, imageInfo: `${bmp.width}x${bmp.height}`, shape: 'lines', spacing: 1.4, segment: 0.4, angleDeg, method: 'floyd' },
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
      }
    } catch (err) {
      console.error('Photo import failed', err)
    } finally {
      setPhotoMode(null)
      if (e.target) e.target.value = ''
    }
  }

  // Split a Halftone layer's image bitmap into three RGB layers
  const splitHalftoneToRGB = (layerId) => setLayers(ls => {
    const idx = ls.findIndex(l => l.id === layerId)
    if (idx < 0) return ls
    const base = ls[idx]
    const bm = bitmaps[base.id]
    if (!bm || !bm.r || !bm.g || !bm.b) return ls
    const mk = (name, color, data) => {
      const id = uid()
      const lyr = { ...base, id, name, color }
      // ensure params shallow copy
      lyr.params = { ...base.params }
      // store per-layer bitmap brightness channel (0=black -> draw more)
      setBitmaps(m => ({ ...m, [id]: { width: bm.width, height: bm.height, data } }))
      return lyr
    }
    // For halftone, bitmap.data is interpreted as brightness g in [0,1].
    // To generate more ink where channel is strong, we convert channel value to brightness via (1 - channel).
    const Rb = new Float32Array(bm.r.length); for (let i=0;i<Rb.length;i++) Rb[i] = 1 - bm.r[i]
    const Gb = new Float32Array(bm.g.length); for (let i=0;i<Gb.length;i++) Gb[i] = 1 - bm.g[i]
    const Bb = new Float32Array(bm.b.length); for (let i=0;i<Bb.length;i++) Bb[i] = 1 - bm.b[i]
    const Lr = mk(`${base.name} (R)`, '#ff3b30', Rb)
    const Lg = mk(`${base.name} (G)`, '#34c759', Gb)
    const Lb = mk(`${base.name} (B)`, '#0a84ff', Bb)
    const out = ls.slice()
    out.splice(idx + 1, 0, Lr, Lg, Lb)
    return out
  })

  // Split a Halftone layer's image into CMYK layers using simple conversion
  const splitHalftoneToCMYK = (layerId) => setLayers(ls => {
    const idx = ls.findIndex(l => l.id === layerId)
    if (idx < 0) return ls
    const base = ls[idx]
    const bm = bitmaps[base.id]
    if (!bm || !bm.r || !bm.g || !bm.b) return ls
    const N = bm.r.length
    const Cb = new Float32Array(N)
    const Mb = new Float32Array(N)
    const Yb = new Float32Array(N)
    const Kb = new Float32Array(N)
    for (let i=0;i<N;i++) {
      const r = bm.r[i], g = bm.g[i], b = bm.b[i]
      const c1 = 1 - r, m1 = 1 - g, y1 = 1 - b
      const k = Math.min(c1, m1, y1)
      const denom = (1 - k) || 1e-6
      const c = (c1 - k) / denom
      const m = (m1 - k) / denom
      const y = (y1 - k) / denom
      // Convert ink density to brightness for halftone (1 - density)
      Cb[i] = 1 - c
      Mb[i] = 1 - m
      Yb[i] = 1 - y
      Kb[i] = 1 - k
    }
    const mk = (name, color, data) => {
      const id = uid()
      const lyr = { ...base, id, name, color }
      lyr.params = { ...base.params }
      setBitmaps(m => ({ ...m, [id]: { width: bm.width, height: bm.height, data } }))
      return lyr
    }
    const Lc = mk(`${base.name} (C)`, '#00AEEF', Cb)
    const Lm = mk(`${base.name} (M)`, '#EC008C', Mb)
    const Ly = mk(`${base.name} (Y)`, '#FFF200', Yb)
    const Lk = mk(`${base.name} (K)`, '#111111', Kb)
    const out = ls.slice()
    out.splice(idx + 1, 0, Lc, Lm, Ly, Lk)
    return out
  })

  // Scale selected generator parameters for fast preview
  const scaleParamsForPreview = (genKey, params, q) => {
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
    }
    const k = keysToScaleInt[genKey] || []
    const out = { ...params }
    for (const name of k) {
      if (typeof out[name] === 'number' && Number.isFinite(out[name])) {
        const v = Math.max(1, Math.floor(out[name] * q))
        out[name] = v
      }
    }
    // Some non-integer tweaks per generator (keep conservative)
    if (genKey === 'hatchFill' && typeof out.spacing === 'number') {
      out.spacing = Math.max(0.1, out.spacing / Math.max(0.5, q)) // larger spacing => fewer lines
    }
    return out
  }

  // Shared renderer used for preview and for full-quality exports (wrapper)
  const computeRendered = (...args) => renderAll(...args)

  // Preview rendering off the main thread via Web Worker
  const [rendered, setRendered] = useState([])
  const [renderedPaths, setRenderedPaths] = useState([])
  const [previewProgress, setPreviewProgress] = useState(0)
  const [previewRunning, setPreviewRunning] = useState(false)
  const [previewDetail, setPreviewDetail] = useState(null)
  const [progressVisible, setProgressVisible] = useState(false)
  const workerRef = useRef(null)
  const jobRef = useRef(null)
  // Preview watchdog and quality override for resilience
  const watchdogRef = useRef(null)
  const lastProgressAtRef = useRef(0)
  const qualityOverrideRef = useRef(null)
  const [previewNonce, setPreviewNonce] = useState(0)
  const isCanceledRef = useRef(false)
  useEffect(() => {
    // Delay showing the progress UI to avoid flicker while dragging sliders
    let timer = null
    if (previewRunning || (previewProgress > 0 && previewProgress < 1)) {
      timer = setTimeout(() => setProgressVisible(true), 250)
    } else {
      setProgressVisible(false)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [previewRunning, previewProgress])

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./lib/previewWorker.js', import.meta.url), { type: 'module' })
      workerRef.current.onmessage = (e) => {
        const { id, type, outputs, paths, progress, message } = e.data || {}
        if (id && jobRef.current && id !== jobRef.current) return
        if (type === 'progress') {
          setPreviewProgress(progress || 0)
          if (e.data && e.data.detail) setPreviewDetail(e.data.detail)
          // Reset watchdog on progress
          lastProgressAtRef.current = Date.now()
          if (watchdogRef.current) clearTimeout(watchdogRef.current)
          watchdogRef.current = setTimeout(() => {
            // If the same job is still running without progress, restart at a safer quality
            if (jobRef.current === id && !isCanceledRef.current) {
              try { workerRef.current?.terminate() } catch {}
              workerRef.current = null
              setPreviewRunning(false)
              setPreviewProgress(0)
              setPreviewDetail(null)
              // Lower effective preview quality for retry (does not change saved settings)
              const base = (doc.fastPreview ? (doc.previewQuality ?? 0.6) : 1)
              qualityOverrideRef.current = Math.max(0.35, Math.min(1, base * 0.75))
              setPreviewNonce(n => n + 1)
            }
          }, 12000)
        } else if (type === 'done') {
          setRendered(outputs || [])
          setRenderedPaths(paths || [])
          setPreviewProgress(1)
          setPreviewRunning(false)
          setPreviewDetail(null)
          if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null }
          // Clear any temporary quality override after a successful run
          qualityOverrideRef.current = null
        } else if (type === 'error') {
          console.error('Preview worker error:', message)
          setRendered([])
          setRenderedPaths([])
          setPreviewProgress(1)
          setPreviewRunning(false)
          setPreviewDetail(null)
          if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null }
        }
      }
    }
    const qual = doc.fastPreview ? (doc.previewQuality ?? 0.6) : 1
    const effQual = Math.max(0.2, Math.min(1, qualityOverrideRef.current || qual))
    const id = uid()
    jobRef.current = id
    setPreviewProgress(0)
    setPreviewRunning(true)
    setPreviewDetail(null)
    isCanceledRef.current = false
    workerRef.current.postMessage({
      id,
      layers: dLayers,
      doc: dDoc,
      mdiCache,
      bitmaps,
      quality: effQual
    })
    // Arm watchdog in case no progress arrives at all
    lastProgressAtRef.current = Date.now()
    if (watchdogRef.current) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => {
      if (jobRef.current === id && !isCanceledRef.current) {
        try { workerRef.current?.terminate() } catch {}
        workerRef.current = null
        setPreviewRunning(false)
        setPreviewProgress(0)
        setPreviewDetail(null)
        const base = (doc.fastPreview ? (doc.previewQuality ?? 0.6) : 1)
        qualityOverrideRef.current = Math.max(0.35, Math.min(1, base * 0.75))
        setPreviewNonce(n => n + 1)
      }
    }, 12000)
  }, [dLayers, dDoc, mdiCache, bitmaps, doc.fastPreview, doc.previewQuality, previewNonce])
  useEffect(() => () => {
    try { workerRef.current?.terminate() } catch(e){}
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null }
  }, [])

  // Manual Reset Preview action (UI)
  const resetPreview = () => {
    qualityOverrideRef.current = null
    try { workerRef.current?.terminate() } catch {}
    workerRef.current = null
    setPreviewRunning(false)
    setPreviewProgress(0)
    setPreviewDetail(null)
    isCanceledRef.current = false
    setPreviewNonce(n => n + 1)
  }

  // Manual Cancel Preview action (UI)
  const cancelPreview = () => {
    isCanceledRef.current = true
    qualityOverrideRef.current = null
    try { workerRef.current?.terminate() } catch {}
    workerRef.current = null
    setPreviewRunning(false)
    setPreviewProgress(0)
    setPreviewDetail(null)
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null }
  }

  const memoSvgPaths = useMemo(() => {
    const arr = Array.isArray(rendered) ? rendered : []
    return arr.map(({ layer, polylines }) => ({ layer, d: (polylines || []).map(polylineToPath).join(' ') }))
  }, [rendered])
  const svgPaths = (Array.isArray(renderedPaths) && renderedPaths.length) ? renderedPaths : memoSvgPaths


  const viewBox = useMemo(() => {
    const z = Math.max(0.2, doc.previewZoom || 1)
    const vw = doc.width / z
    const vh = doc.height / z
    const minX = (doc.previewPanX || 0)
    const minY = (doc.previewPanY || 0)
    return `${minX} ${minY} ${vw} ${vh}`
  }, [doc.width, doc.height, doc.previewZoom, doc.previewPanX, doc.previewPanY])

  const overlayOrder = useMemo(() => {
    // Only compute heavy ordering when strictly needed and when preview is idle
    if (!(doc.showOrderNumbers || doc.showTravel)) return []
    if (previewRunning) return []
    const all = rendered.flatMap(r => r.layer.visible ? r.polylines : [])
    if (all.length === 0) return []
    // Downsample for preview if too many polylines (e.g., halftone): keeps UI snappy
    const MAX_PREVIEW_POLYS = 2500
    let polys = all
    if (all.length > MAX_PREVIEW_POLYS) {
      const stride = Math.max(1, Math.ceil(all.length / MAX_PREVIEW_POLYS))
      polys = all.filter((_, i) => (i % stride) === 0)
    }
    // Prefer faster method for preview when very large
    const method = (doc.optimize === 'nearest+improve' && polys.length > 2000) ? 'nearest' : doc.optimize
    return orderPolylines(polys, method, doc.startX, doc.startY)
  }, [rendered, doc.optimize, doc.startX, doc.startY, doc.showOrderNumbers, doc.showTravel, previewRunning])

  // Build a lightweight travel preview path from the ordered polylines
  const travelD = useMemo(() => {
    if (!doc.showTravel || previewRunning) return ''
    try {
      if (!overlayOrder || overlayOrder.length === 0) return ''
      const segs = []
      if (overlayOrder[0] && overlayOrder[0].length) {
        segs.push(`M ${doc.startX} ${doc.startY} L ${overlayOrder[0][0][0]} ${overlayOrder[0][0][1]}`)
      }
      for (let i = 0; i < overlayOrder.length - 1; i++) {
        const a = overlayOrder[i]
        const b = overlayOrder[i+1]
        if (!a.length || !b.length) continue
        const p = a[a.length - 1]
        const q = b[0]
        segs.push(`M ${p[0]} ${p[1]} L ${q[0]} ${q[1]}`)
      }
      return segs.join(' ')
    } catch {
      return ''
    }
  }, [overlayOrder, doc.showTravel, doc.startX, doc.startY, previewRunning])

  // Dynamic contrast for G-code toggle chip
  const lumaOfHex = (hex) => {
    if (!hex || typeof hex !== 'string') return 0
    const s = hex.trim().replace('#','')
    const v = s.length===3 ? s.split('').map(c=>c+c).join('') : s
    const r = parseInt(v.slice(0,2),16)||0, g=parseInt(v.slice(2,4),16)||0, b=parseInt(v.slice(4,6),16)||0
    // relative luminance (sRGB)
    const toLin = (u)=>{u/=255;return u<=0.03928?u/12.92:Math.pow((u+0.055)/1.055,2.4)}
    const L = 0.2126*toLin(r)+0.7152*toLin(g)+0.0722*toLin(b)
    return L
  }
  const gcodeChipStyle = useMemo(() => {
    const bgL = lumaOfHex(doc.bg)
    const appL = lumaOfHex(doc.appBg)
    const lightBackgroundLikely = Math.max(bgL, appL) > 0.6
    return lightBackgroundLikely
      ? { backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(2px)' }
      : { backgroundColor: 'rgba(34,211,238,0.85)', color: '#0b0f14', borderColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)' }
  }, [doc.bg, doc.appBg])

  // Grid dot color adapts to background so grid is visible on light or dark themes
  const gridDotColor = useMemo(() => {
    const bgL = lumaOfHex(doc.appBg)
    const paperL = lumaOfHex(doc.bg)
    const baseL = Math.max(bgL, paperL)
    return baseL > 0.6 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.10)'
  }, [doc.appBg, doc.bg])

  // Grid data for SVG overlay (drawn over paper rect so it's visible on page)
  const gridData = useMemo(() => {
    if (!doc.showGrid) return null
    const step = Math.max(2, Math.round(Number(doc.gridSizePx || 12)))
    const vx = []
    for (let x = 0; x <= doc.width + 1e-6; x += step) vx.push(Math.round(x))
    const hy = []
    for (let y = 0; y <= doc.height + 1e-6; y += step) hy.push(Math.round(y))
    return { step, vx, hy }
  }, [doc.showGrid, doc.gridSizePx, doc.width, doc.height])

  // Compact label helpers for sidebar forms
  const labelClass = superCompact
    ? 'flex flex-col gap-0 capitalize text-[11px]'
    : (compactUI ? 'flex flex-col gap-0.5 capitalize text-xs' : 'flex flex-col gap-1 capitalize')
  const labelRowClass = superCompact
    ? 'flex items-center gap-1 capitalize text-[11px]'
    : (compactUI ? 'flex items-center gap-1 capitalize text-xs' : 'flex items-center gap-2 capitalize')

  // Mini-accordion helpers per layer/group
  const isGroupOpen = (layerId, key) => (groupOpen[`${layerId}:${key}`] ?? true)
  const toggleGroup = (layerId, key) => setGroupOpen(s => ({ ...s, [`${layerId}:${key}`]: !(s[`${layerId}:${key}`] ?? true) }))

  // Helper to render a numeric param input bound to a specific layer/param key
  const renderNumParam = (layer, k, labelText) => {
    const def = (GENERATORS[layer.generator]?.params || {})[k]
    const editKey = `L:${layer.id}:${k}`
    const displayVal = (numEdit && Object.prototype.hasOwnProperty.call(numEdit, editKey))
      ? numEdit[editKey]
      : String(layer.params[k] ?? def)
    return (
      <label key={`g_${k}`} className={labelClass}>
        {labelText || k}
        <input className="input" type="text" inputMode="decimal" value={displayVal}
          onChange={e=>{
            const txt = e.target.value
            setNumEdit(m=>({ ...m, [editKey]: txt }))
            const v = parseFloat(txt)
            if (txt !== '' && Number.isFinite(v)) {
              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,[k]: v}}:l))
            }
          }}
          onBlur={()=>{
            setNumEdit(m=>{ const n={...m}; delete n[editKey]; return n })
          }}
        />
      </label>
    )
  }

  // Selection overlay for transform gizmo
  const transformOverlay = useMemo(() => {
    if (!transform.active || !transform.layerId) return null
    const entry = rendered.find(r => r.layer.id === transform.layerId)
    if (!entry || !entry.polylines || entry.polylines.length === 0) return null
    // inline bounds to avoid referencing later-declared const
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of entry.polylines) {
      for (const [x,y] of p) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
    if (minX === Infinity) return null
    const b = { minX, minY, maxX, maxY }
    const cx = (b.minX + b.maxX) / 2
    const cy = (b.minY + b.maxY) / 2
    const topMid = [(b.minX+b.maxX)/2, b.minY]
    const rot = [topMid[0], Math.max(0, b.minY - Math.max(10, (b.maxY-b.minY)*0.08))]
    return { b, cx, cy, rot }
  }, [transform, rendered])

  // HUD helpers for quasicrystal animation
  const anyQc = useMemo(() => layers.some(l => l.generator === 'quasicrystalContours'), [layers])
  const anyQcAnimating = useMemo(() => layers.some(l => l.generator === 'quasicrystalContours' && l.params?.animatePhase), [layers])
  const toggleQcAnimate = () => setLayers(ls => ls.map(l => l.generator === 'quasicrystalContours' ? { ...l, params: { ...l.params, animatePhase: !anyQcAnimating } } : l))
  const resetQcPhase = () => setLayers(ls => ls.map(l => l.generator === 'quasicrystalContours' ? { ...l, params: { ...l.params, phase: 0 } } : l))

  // Overlay indices for clip source polygons when a layer uses Clip Mode = 'index'
  const centroidOfPoly = (p) => {
    // p is closed (first==last). Use polygon centroid formula.
    let a = 0, cx = 0, cy = 0
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const x0 = p[j][0], y0 = p[j][1]
      const x1 = p[i][0], y1 = p[i][1]
      const f = (x0 * y1 - x1 * y0)
      a += f
      cx += (x0 + x1) * f
      cy += (y0 + y1) * f
    }
    a *= 0.5
    if (Math.abs(a) < 1e-6) return [p[0][0], p[0][1]]
    cx /= (6 * a)
    cy /= (6 * a)
    return [cx, cy]
  }
  const closedPolys = (polys) => polys.filter(pp => pp && pp.length >= 3).map(pp => {
    const a = pp[0], b = pp[pp.length - 1]
    const dx = a[0] - b[0], dy = a[1] - b[1]
    if (dx*dx + dy*dy > 1e-6) return [...pp, pp[0]]
    return pp
  }).filter(pp => pp.length >= 4)

  // Stitch -> auto-close -> stable-sort polygons just like renderer.makeClipPolys
  const makeClipPolysLocal = (polys) => {
    const dist2 = (a, b) => { const dx = a[0]-b[0], dy = a[1]-b[1]; return dx*dx+dy*dy }
    const isClosed = (p, eps2 = 1e-4) => p.length>=3 && dist2(p[0], p[p.length-1]) <= eps2
    const eps2 = 0.64 // ~0.8mm threshold; match renderer
    const closed = []
    const opens = []
    for (const p of (polys||[])) {
      if (!p || p.length < 2) continue
      if (isClosed(p, eps2)) {
        if (dist2(p[0], p[p.length-1]) > 1e-6) { const q = p.slice(); q.push(q[0]); if (q.length>=4) closed.push(q) }
        else closed.push(p)
      } else {
        opens.push(p.slice())
      }
    }
    // Do not cross-stitch separate opens; only auto-close any single open loops.
    for (const O of opens) {
      if (!O || O.length < 3) continue
      const q = O.slice()
      if (dist2(q[0], q[q.length-1]) > 1e-6) q.push(q[0])
      if (q.length >= 4) closed.push(q)
    }
    const out = closed.filter(pp => pp.length >= 4)
    const centroid = (p) => { let a=0,cx=0,cy=0; for(let i=0,j=p.length-1;i<p.length;j=i++){const x0=p[j][0],y0=p[j][1],x1=p[i][0],y1=p[i][1]; const f=(x0*y1-x1*y0); a+=f; cx+=(x0+x1)*f; cy+=(y0+y1)*f } a*=0.5; if (Math.abs(a)<1e-6) return [p[0][0], p[0][1]]; return [cx/(6*a), cy/(6*a)] }
    const areaAbs = (p)=>{ let a=0; for(let i=0,j=p.length-1;i<p.length;j=i++){ a += (p[j][0]*p[i][1] - p[i][0]*p[j][1]) } return Math.abs(a*0.5) }
    out.sort((A,B)=>{ const ca=centroid(A), cb=centroid(B); if (Math.abs(ca[0]-cb[0])>1e-6) return ca[0]-cb[0]; if (Math.abs(ca[1]-cb[1])>1e-6) return ca[1]-cb[1]; return areaAbs(A)-areaAbs(B) })
    return out
  }

  const clipOverlays = useMemo(() => {
    const items = []
    for (const l of layers) {
      if (!l.visible) continue
      if (l.generator !== 'hatchFill' && l.generator !== 'halftone' && l.generator !== 'mdiPattern' && l.generator !== 'svgImport') continue
      if ((l.params?.clipMode || 'all') !== 'index') continue
      const srcId = l.params?.clipLayerId
      if (!srcId) continue
      const src = rendered.find(r => r.layer.id === srcId && r.layer.visible)
      if (!src || !src.polylines || src.polylines.length === 0) continue
      const polys = makeClipPolysLocal(src.polylines)
      // Build labels and spread overlapping centroids slightly for visibility
      const areaAbs = (p)=>{ let a=0; for(let i=0,j=p.length-1;i<p.length;j=i++){ a += (p[j][0]*p[i][1] - p[i][0]*p[j][1]) } return Math.abs(a*0.5) }
      const raw = polys.map((p, i) => ({ idx: i, c: centroidOfPoly(p), area: areaAbs(p) }))
      const groups = new Map()
      for (const lab of raw) {
        const kx = Math.round(lab.c[0]*10)/10
        const ky = Math.round(lab.c[1]*10)/10
        const key = `${kx}_${ky}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(lab)
      }
      const labels = []
      for (const arr of groups.values()) {
        // Radial placement around the shared centroid to avoid overlap for concentric shapes
        arr.sort((a,b)=>a.area - b.area)
        const center = arr[0].c
        if (arr.length === 1) { labels.push({ idx: arr[0].idx, c: center }); continue }
        const anglesDeg = [-90, 90, 180, 0, -45, 45, 135, -135]
        const angles = anglesDeg.map(d => d * Math.PI / 180)
        const baseR = 10 // mm from center
        const ringStep = 8 // mm between rings of labels if >8 items share a centroid
        for (let j = 0; j < arr.length; j++) {
          const a = angles[j % angles.length]
          const ring = Math.floor(j / angles.length)
          const r = baseR + ring * ringStep
          const lx = center[0] + Math.cos(a) * r
          const ly = center[1] + Math.sin(a) * r
          labels.push({ idx: arr[j].idx, c: [lx, ly] })
        }
      }
      const selectedIdx = Array.isArray(l.params?.clipIndices)
        ? l.params.clipIndices.map(n=>Math.max(0,Math.floor(n||0)))
        : (Number.isFinite(l.params?.clipIndex) ? [Math.max(0, Math.floor(l.params.clipIndex))] : [])
      items.push({ layerId: l.id, sourceLayerId: srcId, polys, labels, selectedIdx })
    }
    return items
  }, [layers, rendered])

  // Plot length/time estimator
  const lengthEstimate = useMemo(() => {
    if (!doc.showToolpathControls || previewRunning) {
      return { drawLen: 0, travelLen: 0, totalLen: 0, drawMin: 0, travelMin: 0, totalMin: 0, fmt: (m)=>{
        if (!Number.isFinite(m)) return '-'
        const s = Math.round(m * 60)
        const h = Math.floor(s / 3600)
        const mm = Math.floor((s % 3600) / 60)
        const ss = s % 60
        return h > 0 ? `${h}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${mm}:${String(ss).padStart(2,'0')}`
      } }
    }
    const lenPolyline = (p) => {
      let L = 0
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i+1]
        L += Math.hypot(b[0]-a[0], b[1]-a[1])
      }
      return L
    }
    const drawLen = overlayOrder.reduce((acc, p) => acc + (p.length > 1 ? lenPolyline(p) : 0), 0)
    let travelLen = 0
    for (let i = 0; i < overlayOrder.length - 1; i++) {
      const cur = overlayOrder[i]
      const nxt = overlayOrder[i+1]
      if (!cur.length || !nxt.length) continue
      const a = cur[cur.length - 1]
      const b = nxt[0]
      travelLen += Math.hypot(b[0]-a[0], b[1]-a[1])
    }
    const feed = Math.max(1e-6, doc.feed)
    const travel = Math.max(1e-6, doc.travel)
    const drawMin = drawLen / feed
    const travelMin = travelLen / travel
    const totalMin = drawMin + travelMin
    const fmt = (m) => {
      if (!Number.isFinite(m)) return '-'
      const s = Math.round(m * 60)
      const h = Math.floor(s / 3600)
      const mm = Math.floor((s % 3600) / 60)
      const ss = s % 60
      return h > 0 ? `${h}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${mm}:${String(ss).padStart(2,'0')}`
    }
    return { drawLen, travelLen, totalLen: drawLen + travelLen, drawMin, travelMin, totalMin, fmt }
  }, [overlayOrder, doc.feed, doc.travel, doc.showToolpathControls, previewRunning])

  const downloadSVGs = async () => {
    // Use full quality for export
    const full = renderAll(layers, doc, mdiCache, bitmaps, 1)
    const zip = new JSZip()
    full.forEach(({ layer, polylines }, idx) => {
      if (!layer.visible) return
      const d = polylines.map(polylineToPath).join(' ')
      const svg = buildSVG({ width: doc.width, height: doc.height, bleed: doc.bleed, paths: [{ d, stroke: layer.color, strokeWidth: doc.strokeWidth }] })
      zip.file(`${String(idx+1).padStart(2,'0')}-${layer.name.replace(/\s+/g,'_')}.svg`, svg)
    })
    const blob = await zip.generateAsync({type: 'blob'})
    saveAs(blob, `plotter_layers_${doc.seed}.zip`)
  }

  const downloadGcode = async () => {
    // Regenerate at full quality for export
    const full = renderAll(layers, doc, mdiCache, bitmaps, 1)
    const allPolys = full.flatMap(r => r.layer.visible ? r.polylines : [])
    const opts = {
      width: doc.width,
      height: doc.height,
      feed: doc.feed,
      travel: doc.travel,
      scale: 1,
      penUp: doc.penUp,
      penDown: doc.penDown,
      safeZ: doc.safeZ,
      penMode: doc.penMode,
      servoUp: doc.servoUp,
      servoDown: doc.servoDown,
      delayAfterUp: doc.delayAfterUp,
      delayAfterDown: doc.delayAfterDown,
      originX: Number(doc.originX)||0,
      originY: Number(doc.originY)||0
    }

    if (doc.exportMode === 'combined') {
      // Concatenate layers; optional pause between
      const parts = []
      let first = true
      const visibleLayers = full.filter(r => r.layer.visible && r.polylines.length > 0)
      visibleLayers.forEach((entry, idx) => {
        const { layer, polylines } = entry
        const ordered = orderPolylines(polylines, doc.optimize, doc.startX, doc.startY)
        const g = toGcode(ordered, { ...opts, startX: doc.startX, startY: doc.startY, includeHeader: first, includeFooter: idx === visibleLayers.length - 1 })
        parts.push(`; --- Layer ${idx+1}: ${layer.name} (${layer.color}) ---`)
        parts.push(g)
        if (doc.pauseCombined && idx < visibleLayers.length - 1) {
          const msg = (doc.pauseMessage || 'Change pen to <color>').replace('<color>', layer.color)
          const code = doc.pauseCode || 'M0'
          parts.push(`${code} ; ${msg}`)
        }
        first = false
      })
      const combined = parts.join('\n')
      const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, `plotter_${doc.seed}.gcode`)
      return
    }

    const zip = new JSZip()
    if (doc.exportMode === 'layers') {
      // one file per visible layer
      full.forEach(({ layer, polylines }, idx) => {
        if (!layer.visible || polylines.length === 0) return
        const ordered = orderPolylines(polylines, doc.optimize, doc.startX, doc.startY)
        const g = toGcode(ordered, { ...opts, startX: doc.startX, startY: doc.startY })
        const name = `${String(idx+1).padStart(2,'0')}-${layer.name.replace(/\s+/g,'_')}.gcode`
        zip.file(name, g)
      })
    }

    if (doc.exportMode === 'colors') {
      // group polylines by color across layers
      const byColor = new Map()
      full.forEach(({ layer, polylines }) => {
        if (!layer.visible || polylines.length === 0) return
        const key = layer.color
        if (!byColor.has(key)) byColor.set(key, [])
        byColor.get(key).push(...polylines)
      })
      Array.from(byColor.entries()).forEach(([color, polys]) => {
        const ordered = orderPolylines(polys, doc.optimize, doc.startX, doc.startY)
        const g = toGcode(ordered, { ...opts, startX: doc.startX, startY: doc.startY })
        const name = `${color.replace('#','')}.gcode`
        zip.file(name, g)
      })
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `gcode_${doc.seed}.zip`)
  }

  const downloadLayerSvg = (layerId) => {
    const full = renderAll(layers, doc, mdiCache, bitmaps, 1)
    const entry = full.find(e => e.layer.id === layerId)
    if (!entry) return
    const d = entry.polylines.map(polylineToPath).join(' ')
    const svg = buildSVG({ width: doc.width, height: doc.height, bleed: doc.bleed, paths: [{ d, stroke: entry.layer.color, strokeWidth: doc.strokeWidth }] })
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    saveAs(blob, `${entry.layer.name.replace(/\s+/g,'_')}.svg`)
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
      <aside className={`bg-panel border-r border-white/5 p-4 h-screen overflow-y-auto ${compactUI ? 'ui-compact' : ''} ${superCompact ? 'ui-super' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold tracking-wide">Plotter Lab</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm opacity-80" title="Compact: tighter spacing and condensed controls">
              <input type="checkbox" className="w-4 h-4" checked={!!compactUI}
                onChange={(e)=>{ const v = e.target.checked; if (!v && superCompact) setSuperCompact(false); setCompactUI(v) }} />
              Compact
            </label>
            <label className="flex items-center gap-2 text-sm opacity-80" title="Super compact: maximum density; also enables Compact">
              <input type="checkbox" className="w-4 h-4" checked={!!superCompact}
                onChange={(e)=>{ const v = e.target.checked; setSuperCompact(v); if (v) setCompactUI(true) }} />
              Super
            </label>
            <button className="btn" title="New Layer" onClick={addLayer}>
              <Icon path={mdiLayersPlus} />
            </button>
          </div>
          {/* Progress pill moved into stage container (see below) */}
        </div>

        <section className="space-y-3">
          <div className="rounded-lg p-3 bg-black/20 border border-white/5">
            <h2 className="font-medium mb-2 flex items-center gap-2"><Icon path={mdiFileDocumentOutline}/> <span>Document</span></h2>
            <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              <label className="flex flex-col gap-1" title="Preset paper sizes. 'Custom' uses your Width/Height below.">Paper Size
                <Select value={doc.paperSize || 'custom'} onChange={(v)=>applyPaperSize(v)}
                  options={paperOptions.map(p=>({label:p.label, value:p.key}))}
                />
              </label>
              <label className="flex flex-col gap-1" title="Rotate the page; swaps Width/Height when needed.">Orientation
                <Select value={doc.orientation || 'landscape'} onChange={(v)=>applyOrientation(v)}
                  options={[{label:'Landscape', value:'landscape'},{label:'Portrait', value:'portrait'}]}
                />
              </label>
              <div className="col-span-2 lg:col-span-3 flex flex-wrap gap-2 items-center">
                <button className="btn" onClick={saveCurrentPaperAs} title="Save current paper size">
                  {compactUI ? (<><Icon path={mdiContentSave}/> Save</>) : (<><Icon path={mdiContentSave}/> Save Size</>)}
                </button>
                <button className="btn" onClick={deleteCurrentCustomPaper} disabled={!String(doc.paperSize||'').startsWith('CUST_')} title="Delete current custom size">
                  {compactUI ? (<><Icon path={mdiDelete}/> Delete</>) : (<><Icon path={mdiDelete}/> Delete</>)}
                </button>
                <button className="btn" onClick={()=>toggleFavoritePaper(doc.paperSize || '')} disabled={!doc.paperSize || doc.paperSize==='custom'} title={paperFavorites.includes(doc.paperSize||'') ? 'Remove favorite size' : 'Add favorite size'}>
                  {paperFavorites.includes(doc.paperSize||'')
                    ? (compactUI ? (<><Icon path={mdiStar}/> Unfav</>) : (<><Icon path={mdiStar}/> Unfavorite</>))
                    : (compactUI ? (<><Icon path={mdiStarPlus}/> Fav</>) : (<><Icon path={mdiStarPlus}/> Add Favorite</>))}
                </button>
                <button className="btn" title="Swap Width / Height" onClick={()=>{
                  setDoc(d=>{
                    const w = d.height, h = d.width
                    const ori = w >= h ? 'landscape' : 'portrait'
                    if (d.startPreset && d.startPreset !== 'custom') {
                      const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                      const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                      const { x, y } = computeStart(d.startPreset, w, h, mx, my, d.startUseMargin)
                      return { ...d, width: w, height: h, orientation: ori, paperSize: 'custom', startX: x, startY: y }
                    }
                    return { ...d, width: w, height: h, orientation: ori, paperSize: 'custom' }
                  })
                }}>{compactUI ? (<><Icon path={mdiSwapHorizontal}/> Swap</>) : (<><Icon path={mdiSwapHorizontal}/> Swap W/H</>)}</button>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1" title="Page width (mm). Setting values switches to Custom size.">Width
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:width'] ?? String(doc.width))}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:width']: txt }))
                      const w = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(w)) {
                        setDoc(d=>{
                          if (d.startPreset && d.startPreset !== 'custom') {
                            const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                            const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                            const { x, y } = computeStart(d.startPreset, w, d.height, mx, my, d.startUseMargin)
                            return { ...d, width: w, paperSize: 'custom', startX: x, startY: y }
                          }
                          return { ...d, width: w, paperSize: 'custom' }
                        })
                      }
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:width']; return n })}
                  />
                </label>
                <label className="flex flex-col gap-1" title="Page height (mm). Setting values switches to Custom size.">Height
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:height'] ?? String(doc.height))}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:height']: txt }))
                      const h = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(h)) {
                        setDoc(d=>{
                          if (d.startPreset && d.startPreset !== 'custom') {
                            const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                            const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                            const { x, y } = computeStart(d.startPreset, d.width, h, mx, my, d.startUseMargin)
                            return { ...d, height: h, paperSize: 'custom', startX: x, startY: y }
                          }
                          return { ...d, height: h, paperSize: 'custom' }
                        })
                      }
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:height']; return n })}
                  />
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1" title="Uniform margin (mm) used by start presets and clipping.">Margin
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:margin'] ?? String(doc.margin))}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:margin']: txt }))
                      const mVal = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(mVal)) {
                        setDoc(d=>{
                          const m = mVal
                          if (d.startPreset && d.startPreset !== 'custom') {
                            const mx = Number.isFinite(d.marginX) ? d.marginX : m
                            const my = Number.isFinite(d.marginY) ? d.marginY : m
                            const { x, y } = computeStart(d.startPreset, d.width, d.height, mx, my, d.startUseMargin)
                            return { ...d, margin: m, startX: x, startY: y }
                          }
                          return { ...d, margin: m }
                        })
                      }
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:margin']; return n })}
                  />
                </label>
                <label className="flex flex-col gap-1" title="Optional overflow past the paper edge (mm) for exports.">Bleed (mm)
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:bleed'] ?? String(doc.bleed))}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:bleed']: txt }))
                      const v = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(v)) setDoc(d=>({ ...d, bleed: Math.max(0, v) }))
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:bleed']; return n })}
                  />
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1" title="Override horizontal margin (mm). Falls back to Margin if blank.">Margin X (optional)
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:marginX'] ?? (Number.isFinite(doc.marginX)? String(doc.marginX) : ''))}
                    placeholder={String(doc.margin)}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:marginX']: txt }))
                      const v = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(v)) {
                        setDoc(d=>{
                          if (d.startPreset && d.startPreset !== 'custom') {
                            const my = Number.isFinite(d.marginY) ? d.marginY : d.margin
                            const { x, y } = computeStart(d.startPreset, d.width, d.height, v, my, d.startUseMargin)
                            return { ...d, marginX: v, startX: x, startY: y }
                          }
                          return { ...d, marginX: v }
                        })
                      }
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:marginX']; return n })}
                  />
                </label>
                <label className="flex flex-col gap-1" title="Override vertical margin (mm). Falls back to Margin if blank.">Margin Y (optional)
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:marginY'] ?? (Number.isFinite(doc.marginY)? String(doc.marginY) : ''))}
                    placeholder={String(doc.margin)}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:marginY']: txt }))
                      const v = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(v)) {
                        setDoc(d=>{
                          if (d.startPreset && d.startPreset !== 'custom') {
                            const mx = Number.isFinite(d.marginX) ? d.marginX : d.margin
                            const { x, y } = computeStart(d.startPreset, d.width, d.height, mx, v, d.startUseMargin)
                            return { ...d, marginY: v, startX: x, startY: y }
                          }
                          return { ...d, marginY: v }
                        })
                      }
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:marginY']; return n })}
                  />
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1" title="Stroke width (mm) used in preview and SVG export.">Stroke
                  <input className="input" type="text" inputMode="decimal" value={(numEdit['D:stroke'] ?? String(doc.strokeWidth))}
                    onChange={e=>{
                      const txt = e.target.value
                      setNumEdit(m=>({ ...m, ['D:stroke']: txt }))
                      const v = parseFloat(txt)
                      if (txt !== '' && Number.isFinite(v)) setDoc(d=>({...d, strokeWidth: v}))
                    }}
                    onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n['D:stroke']; return n })}
                  />
                </label>
                <label className="flex items-center gap-2" title="Faster previews by reducing samples/steps. Use the Quality slider to trade speed for detail.">
                  <input type="checkbox" className="w-4 h-4" checked={!!doc.fastPreview} onChange={e=>setDoc(d=>({...d,fastPreview:e.target.checked}))} />
                  Fast Preview
                </label>
                <label className="flex flex-col gap-1" title="Preview quality factor (0.2–1). Lower values are faster but less detailed.">Quality
                  <input className="input" type="range" min="0.2" max="1" step="0.05" value={doc.previewQuality} onChange={e=>setDoc(d=>({...d,previewQuality:+e.target.value}))} disabled={!doc.fastPreview} />
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-1 min-[520px]:grid-cols-2 gap-3">
                <label className={labelClass} title="Paper color used for preview background (also exported in SVG as background rectangle if desired).">
                  <span>Paper Color</span>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.bg} onChange={e=>setDoc(d=>({...d,bg:e.target.value}))} />
                    {!superCompact && (<code className="text-[10px] opacity-70">{doc.bg}</code>)}
                  </div>
                </label>
                <label className={labelClass} title="Viewport background color around the paper (for contrast and comfort).">
                  <span>Viewport Background</span>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.appBg} onChange={e=>setDoc(d=>({...d,appBg:e.target.value}))} />
                    {!superCompact && (<code className="text-[10px] opacity-70">{doc.appBg}</code>)}
                  </div>
                </label>
                <label className={labelClass} title="Preview-only color for the paper border (toggle below).">
                  <span>Border Color</span>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.paperBorderColor} onChange={e=>setDoc(d=>({...d,paperBorderColor:e.target.value}))} disabled={!doc.showPaperBorder} />
                    {!superCompact && (<code className="text-[10px] opacity-70">{doc.paperBorderColor}</code>)}
                  </div>
                  <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
                    <input type="checkbox" className="w-4 h-4" checked={!!doc.showPaperBorder} onChange={e=>setDoc(d=>({...d,showPaperBorder:e.target.checked}))} />
                    Show Paper Border
                  </label>
                </label>
                <label className={labelClass} title="Preview-only color for the margin border (toggle below).">
                  <span>Margin Border Color</span>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border border-white/10" value={doc.marginBorderColor} onChange={e=>setDoc(d=>({...d,marginBorderColor:e.target.value}))} disabled={!doc.showMarginBorder} />
                    {!superCompact && (<code className="text-[10px] opacity-70">{doc.marginBorderColor}</code>)}
                  </div>
                  <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
                    <input type="checkbox" className="w-4 h-4" checked={!!doc.showMarginBorder} onChange={e=>setDoc(d=>({...d,showMarginBorder:e.target.checked}))} />
                    Show Margin Border
                  </label>
                </label>
              </div>
              <div className="col-span-2 lg:col-span-3 grid grid-cols-1 gap-2">
                <label className={labelClass} title="Clip the output to the paper or margin rectangle when exporting.">
                  <span>Output Clip</span>
                  <Select value={doc.clipOutput || 'none'} onChange={(v)=>setDoc(d=>({ ...d, clipOutput: v }))}
                    options={[{label:'None', value:'none'},{label:'Paper', value:'paper'},{label:'Margin', value:'margin'}]}
                  />
                </label>
              </div>
              <div className="col-span-2 flex items-end gap-2">
                <label className="flex-1 flex flex-col gap-1" title="Random seed used by many generators. Change then regenerate to explore.">Seed
                  <input className="input" value={doc.seed} onChange={e=>setDoc(d=>({...d,seed:e.target.value}))}/>
                </label>
                <button className="btn" title="Randomize" onClick={regenerateSeed}><Icon path={mdiShuffleVariant}/></button>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10"><h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiImageMultipleOutline}/> <span>Import</span></h2></div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 items-start mt-2">
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onImageFilePicked} />
          </div>

          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10"><h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiExportVariant}/> <span>Export</span></h2></div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-2 items-start mt-2">
            <div className="flex gap-2 col-span-2 lg:col-span-1">
              <button className="btn flex-1" onClick={downloadSVGs} title="Export SVG Layers (ZIP)">
                {compactUI ? (<><Icon path={mdiContentSave}/> SVG</>) : (<><Icon path={mdiContentSave}/> Export SVG Layers (ZIP)</>)}
              </button>
            </div>
            <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
              <Select
                className="flex-1"
                value={doc.exportMode}
                onChange={v=>setDoc(d=>({...d,exportMode:v}))}
                prefix={<Icon path={doc.exportMode === 'combined' ? mdiFileCode : (doc.exportMode === 'colors' ? mdiPalette : mdiZipBox)} />}
                variant="button"
                tooltip="Choose how G-code files are grouped: Per Layer (ZIP), Per Color (ZIP), or a single Combined file."
                options={[
                  { label: '[ZIP] Per Layer', value: 'layers' },
                  { label: '[ZIP] Per Color', value: 'colors' },
                  { label: '[Single] Combined', value: 'combined' }
                ]}
              />
              <button className="btn flex-1" onClick={downloadGcode} title="Export G-code using selected mode">
                {compactUI ? (<><Icon path={mdiFileCode}/> G-code</>) : (<><Icon path={mdiFileCode}/> Export G-code</>)}
              </button>
            </div>
            <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
              <button className="btn flex-1" onClick={exportPreset} title="Save Setup">
                {compactUI ? (<><Icon path={mdiContentSave}/> Save</>) : (<><Icon path={mdiContentSave}/> Save Setup</>)}
              </button>
              <button className="btn flex-1" onClick={openImport} title="Load Setup">
                {compactUI ? (<><Icon path={mdiFolderOpen}/> Load</>) : (<><Icon path={mdiFolderOpen}/> Load Setup</>)}
              </button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </div>
            <div className="flex gap-2 items-center col-span-2 lg:col-span-2">
              <button className="btn flex-1" onClick={()=>{ setPhotoMode('mono'); photoRef.current?.click() }}>
                {compactUI ? (<><Icon path={mdiImageMultipleOutline}/> Mono</>) : (<><Icon path={mdiImageMultipleOutline}/> Photo → Mono Halftone</>)}
              </button>
              <button className="btn flex-1" onClick={()=>{ setPhotoMode('cmyk'); photoRef.current?.click() }}>
                {compactUI ? (<><Icon path={mdiPalette}/> CMYK</>) : (<><Icon path={mdiPalette}/> Photo → CMYK Halftone</>)}
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
            </div>
            <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur py-2 border-b border-white/10 col-span-2 lg:col-span-3 mt-2"><h2 className="font-medium px-1 flex items-center gap-2"><Icon path={mdiLightbulbOutline}/> <span>Examples</span></h2></div>
            <div className="flex gap-2 items-center col-span-2 lg:col-span-3">
              <Select className="flex-1" value={selectedExample}
                onChange={(v)=>setSelectedExample(v)}
                options={[{ label: '(Examples)', value: '' }, ...examples.map(e => ({ label: e.label, value: e.file }))]}
              />
              <button className="btn" onClick={()=>loadExample(selectedExample)} disabled={!selectedExample} title="Load Example">
                {compactUI ? (<><Icon path={mdiFolderOpen}/> Load</>) : (<><Icon path={mdiFolderOpen}/> Load Example</>)}
              </button>
              <button className="btn" onClick={setDefaultExample} disabled={!selectedExample} title="Set Default Example">
                {compactUI ? (<><Icon path={mdiStarPlus}/> Set</>) : (<><Icon path={mdiStarPlus}/> Set Default</>)}
              </button>
              <button className="btn" onClick={clearDefaultExample} title="Clear Default Example">
                {compactUI ? (<><Icon path={mdiStarOff}/> Clear</>) : (<><Icon path={mdiStarOff}/> Clear Default</>)}
              </button>
            </div>
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
          </div>

          <div className="sticky top-0 z-10 bg-panel/95 backdrop-blur flex items-center justify-between py-2 mt-4 border-b border-white/10">
            <h2 className="font-medium flex items-center gap-2"><Icon path={mdiLayersOutline}/> <span>Layers</span></h2>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>setAllLayersCollapsed(true)} title="Collapse All">
                {compactUI ? (<Icon path={mdiArrowCollapseVertical}/>) : (<><Icon path={mdiArrowCollapseVertical}/> Collapse All</>)}
              </button>
              <button className="btn" onClick={()=>setAllLayersCollapsed(false)} title="Expand All">
                {compactUI ? (<Icon path={mdiArrowExpandVertical}/>) : (<><Icon path={mdiArrowExpandVertical}/> Expand All</>)}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {layers.map((layer, idx) => (
              <div key={layer.id} className="rounded-lg border border-white/5 bg-black/20">
                <header className={`relative flex items-center justify-between ${compactUI ? 'px-2 py-1' : 'px-3 py-2'} border-b border-white/5`}>
                  <div className="flex items-center gap-2">
                    <button className="icon" onClick={()=>toggleVisible(layer.id)} title={layer.visible? 'Hide' : 'Show'}>
                      <Icon path={layer.visible? mdiEye : mdiEyeOff} />
                    </button>
                    <input className="bg-transparent outline-none text-sm font-medium" value={layer.name} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,name:e.target.value}:l))}/>
                    {compactUI && (
                      <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                        {GENERATORS[layer.generator]?.name || layer.generator}
                      </span>
                    )}
                  </div>
                  <div className={`flex flex-wrap items-center ${compactUI ? 'gap-1' : 'gap-2'}`}>
                    <button className="icon" title={layer.uiCollapsed ? 'Expand' : 'Collapse'}
                      onClick={()=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,uiCollapsed:!l.uiCollapsed}:l))}>
                      <Icon path={layer.uiCollapsed ? mdiPlus : mdiMinus} />
                    </button>
                    {!compactUI && (
                      <Select className="w-auto" value={layer.generator} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,generator:v,params:{...GENERATORS[v].params}}:l))}
                        options={Object.entries(GENERATORS).map(([k,v])=>({ label: v.name, value: k }))}
                        tooltip="Change this layer's generator. Switching resets its parameters to sensible defaults."
                      />
                    )}
                    {compactUI ? (
                      <input type="color" className="w-8 h-8 rounded border border-white/10 flex-shrink-0" value={layer.color} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:e.target.value}:l))} title="Pick color" />
                    ) : (
                      <>
                        <Select className="w-auto" value={layer.color} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:v}:l))}
                          options={COLOR_OPTIONS}
                          tooltip="Choose a palette color. Use the picker next to it for a custom value."
                        />
                        <input type="color" className="w-8 h-8 rounded border border-white/10 flex-shrink-0" value={layer.color} onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,color:e.target.value}:l))} title="Pick color" />
                      </>
                    )}
                    {/* Status chips */}
                    {(() => {
                      const p = layer.params || {}
                      let chip = null
                      if (p.clipLayerId) {
                        const src = layers.find(l=>l.id===p.clipLayerId)
                        const mode = p.clipMode || 'all'
                        const modeText = (mode === 'largest')
                          ? 'Largest'
                          : (mode === 'index'
                              ? (Array.isArray(p.clipIndices) && p.clipIndices.length ? '#' + p.clipIndices.join(',#') : `#${Math.max(0, Math.floor(p.clipIndex||0))}`)
                              : 'All')
                        chip = `Clip: ${src ? src.name : 'Layer'} · ${modeText}`
                      } else if (p.clipToPrevious) {
                        const mode = p.clipMode || 'all'
                        const modeText = (mode === 'largest')
                          ? 'Largest'
                          : (mode === 'index'
                              ? (Array.isArray(p.clipIndices) && p.clipIndices.length ? '#' + p.clipIndices.join(',#') : `#${Math.max(0, Math.floor(p.clipIndex||0))}`)
                              : 'All')
                        chip = `Clip: Prev · ${modeText}`
                      }
                      return chip ? (<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{chip}</span>) : null
                    })()}
                    {layer.generator === 'hatchFill' && layer.params?.cross && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Cross</span>
                    )}
                    {(() => {
                      const p = layer.params || {}
                      const rule = (p.clipRule || 'union')
                      if (!p.clipLayerId && !p.clipToPrevious) return null
                      if (rule === 'union') return null
                      const label = rule === 'evenodd' ? 'Even-Odd' : (rule.charAt(0).toUpperCase()+rule.slice(1))
                      return (<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">Rule: {label}</span>)
                    })()}
                    <button className="icon" title="More" onClick={(e)=>{ e.stopPropagation(); setLayerMenuId(id => id===layer.id ? null : layer.id) }}>
                      <Icon path={mdiDotsVertical}/>
                    </button>
                    {layerMenuId === layer.id && (
                      <div className="absolute right-2 top-full mt-2 z-30 bg-zinc-800 border border-white/10 rounded-md shadow-soft min-w-[160px]"
                        onClick={(e)=>e.stopPropagation()}>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ downloadLayerSvg(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiContentSave}/> <span>Save SVG</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ moveLayer(layer.id,-1); setLayerMenuId(null) }}>
                          <Icon path={mdiArrowUp}/> <span>Move Up</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ moveLayer(layer.id,1); setLayerMenuId(null) }}>
                          <Icon path={mdiArrowDown}/> <span>Move Down</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2" onClick={()=>{ fitToLayer(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiCrosshairsGps}/> <span>Zoom to Layer</span>
                        </div>
                        <div className="px-2 py-1 hover:bg-white/10 cursor-pointer flex items-center gap-2 text-red-300" onClick={()=>{ removeLayer(layer.id); setLayerMenuId(null) }}>
                          <Icon path={mdiDelete}/> <span>Delete</span>
                        </div>
                      </div>
                    )}
                  </div>
                </header>
                {!layer.uiCollapsed && (
                  <div className={`p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${compactUI ? 'gap-1' : 'gap-2'} text-sm`}>
                  {compactUI && (
                    <label className={labelClass}>
                      Generator
                      <Select value={layer.generator} onChange={v=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,generator:v,params:{...GENERATORS[v].params}}:l))}
                        options={Object.entries(GENERATORS).map(([k,v])=>({ label: v.name, value: k }))}
                        tooltip="Change this layer's generator. Switching resets its parameters to sensible defaults."
                      />
                    </label>
                  )}
                  {/* Grouped controls for MDI Icon Field */}
                  {layer.generator === 'mdiIconField' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">MDI Icon Field</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'mdiIconField')}>{isGroupOpen(layer.id,'mdiIconField')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'mdiIconField') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Icons (CSV)
                            <input className="input" type="text" placeholder="mdiFlower,mdiRobot"
                              value={(numEdit[`L:${layer.id}:namesCsv`] ?? (layer.params.namesCsv ?? ''))}
                              onChange={e=>{
                                const txt = e.target.value
                                setNumEdit(m=>({ ...m, [`L:${layer.id}:namesCsv`]: txt }))
                              }}
                              onBlur={e=>{
                                const txt = e.target.value
                                setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:namesCsv`]; return n })
                                setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,namesCsv: txt}}:l))
                              }}
                            />
                          </label>
                          <div className="flex items-end">
                            <button className="btn" onClick={()=>{
                              setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:namesCsv`]; return n })
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,namesCsv: ''}}:l))
                            }}>
                              <Icon path={mdiEraser}/> {compactUI ? 'Clear' : 'Clear list'}
                            </button>
                          </div>
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'scaleMin','ScaleMin')}
                          {renderNumParam(layer,'scaleMax','ScaleMax')}
                          {renderNumParam(layer,'rotationJitter','RotationJitter')}
                          {renderNumParam(layer,'samples','Samples')}
                          {renderNumParam(layer,'margin','Margin')}
                          {renderNumParam(layer,'simplifyTol','SimplifyTol')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Hatch Fill */}
                  {layer.generator === 'hatchFill' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Hatch Fill</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'hatchFill')}>{isGroupOpen(layer.id,'hatchFill')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'hatchFill') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'offset','Offset')}
                          {renderNumParam(layer,'crossOffset','CrossOffset')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone core sampling */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Core</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneCore')}>{isGroupOpen(layer.id,'halftoneCore')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneCore') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'segment','Segment')}
                          {renderNumParam(layer,'gamma','Gamma')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone dots & radial options */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Dots / Radial</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneDots')}>{isGroupOpen(layer.id,'halftoneDots')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneDots') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'dotMin','DotMin')}
                          {renderNumParam(layer,'dotMax','DotMax')}
                          {renderNumParam(layer,'dotAspect','DotAspect')}
                          {renderNumParam(layer,'radialCenterX','RadialCenterX')}
                          {renderNumParam(layer,'radialCenterY','RadialCenterY')}
                          {renderNumParam(layer,'angStepDeg','AngStepDeg')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Halftone squiggle */}
                  {layer.generator === 'halftone' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Halftone · Squiggle</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'halftoneSquiggle')}>{isGroupOpen(layer.id,'halftoneSquiggle')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'halftoneSquiggle') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'squiggleAmp','SquiggleAmp')}
                          {renderNumParam(layer,'squigglePeriod','SquigglePeriod')}
                          {renderNumParam(layer,'squiggleJitterAmp','JitterAmp')}
                          {renderNumParam(layer,'squiggleJitterScale','JitterScale')}
                          {renderNumParam(layer,'squigglePhaseJitter','PhaseJitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for MDI Pattern */}
                  {layer.generator === 'mdiPattern' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">MDI Pattern</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'mdiPattern')}>{isGroupOpen(layer.id,'mdiPattern')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'mdiPattern') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'scale','Scale')}
                          {renderNumParam(layer,'rotation','Rotation')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'samples','Samples')}
                          {renderNumParam(layer,'margin','Margin')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Pixel Mosaic */}
                  {layer.generator === 'pixelMosaic' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Pixel Mosaic</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'pixelMosaic')}>{isGroupOpen(layer.id,'pixelMosaic')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'pixelMosaic') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          {renderNumParam(layer,'density','Density')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          {renderNumParam(layer,'levels','Levels')}
                          {renderNumParam(layer,'margin','Margin')}
                          {renderNumParam(layer,'simplifyTol','SimplifyTol')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for SVG Import transform */}
                  {layer.generator === 'svgImport' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">SVG Import · Transform</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'svgTransform')}>{isGroupOpen(layer.id,'svgTransform')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'svgTransform') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'scale','Scale')}
                          {renderNumParam(layer,'rotateDeg','RotateDeg')}
                          {renderNumParam(layer,'offsetX','OffsetX')}
                          {renderNumParam(layer,'offsetY','OffsetY')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for L-system */}
                  {layer.generator === 'lsystem' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">L-system</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'lsys')}>{isGroupOpen(layer.id,'lsys')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'lsys') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Preset
                            <Select value={layer.params.preset || 'koch'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, preset:v}}:l))}
                              options={[{label:'Koch snowflake',value:'koch'},{label:'Dragon',value:'dragon'},{label:'Plant',value:'plant'}]}
                            />
                          </label>
                          {renderNumParam(layer,'iterations','Iterations')}
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'step','Step')}
                          {renderNumParam(layer,'jitter','Jitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Truchet */}
                  {layer.generator === 'truchet' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Truchet Tiles</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'truchet')}>{isGroupOpen(layer.id,'truchet')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'truchet') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'cols','Cols')}
                          {renderNumParam(layer,'rows','Rows')}
                          <label className={labelClass}>Variant
                            <Select value={layer.params.variant || 'curves'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, variant:v}}:l))}
                              options={[{label:'Curves (quarter-circles)',value:'curves'},{label:'Lines (diagonals)',value:'lines'}]}
                            />
                          </label>
                          {renderNumParam(layer,'jitter','Jitter')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Phyllotaxis */}
                  {layer.generator === 'phyllotaxis' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Phyllotaxis</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'phyl')}>{isGroupOpen(layer.id,'phyl')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'phyl') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {renderNumParam(layer,'count','Count')}
                          {renderNumParam(layer,'spacing','Spacing')}
                          {renderNumParam(layer,'angleDeg','AngleDeg')}
                          {renderNumParam(layer,'jitter','Jitter')}
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.connect}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, connect:e.target.checked}}:l))} />
                            Connect seeds (single path)
                          </label>
                          {renderNumParam(layer,'dotSize','DotSize')}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Path Warp (links to another layer) */}
                  {layer.generator === 'pathWarp' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Path Warp (link to source layer)</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'warp')}>{isGroupOpen(layer.id,'warp')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'warp') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelClass}>Source Layer
                            <Select value={layer.params.srcLayerId || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcLayerId:v, srcToPrevious:false}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.srcToPrevious} disabled={!!layer.params.srcLayerId}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcToPrevious:e.target.checked}}:l))} />
                            Or: use previous visible layer
                          </label>
                          {renderNumParam(layer,'amp','Amplitude')}
                          {renderNumParam(layer,'scale','NoiseScale')}
                          {renderNumParam(layer,'step','ResampleStep')}
                          {renderNumParam(layer,'copies','Copies')}
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.rotateFlow}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, rotateFlow:e.target.checked}}:l))} />
                            Use vector field (ignore tangent)
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Grouped controls for Image-based generators: Halftone, Pixel Mosaic, Image Contours, Poisson Stipple, TSP Art */}
                  {(['halftone','pixelMosaic','imageContours','poissonStipple','tspArt'].includes(layer.generator)) && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Image Source</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'img')}>{isGroupOpen(layer.id,'img')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'img') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <div className="flex items-center gap-2">
                            <button className="btn" onClick={()=>openImageForLayer(layer.id)}>Load Image</button>
                            <button className="btn" disabled={!bitmaps[layer.id]} onClick={()=>clearLayerImage(layer.id)}>Clear</button>
                          </div>
                          <div className="text-xs opacity-70 col-span-2">
                            {layer.params?.imageInfo ? `Loaded: ${layer.params.imageInfo}` : 'No image loaded'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {layer.generator === 'combinator' && (
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Combinator Sources</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'comb')}>{isGroupOpen(layer.id,'comb')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'comb') && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <label className={labelClass}>Source A
                            <Select value={layer.params.srcA || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcA:v}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelClass}>Source B
                            <Select value={layer.params.srcB || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, srcB:v}}:l))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelClass}>Operation
                            <Select value={layer.params.op || 'intersect'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, op:v}}:l))}
                              options={[
                                { label:'Intersect', value:'intersect' },
                                { label:'Union', value:'union' },
                                { label:'Difference (A - B)', value:'difference' },
                                { label:'XOR', value:'xor' }
                              ]}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  {Object.entries(GENERATORS[layer.generator].params).map(([k,def]) => {
                    // Skip clip UI keys we render via custom block for these generators
                    if ((layer.generator === 'hatchFill' || layer.generator === 'halftone' || layer.generator === 'mdiPattern' || layer.generator === 'svgImport') && (
                      k === 'clipToPrevious' || k === 'clipLayerId' || k === 'clipMode' || k === 'clipIndex' || k === 'clipRule'
                    )) return null
                    // Skip keys we render in grouped blocks
                    if (layer.generator === 'mdiIconField' && (
                      ['namesCsv','rows','cols','spacing','jitter','scaleMin','scaleMax','rotationJitter','samples','margin','simplifyTol'].includes(k)
                    )) return null
                    if (layer.generator === 'hatchFill' && (
                      ['angleDeg','spacing','offset','crossOffset'].includes(k)
                    )) return null
                    if (layer.generator === 'halftone' && (
                      ['angleDeg','spacing','segment','gamma','dotMin','dotMax','dotAspect','radialCenterX','radialCenterY','angStepDeg','squiggleAmp','squigglePeriod','squiggleJitterAmp','squiggleJitterScale','squigglePhaseJitter'].includes(k)
                    )) return null
                    if (layer.generator === 'svgImport' && (
                      ['scale','rotateDeg','offsetX','offsetY'].includes(k)
                    )) return null
                    if (layer.generator === 'lsystem' && (
                      ['preset'].includes(k)
                    )) return null
                    if (layer.generator === 'truchet' && (
                      ['variant','cols','rows','jitter'].includes(k)
                    )) return null
                    if (layer.generator === 'phyllotaxis' && (
                      ['connect','count','spacing','angleDeg','jitter','dotSize'].includes(k)
                    )) return null
                    if (layer.generator === 'pathWarp' && (
                      ['srcLayerId','srcToPrevious','amp','scale','step','copies','rotateFlow'].includes(k)
                    )) return null
                    if (k === 'imageInfo') return null
                    if (layer.generator === 'mdiPattern' && (
                      ['cols','rows','spacing','scale','rotation','jitter','samples','margin'].includes(k)
                    )) return null
                    if (layer.generator === 'pixelMosaic' && (
                      ['cols','rows','density','jitter','levels','margin','simplifyTol'].includes(k)
                    )) return null
                    if (layer.generator === 'combinator' && (
                      ['srcA','srcB','op'].includes(k)
                    )) return null
                    // Boolean controls
                    if (typeof def === 'boolean') {
                      // Avoid duplicate 'Clip To Previous' control: we render a custom section below
                      if ((layer.generator === 'hatchFill' || layer.generator === 'halftone') && k === 'clipToPrevious') return null
                      return (
                        <label key={k} className={labelRowClass}>
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params[k]}
                            onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,[k]:e.target.checked}}:l))} />
                          {k.replace(/([A-Z])/g,' $1')}
                        </label>
                      )
                    }
                    if (layer.generator === 'pixelMosaic' && k === 'style') {
                      return (
                        <label key={k} className={labelClass}>
                          Style
                          <Select value={layer.params.style}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,style:v}}:l))}
                            options={[
                              { label: 'Squares', value: 'squares' },
                              { label: 'Cross', value: 'cross' },
                              { label: 'Plus', value: 'plus' },
                              { label: 'Random', value: 'random' }
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'shape') {
                      return (
                        <label key={k} className={labelClass}>
                          Shape
                          <Select value={layer.params.shape}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,shape:v}}:l))}
                            options={[
                              {label:'Lines (scanline dither)', value:'lines'},
                              {label:'Dots – Circle', value:'circle'},
                              {label:'Dots – Ellipse', value:'ellipse'},
                              {label:'Dots – Square', value:'square'},
                              {label:'Rings (radial)', value:'rings'},
                              {label:'Radial Dots (rings)', value:'radialDots'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'method') {
                      return (
                        <label key={k} className={labelClass}>
                          Method
                          <Select value={layer.params.method}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,method:v}}:l))}
                            options={[
                              {label:'Bayer 8x8',value:'bayer'},
                              {label:'Threshold 0.5',value:'threshold'},
                              {label:'Floyd–Steinberg',value:'floyd'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'halftone' && k === 'squiggleMode') {
                      return (
                        <label key={k} className={labelClass}>
                          Squiggle Mode
                          <Select value={layer.params.squiggleMode}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,squiggleMode:v}}:l))}
                            options={[
                              {label:'Sine', value:'sine'},
                              {label:'Zigzag', value:'zigzag'}
                            ]}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'mdiPattern' && k === 'iconIndex') {
                      return (
                        <label key={k} className={labelClass}>
                          Icon
                          <Select value={layer.params.iconIndex}
                            onChange={(idx)=>{
                              const name = mdiIconOptions[idx]?.name || layer.params.iconName
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,iconIndex:idx,iconName:name}}:l))
                            }}
                            options={mdiIconOptions.map(o=>({label:o.label,value:o.value}))}
                          />
                        </label>
                      )
                    }
                    if (layer.generator === 'mdiPattern' && k === 'iconName') {
                      return (
                        <label key={k} className={labelClass}>
                          Icon Name (e.g. "mdi:robot" or "robot")
                          <input className="input" value={layer.params.iconName}
                            onChange={e=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,iconName:e.target.value}}:l))}/>
                        </label>
                      )
                    }
                    if (layer.generator === 'stripeBands' && k === 'tubeCurve') {
                      return (
                        <label key={k} className={labelClass}>
                          Tube Curve
                          <Select value={layer.params.tubeCurve || 'tri'}
                            onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,tubeCurve:v}}:l))}
                            options={[{label:'Triangular', value:'tri'},{label:'Sine', value:'sin'}]}
                          />
                        </label>
                      )
                    }
                    // Numeric input with ephemeral editing buffer so backspace can clear fully
                    const editKey = `L:${layer.id}:${k}`
                    const displayVal = (numEdit && Object.prototype.hasOwnProperty.call(numEdit, editKey))
                      ? numEdit[editKey]
                      : String(layer.params[k] ?? def)
                    return (
                      <label key={k} className={labelClass}>
                        {k}
                        <input className="input" type="text" inputMode="decimal" value={displayVal}
                          onChange={e=>{
                            const txt = e.target.value
                            setNumEdit(m=>({ ...m, [editKey]: txt }))
                            const v = parseFloat(txt)
                            if (txt !== '' && Number.isFinite(v)) {
                              setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,[k]: v}}:l))
                            }
                          }}
                          onBlur={()=>{
                            setNumEdit(m=>{ const n={...m}; delete n[editKey]; return n })
                          }}
                        />
                      </label>
                    )
                  })}
                  {(
                    <div className="col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs opacity-80">Pattern Fill</span>
                        <button className="icon" onClick={()=>toggleGroup(layer.id,'fill')}>{isGroupOpen(layer.id,'fill')?'–':'+'}</button>
                      </div>
                      {isGroupOpen(layer.id,'fill') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={layer.params.clipEnabled !== false}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l, params:{...l.params, clipEnabled: e.target.checked}}:l))} />
                            Enable Fill
                          </label>
                          <label className={labelClass}>Fill From Layer
                            <Select value={layer.params.clipLayerId || ''}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>{
                                if (l.id!==layer.id) return l
                                return { ...l, params: { ...l.params, clipLayerId: v, clipToPrevious: false } }
                              }))}
                              options={[{label:'(None)', value:''}, ...layers.filter(l=>l.id!==layer.id).map(l=>({label:l.name, value:l.id}))]}
                            />
                          </label>
                          <label className={labelRowClass}>
                            <input type="checkbox" className="w-4 h-4" checked={!!layer.params.clipToPrevious}
                              disabled={!!layer.params.clipLayerId}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipToPrevious:e.target.checked}}:l))} />
                            Or: Use previous visible layer
                          </label>
                          <label className={labelClass}>Clip Mode
                            <Select value={layer.params.clipMode || 'all'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipMode:v}}:l))}
                              options={[{label:'All polygons',value:'all'},{label:'Largest polygon',value:'largest'},{label:'# Index',value:'index'}]}
                            />
                          </label>
                          <label className={labelClass}>Clip Index
                            <input className="input" type="number" min="0" step="1" value={layer.params.clipIndex || 0}
                              onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipIndex:Math.max(0,Math.floor(+e.target.value||0))}}:l))} />
                          </label>
                          <label className={labelClass}>Clip Rule
                            <Select value={layer.params.clipRule || 'union'}
                              onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipRule:v}}:l))}
                              options={[
                                {label:'Union (default)', value:'union'},
                                {label:'Even-Odd', value:'evenodd'},
                                ...((layer.generator==='hatchFill'||layer.generator==='mdiPattern'||layer.generator==='svgImport')
                                  ? [
                                      {label:'Intersect', value:'intersect'},
                                      {label:'Difference (first - others)', value:'difference'}
                                    ] : [])
                              ]}
                            />
                          </label>
                          <div className="col-span-2 flex gap-2">
                            <button className="btn" onClick={()=>setPicker(p => (p.active && p.targetLayerId === layer.id) ? { active: false, targetLayerId: null } : { active: true, targetLayerId: layer.id })}>
                              {picker.active && picker.targetLayerId === layer.id
                                ? (compactUI ? (<><Icon path={mdiCheck}/> Done</>) : (<><Icon path={mdiCheck}/> Done Picking</>))
                                : (compactUI ? (<><Icon path={mdiVectorSelection}/> Pick</>) : (<><Icon path={mdiVectorSelection}/> Pick shape on canvas</>))}
                            </button>
                            {layer.generator === 'svgImport' && (
                              <>
                                {!transform.active || transform.layerId !== layer.id ? (
                                  <button className="btn" onClick={()=>setTransform({ active: true, layerId: layer.id })}>
                                    {compactUI ? (<><Icon path={mdiVectorSquare}/> Transform</>) : (<><Icon path={mdiVectorSquare}/> Transform on canvas</>)}
                                  </button>
                                ) : (
                                  <button className="btn" onClick={()=>setTransform({ active: false, layerId: null })}>
                                    {compactUI ? (<><Icon path={mdiCheck}/> Done</>) : (<><Icon path={mdiCheck}/> Done Transform</>)}
                                  </button>
                                )}
                              </>
                            )}
                            {picker.active && picker.targetLayerId === layer.id && (
                              <span className="text-xs opacity-80 self-center">Click inside a shape to set Clip Layer + Index</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {layer.generator === 'hatchFill' && (layer.params.clipMode || 'all') === 'index' && (
                    <div className="col-span-2 lg:col-span-3 grid grid-cols-1 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs opacity-80">Selected:</span>
                        {(() => {
                          const sel = Array.isArray(layer.params.clipIndices)
                            ? layer.params.clipIndices
                            : (Number.isFinite(layer.params.clipIndex) ? [Math.max(0, Math.floor(layer.params.clipIndex))] : [])
                          return sel.length ? sel.map((idx, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs">
                              #{idx}
                              <button className="icon" title="Remove" onClick={()=>setLayers(ls=>ls.map(l=>{
                                if (l.id!==layer.id) return l
                                const arr = sel.filter(v=>v!==idx)
                                return { ...l, params: { ...l.params, clipIndices: arr } }
                              }))}><Icon path={mdiClose}/></button>
                            </span>
                          )) : (<span className="text-xs opacity-60">(none)</span>)
                        })()}
                        <button className="btn" onClick={()=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipIndices:[]}}:l))}>
                          <Icon path={mdiEraser}/> {compactUI ? 'Clear' : 'Clear indices'}
                        </button>
                      </div>
                      <label className={labelClass}>Clip Indices (CSV)
                        <input className="input" type="text" value={(numEdit[`L:${layer.id}:clipCsv`] ?? (Array.isArray(layer.params.clipIndices)? layer.params.clipIndices.join(',') : ''))}
                          onChange={(e)=>{
                            const txt = e.target.value
                            setNumEdit(m=>({ ...m, [`L:${layer.id}:clipCsv`]: txt }))
                            const parts = String(txt).split(/[;\,\s]+/).filter(Boolean)
                            const arr = Array.from(new Set(parts.map(t=>Math.max(0, Math.floor(+t||0))).filter(n=>Number.isFinite(n))))
                            setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,clipIndices:arr}}:l))
                          }}
                          onBlur={()=>setNumEdit(m=>{ const n={...m}; delete n[`L:${layer.id}:clipCsv`]; return n })}
                        />
                      </label>
                    </div>
                  )}
                  {layer.generator === 'isoContours' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...isoPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Hourglass', value:'hourglass'},
                            {label:'Lens', value:'lens'},
                            {label:'Bulb', value:'bulb'},
                            {label:'Triple', value:'triple'},
                          ]}
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button className="btn" onClick={()=>fitIsoSeparation(layer.id)}><Icon path={mdiFitToPageOutline}/> {compactUI ? 'Fit Sep' : 'Fit Separation'}</button>
                      </div>
                    </div>
                  )}
                  {layer.generator === 'quasicrystalContours' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...qcPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Star (7)', value:'star-7'},
                            {label:'Bloom (9)', value:'bloom-9'},
                            {label:'Flower (5)', value:'flower-5'},
                          ]}
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4" checked={!!layer.params.animatePhase}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,animatePhase:e.target.checked}}:l))}/>
                        Animate Phase
                      </label>
                      <label className="flex flex-col gap-1">Phase Speed
                        <input className="input" type="range" min="-4" max="4" step="0.05" value={layer.params.phaseSpeed ?? 1}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,phaseSpeed:+e.target.value}}:l))} />
                      </label>
                    </div>
                  )}
                  {layer.generator === 'superformulaRings' && (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">Preset
                        <Select value={layer.params.presetName || ''}
                          onChange={(v)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params, ...superPresetValues(v), presetName: v}}:l))}
                          options={[
                            {label:'(None)', value:''},
                            {label:'Star', value:'star'},
                            {label:'Gear', value:'gear'},
                            {label:'Petal', value:'petal'},
                            {label:'Bloom', value:'bloom'},
                            {label:'Spiky', value:'spiky'},
                          ]}
                        />
                      </label>
                      <label className="flex flex-col gap-1">Morph
                        <input className="input" type="range" min="0" max="1" step="0.01" value={layer.params.morph ?? 0}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,morph:+e.target.value}}:l))} />
                      </label>
                      <label className="flex flex-col gap-1">Twist (deg/ring)
                        <input className="input" type="range" min="-45" max="45" step="1" value={layer.params.twistDeg ?? 0}
                          onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,twistDeg:+e.target.value}}:l))} />
                      </label>
                      <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params.n23Lock}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,n23Lock:e.target.checked}}:l))} />
                          Lock n2 = n3
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={layer.params.mRound ?? true}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,mRound:e.target.checked}}:l))} />
                          Round m
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={!!layer.params.mEven}
                            onChange={(e)=>setLayers(ls=>ls.map(l=>l.id===layer.id?{...l,params:{...l.params,mEven:e.target.checked}}:l))} />
                          Force even m
                        </label>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="p-4 h-screen overflow-hidden flex flex-col" style={{ background: doc.appBg }}>
        <div ref={stageRef} className={`min-h-[360px] rounded-xl shadow-soft flex-1 flex items-start justify-center relative select-none overscroll-contain overflow-hidden ${ (spaceDown || isPanning) ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' } ${doc.showGrid ? 'bg-grid' : ''}`}
          style={{ backgroundColor: doc.appBg, backgroundSize: doc.showGrid ? `${doc.gridSizePx || 12}px ${doc.gridSizePx || 12}px` : undefined, '--grid-color': gridDotColor }}
          onWheel={onWheelPreview} onWheelCapture={onWheelPreview}>
          <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur rounded-md px-2 py-1 flex items-center gap-2">
            <button className="btn" onClick={()=>setDoc(d=>({...d, previewZoom: Math.max(0.2, (d.previewZoom||1)*0.9)}))}>-</button>
            <input type="range" min="0.2" max="8" step="0.05" value={doc.previewZoom||1} onChange={e=>setDoc(d=>({...d, previewZoom: +e.target.value}))}/>
            <button className="btn" onClick={()=>setDoc(d=>({...d, previewZoom: Math.min(8, (d.previewZoom||1)*1.1)}))}>+</button>
            <button className="btn" onClick={()=>fitPreview(true)} title="Fit to page"><Icon path={mdiFitToPageOutline}/> {compactUI? null : 'Fit'}</button>
            <button className="btn" onClick={fitToContent} title="Fit to content"><Icon path={mdiSelectAll}/> {compactUI? null : 'Content'}</button>
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
            {picker.active && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/10">Pick: click to select • Shift+Click to add/remove</span>
            )}
            {/* Progress UI moved out of toolbar to avoid interfering with sliders */}
            <button className="btn" title={doc.showToolpathControls? 'Hide G-code settings' : 'Show G-code settings'} onClick={()=>setDoc(d=>({...d, showToolpathControls: !d.showToolpathControls}))}>
              {doc.showToolpathControls ? 'Hide G-code ↓' : 'G-code ↑'}
            </button>
          </div>
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
