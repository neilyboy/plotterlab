// Central generator registry: maps generator keys to { name, fn, params }

// Plugin registry (mutable)
const PLUGIN_GENERATORS = {}

// Public API: register a new generator at runtime
export function registerGenerator(key, def) {
  if (!key || typeof key !== 'string') return
  if (!def || typeof def.fn !== 'function') return
  PLUGIN_GENERATORS[key] = {
    name: def.name || key,
    fn: def.fn,
    params: def.params || {}
  }
}

// Accessor that merges built-ins with plugins
export function getGenerators() {
  return { ...GENERATORS, ...PLUGIN_GENERATORS }
}

// Optional: expose a small global for drop-in plugins loaded via <script>
if (typeof window !== 'undefined') {
  window.Plotterlab = window.Plotterlab || {}
  window.Plotterlab.registerGenerator = registerGenerator
  window.Plotterlab.getGenerators = getGenerators
}
// This keeps the renderer and other subsystems in sync without duplicating imports.

import { hatchFill } from './hatchFill.js'
import { halftone } from './halftone.js'
import { mdiPattern } from './mdiPattern.js'
import { mdiIconField } from './mdiIconField.js'
import { pixelMosaic } from './pixelMosaic.js'
import { isoContours } from './isoContours.js'
import { superformulaRings } from './superformula.js'
import { waveMoire } from './waveMoire.js'
import { streamlines } from './streamlines.js'
import { reactionContours } from './reactionContours.js'
import { quasicrystalContours } from './quasicrystalContours.js'
import { stripeBands } from './stripeBands.js'
import { polarStarburst } from './polarStarburst.js'
import { flowField } from './flowField.js'
import { flowRibbons } from './flowRibbons.js'
import { retroPipes } from './retroPipes.js'
import { starLattice } from './starLattice.js'
import { spirograph } from './spirograph.js'
import { isometricCity } from './isometricCity.js'
import { voronoiShatter } from './voronoiShatter.js'
import { svgImport } from './svgImport.js'
import { lsystem } from './lsystem.js'
import { phyllotaxis } from './phyllotaxis.js'
import { truchet } from './truchet.js'
import { hilbert } from './hilbert.js'
import { pathWarp } from './pathWarp.js'
import { imageContours } from './imageContours.js'
import { poissonStipple } from './poissonStipple.js'
import { tspArt } from './tspArt.js'
import { harmonograph } from './harmonograph.js'
import { deJong } from './deJong.js'
import { maze } from './maze.js'
import { reactionStrokes } from './reactionStrokes.js'
import { clifford } from './clifford.js'
import { sunflowerBands } from './sunflowerBands.js'
import { combinator } from './combinator.js'
import { roseCurve } from './roseCurve.js'
import { superellipse } from './superellipse.js'
import { barnsleyFern } from './barnsleyFern.js'
import { lorenzAttractor } from './lorenz.js'
import { rosslerAttractor } from './rossler.js'
import { sierpinski } from './sierpinski.js'
import { cycloid } from './cycloid.js'
import { penroseLike } from './penroseLike.js'
import { thomasAttractor } from './thomas.js'
import { aizawaAttractor } from './aizawa.js'
import { halvorsenAttractor } from './halvorsen.js'
import { ikedaMap } from './ikeda.js'
import { henonMap } from './henon.js'
import { rucklidgeAttractor } from './rucklidge.js'
import { circlePacking } from './circlePacking.js'
import { torusKnot } from './torusKnot.js'
import { lissajousGrid } from './lissajousGrid.js'
import { hopalong } from './hopalong.js'
import { gumowskiMira } from './gumowskiMira.js'
import { lozi } from './lozi.js'
import { superellipseGrid } from './superellipseGrid.js'

// Built-in generators (static)
export const GENERATORS = {
  spirograph: { name: 'Spirograph', fn: spirograph, params: { R: 120, r: 35, d: 50, turns: 1300, step: 0.02, centerX: 210, centerY: 148, scale: 1, simplifyTol: 0 } },
  roseCurve: { name: 'Rose Curve', fn: roseCurve, params: { kNumerator: 5, kDenominator: 2, a: 120, phaseDeg: 0, turns: 6, step: 0.01, centerX: 210, centerY: 148, variant: 'cos', simplifyTol: 0 } },
  polarStarburst: { name: 'Polar Starburst', fn: polarStarburst, params: { spikes: 72, spreadDeg: 6, linesPerSpike: 1, inner: 8, outer: null, jitterDeg: 2, lengthJitter: 0.15, centerX: null, centerY: null, margin: 20, simplifyTol: 0 } },
  flowRibbons: { name: 'Flow Ribbons', fn: flowRibbons, params: { seedsX: 42, seedsY: 60, minSpacing: 1.6, stepLen: 0.9, maxSteps: 1800, centers: 3, sep: 160, sigma: 90, swirl: 1.25, swirlAlt: true, baseAngleDeg: -18, drift: 0.25, noiseAmp: 0.15, noiseScale: 0.010, followOnly: false, margin: 20, simplifyTol: 0 } },
  mdiIconField: { name: 'MDI Icon Field', fn: mdiIconField, params: { namesCsv: 'mdiFlower,mdiRobot,mdiHeart', cols: 10, rows: 8, spacing: 36, jitter: 0.1, scaleMin: 5, scaleMax: 7, rotationJitter: 0.4, samples: 220, margin: 20, simplifyTol: 0 } },
  hatchFill: { name: 'Hatch Fill', fn: hatchFill, params: { angleDeg: 45, spacing: 6, offset: 0, cross: false, crossOffset: 0, clipToPrevious: false, clipRule: 'union', margin: 20, simplifyTol: 0 } },
  mdiPattern: { name: 'MDI Pattern', fn: mdiPattern, params: { iconIndex: 0, iconName: 'mdiFlower', cols: 6, rows: 5, spacing: 40, scale: 6, rotation: 0, jitter: 0.05, margin: 20, samples: 240, clipRule: 'union', simplifyTol: 0 } },
  flowField: { name: 'Flow Field', fn: flowField, params: { cols: 36, rows: 60, scale: 6, steps: 220, separation: 6, margin: 20, curl: 0.9, jitter: 0.15, simplifyTol: 0 } },
  voronoiShatter: { name: 'Voronoi Shatter', fn: voronoiShatter, params: { cells: 80, relax: 1, jitter: 0.1, margin: 20, simplifyTol: 0 } },
  pixelMosaic: { name: 'Pixel Mosaic', fn: pixelMosaic, params: { cols: 32, rows: 24, density: 0.6, jitter: 0.0, style: 'squares', imageInfo: '', levels: 3, invert: false, preserveAspect: true, margin: 20, simplifyTol: 0 } },
  halftone: { name: 'Halftone / Dither', fn: halftone, params: { imageInfo: '', spacing: 1.2, angleDeg: 0, segment: 0.4, method: 'floyd', gamma: 1.0, invert: false, preserveAspect: true, shape: 'lines', dotMin: 0.3, dotMax: 2.0, dotAspect: 1.0, squiggleAmp: 0, squigglePeriod: 6, squiggleMode: 'sine', squiggleDarkness: true, squiggleJitterAmp: 0, squiggleJitterScale: 0.02, squigglePhaseJitter: 0, radialCenterX: '', radialCenterY: '', angStepDeg: 6, clipToPrevious: false, margin: 20, simplifyTol: 0 } },
  retroPipes: { name: 'Retro Pipes', fn: retroPipes, params: { cols: 24, rows: 16, runs: 3, steps: 240, turnProb: 0.35, round: 2, margin: 20, simplifyTol: 0 } },
  starLattice: { name: 'Star Lattice', fn: starLattice, params: { cols: 11, rows: 15, spacing: 28, radius: 11, jitter: 0.0, margin: 20, simplifyTol: 0 } },
  isometricCity: { name: 'Isometric City', fn: isometricCity, params: { cols: 12, rows: 10, density: 0.8, base: 18, height: 60, jitter: 0.15, margin: 20, simplifyTol: 0 } },
  isoContours: { name: 'Iso Contours', fn: isoContours, params: { cols: 140, rows: 100, levels: 60, separation: 70, lobes: 2, sigmaX: 80, sigmaY: 55, amplitude: 1, bias: 0.18, warp: 0, margin: 20, simplifyTol: 0 } },
  superformulaRings: { name: 'Superformula Rings', fn: superformulaRings, params: { m: 8, a: 1, b: 1, n1: 0.35, n2: 0.3, n3: 0.3, rings: 60, steps: 900, inner: 0.08, rotateDeg: 0, morph: 0.25, twistDeg: 0, n23Lock: false, mRound: true, mEven: false, margin: 20, simplifyTol: 0 } },
  waveMoire: { name: 'Wave Moiré', fn: waveMoire, params: { lines: 180, freqA: 0.036, freqB: 0.049, phase: 0, amp: 18, angleDeg: 12, warp: 0.4, margin: 20, simplifyTol: 0 } },
  streamlines: { name: 'Streamlines', fn: streamlines, params: { seedsX: 36, seedsY: 26, minSpacing: 2.6, stepLen: 1.4, maxSteps: 480, noiseScale: 0.015, curl: 1.0, jitter: 0.35, followOnly: false, margin: 20, simplifyTol: 0 } },
  stripeBands: { name: 'Stripe Bands', fn: stripeBands, params: { cols: 180, rows: 120, levels: 48, isoStart: -0.9, isoEnd: 0.9, freqX: 0.08, freqY: 0.06, radialFreq: 0.035, radialAmp: 0.6, angleDeg: 0, warp: 0.2, tubeDepth: false, tubePeriod: 12, tubeMinDuty: 0.15, tubeCurve: 'tri', margin: 20, simplifyTol: 0 } },
  quasicrystalContours: { name: 'Quasicrystal Contours', fn: quasicrystalContours, params: { waves: 7, freq: 0.07, contrast: 1.2, phase: 0, cols: 180, rows: 120, iso: 0, rotateDeg: 0, warp: 0, animatePhase: false, phaseSpeed: 1.0, margin: 20, simplifyTol: 0 } },
  reactionContours: { name: 'Reaction Contours', fn: reactionContours, params: { cols: 180, rows: 120, steps: 500, feed: 0.036, kill: 0.062, diffU: 0.16, diffV: 0.08, dt: 1.0, iso: 0.5, margin: 20, simplifyTol: 0 } },
  svgImport: { name: 'SVG Import', fn: svgImport, params: { srcPolylines: [], detail: 1, scale: 1, offsetX: 0, offsetY: 0, rotateDeg: 0, clipRule: 'union', simplifyTol: 0 } },
  lsystem: { name: 'L-system', fn: lsystem, params: { preset: 'koch', iterations: 4, angleDeg: 60, step: 6, jitter: 0, margin: 20, simplifyTol: 0 } },
  phyllotaxis: { name: 'Phyllotaxis', fn: phyllotaxis, params: { count: 1500, angleDeg: 137.507764, spacing: 2.8, connect: true, jitter: 0, dotSize: 1.4, margin: 20, simplifyTol: 0 } },
  truchet: { name: 'Truchet Tiles', fn: truchet, params: { cols: 24, rows: 16, variant: 'curves', jitter: 0, margin: 20, simplifyTol: 0 } },
  hilbert: { name: 'Hilbert Curve', fn: hilbert, params: { order: 6, margin: 20, simplifyTol: 0 } },
  maze: { name: 'Maze', fn: maze, params: { cols: 24, rows: 16, margin: 20, simplifyTol: 0 } },
  pathWarp: { name: 'Path Warp', fn: pathWarp, params: { srcLayerId: '', srcToPrevious: false, amp: 3.5, scale: 0.02, step: 1.2, copies: 1, rotateFlow: false, margin: 20, simplifyTol: 0 } },
  imageContours: { name: 'Image Contours', fn: imageContours, params: { cols: 140, rows: 100, levels: 8, invert: false, gamma: 1.0, preserveAspect: true, imageInfo: '', margin: 20, simplifyTol: 0 } },
  poissonStipple: { name: 'Poisson Stipple', fn: poissonStipple, params: { minDist: 6, attempts: 8000, useImage: true, invert: false, gamma: 1.0, preserveAspect: true, dotMin: 0.5, dotMax: 1.8, connectPath: false, imageInfo: '', margin: 20, simplifyTol: 0 } },
  tspArt: { name: 'TSP Art', fn: tspArt, params: { points: 2000, useImage: true, invert: false, gamma: 1.0, preserveAspect: true, improveIters: 0, imageInfo: '', margin: 20, simplifyTol: 0 } },
  harmonograph: { name: 'Harmonograph', fn: harmonograph, params: { Ax: 120, Ay: 80, fx: 0.21, fy: 0.19, px: 0, py: Math.PI/2, dx: 0.01, dy: 0.012, tMax: 60, steps: 8000, margin: 20, simplifyTol: 0 } },
  deJong: { name: 'De Jong Attractor', fn: deJong, params: { a: 2.01, b: -2.53, c: 1.61, d: -0.33, iter: 120000, burn: 1000, margin: 20, simplifyTol: 0 } },
  reactionStrokes: { name: 'Reaction Strokes', fn: reactionStrokes, params: { cols: 160, rows: 110, steps: 450, feed: 0.036, kill: 0.062, diffU: 0.16, diffV: 0.08, dt: 1.0, seedsX: 36, seedsY: 26, minSpacing: 2.4, stepLen: 1.1, maxSteps: 650, vMin: 0.18, vMax: 0.82, jitter: 0.25, margin: 20, simplifyTol: 0 } },
  clifford: { name: 'Clifford Attractor', fn: clifford, params: { a: -1.7, b: 1.3, c: -0.1, d: -1.21, iter: 150000, burn: 1000, margin: 20, simplifyTol: 0 } },
  sunflowerBands: { name: 'Sunflower Bands', fn: sunflowerBands, params: { count: 900, spacing: 3.2, angleDeg: 137.50776405003785, dotSize: 2.0, bandPeriod: 7, bandDuty: 0.55, jitter: 0.15, margin: 20, simplifyTol: 0 } },
  combinator: { name: 'Combinator', fn: combinator, params: { srcA: '', srcB: '', op: 'intersect', margin: 20, simplifyTol: 0 } }
  , superellipse: { name: 'Superellipse', fn: superellipse, params: { a: 160, b: 110, n: 3.5, rotateDeg: 0, cx: 210, cy: 148, step: 0.01, simplifyTol: 0 } }
  , barnsleyFern: { name: 'Barnsley Fern (IFS)', fn: barnsleyFern, params: { iter: 90000, scale: 46, centerX: 210, centerY: 290, variant: 'classic', simplifyTol: 0 } }
  , lorenz: { name: 'Lorenz Attractor', fn: lorenzAttractor, params: { sigma: 10, rho: 28, beta: 2.6666666667, dt: 0.005, steps: 20000, x0: 0.01, y0: 0, z0: 0, scale: 6, centerX: 210, centerY: 148, rotDegXY: -20, simplifyTol: 0 } }
  , rossler: { name: 'Rössler Attractor', fn: rosslerAttractor, params: { a: 0.2, b: 0.2, c: 5.7, dt: 0.01, steps: 25000, x0: 0.1, y0: 0, z0: 0, scale: 10, centerX: 210, centerY: 148, rotDegXY: 0, simplifyTol: 0 } }
  , sierpinski: { name: 'Sierpinski (IFS)', fn: sierpinski, params: { iter: 80000, scale: 2.2, centerX: 210, centerY: 160, jitter: 0, simplifyTol: 0 } }
  , cycloid: { name: 'Cycloid (Epi/Hypo)', fn: cycloid, params: { kind: 'epi', R: 80, r: 23, d: 60, turns: 18, step: 0.006, centerX: 210, centerY: 148, scale: 1, multi: 1, simplifyTol: 0 } }
  , penroseLike: { name: 'Penrose-like Rosette', fn: penroseLike, params: { layers: 9, innerR: 18, outerR: 120, scaleFactor: 1.61803398875, rotateDeg: 18, spokes: 0, centerX: 210, centerY: 148, jitter: 0, simplifyTol: 0 } }
  , thomas: { name: "Thomas' Attractor", fn: thomasAttractor, params: { b: 0.19, dt: 0.02, steps: 30000, x0: 0.1, y0: 0, z0: 0, scale: 70, centerX: 210, centerY: 148, rotDegXY: 25, simplifyTol: 0 } }
  , aizawa: { name: 'Aizawa Attractor', fn: aizawaAttractor, params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1, dt: 0.01, steps: 50000, x0: 0.1, y0: 0, z0: 0, scale: 90, centerX: 210, centerY: 148, rotDegXY: 20, simplifyTol: 0 } }
  , halvorsen: { name: 'Halvorsen Attractor', fn: halvorsenAttractor, params: { a: 1.4, dt: 0.005, steps: 60000, x0: 0.1, y0: 0, z0: 0, scale: 10, centerX: 210, centerY: 148, rotDegXY: 20, simplifyTol: 0 } }
  , ikeda: { name: 'Ikeda Map', fn: ikedaMap, params: { u: 0.918, steps: 100000, x0: 0.1, y0: 0.0, scale: 90, centerX: 210, centerY: 148, burn: 1000, simplifyTol: 0 } }
  , henon: { name: 'Hénon Map', fn: henonMap, params: { a: 1.4, b: 0.3, steps: 120000, x0: 0.1, y0: 0.0, scale: 160, centerX: 210, centerY: 160, burn: 1000, simplifyTol: 0 } }
  , rucklidge: { name: 'Rucklidge Attractor', fn: rucklidgeAttractor, params: { a: 2.0, b: 1.0, c: 6.7, d: 0.0, dt: 0.003, steps: 50000, x0: 0.1, y0: 0, z0: 0, scale: 12, centerX: 210, centerY: 148, rotDegXY: 10, simplifyTol: 0 } }
  , circlePacking: { name: 'Circle Packing', fn: circlePacking, params: { margin: 20, minR: 6, maxR: 24, attempts: 6000, relax: 0.9, segments: 36, inside: 'rect', simplifyTol: 0 } }
  , torusKnot: { name: 'Torus Knot', fn: torusKnot, params: { p: 3, q: 2, R: 120, r: 40, steps: 3000, rotateDeg: 0, perspective: 0.12, centerX: 210, centerY: 148, scale: 1, simplifyTol: 0 } }
  , lissajousGrid: { name: 'Lissajous Grid', fn: lissajousGrid, params: { cols: 10, rows: 7, ax: 3, ay: 2, axStep: 1, ayStep: 0, phaseDeg: 0, steps: 900, scale: 0.9, margin: 20, simplifyTol: 0 } }
  , hopalong: { name: 'Hopalong Attractor', fn: hopalong, params: { a: 2.0, b: 1.0, c: 0.5, steps: 120000, burn: 1000, x0: 0.1, y0: 0.0, scale: 90, centerX: 210, centerY: 148, rotDeg: 0, simplifyTol: 0 } }
  , gumowskiMira: { name: 'Gumowski–Mira Attractor', fn: gumowskiMira, params: { a: 0.008, b: 0.05, m: -0.5, steps: 160000, burn: 1200, x0: 0.1, y0: 0.0, scale: 110, centerX: 210, centerY: 148, rotDeg: 0, simplifyTol: 0 } }
  , lozi: { name: 'Lozi Attractor', fn: lozi, params: { a: 1.7, b: 0.5, steps: 140000, burn: 1200, x0: 0.1, y0: 0.0, scale: 160, centerX: 210, centerY: 148, rotDeg: 0, simplifyTol: 0 } }
  , superellipseGrid: { name: 'Superellipse Grid', fn: superellipseGrid, params: { cols: 10, rows: 7, a: 0.48, b: 0.48, n: 3.0, nStep: 0.15, rotateDeg: 0, steps: 360, scale: 1.0, margin: 20, simplifyTol: 0 } }
}
