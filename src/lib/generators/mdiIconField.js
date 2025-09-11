import { mdiFlower, mdiStarFourPoints, mdiHeart, mdiRobot, mdiHexagonMultiple } from '@mdi/js'
import { makeRNG } from '../random.js'
import { normalizeMdiName } from './mdiPattern.js'
import { sampleSvgPathMulti } from '../svgPathSample.js'

const BUILTIN = new Map([
  ['mdiFlower', mdiFlower],
  ['mdiStarFourPoints', mdiStarFourPoints],
  ['mdiHeart', mdiHeart],
  ['mdiRobot', mdiRobot],
  ['mdiHexagonMultiple', mdiHexagonMultiple],
])

// Path sampling now imported from svgPathSample.js for worker safety

function transform(poly, { x = 0, y = 0, scale = 1, rotate = 0 }) {
  const s = Math.sin(rotate)
  const c = Math.cos(rotate)
  return poly.map(([px, py]) => {
    const cx = (px - 12) * scale
    const cy = (py - 12) * scale
    const rx = cx * c - cy * s
    const ry = cx * s + cy * c
    return [rx + x, ry + y]
  })
}

export function mdiIconField({
  namesCsv = 'mdiFlower,mdiRobot,mdiHeart',
  iconDs, // optional array of path data strings, same order as namesCsv
  cols = 10,
  rows = 8,
  spacing = 36,
  jitter = 0.1,
  scaleMin = 5,
  scaleMax = 7,
  rotationJitter = 0.4,
  samples = 300,
  margin = 20,
  width = 420,
  height = 297,
  seed = 'seed'
}) {
  // Resolve icon path list
  const provided = (typeof namesCsv === 'string') ? namesCsv : null
  const names = (provided && provided.trim() !== '')
    ? provided.split(/[;,\s]+/).map(s => normalizeMdiName(s)).filter(Boolean)
    : []
  const ds = (Array.isArray(iconDs) && iconDs.length)
    ? iconDs
    : (names.length ? names.map(n => BUILTIN.get(n)).filter(Boolean) : [])

  // If user explicitly cleared the list (empty string), render nothing.
  if (!ds.length && provided !== null) {
    return []
  }
  // If namesCsv not provided at all (undefined in params), keep backward-compat default
  if (!ds.length) {
    for (const v of BUILTIN.values()) ds.push(v)
  }

  // Keep icons grouped: each entry is an array of polylines (one per subpath)
  const baseIcons = []
  for (const d of ds) {
    const arr = sampleSvgPathMulti(d, samples)
    if (arr && arr.length) baseIcons.push(arr)
  }
  if (baseIcons.length === 0) return []
  const { range, int } = makeRNG(seed)

  const polylines = []
  const startX = margin + spacing / 2
  const startY = margin + spacing / 2
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = startX + i * spacing
      const y = startY + j * spacing
      const jitterX = range(-1, 1) * spacing * jitter
      const jitterY = range(-1, 1) * spacing * jitter
      const angle = range(-rotationJitter, rotationJitter) * Math.PI
      const scale = range(scaleMin, scaleMax)
      const idx = int(0, baseIcons.length - 1)
      const iconPolys = baseIcons[idx]
      if (iconPolys && iconPolys.length) {
        for (const poly of iconPolys) {
          polylines.push(transform(poly, { x: x + jitterX, y: y + jitterY, scale, rotate: angle }))
        }
      }
    }
  }

  return polylines
}
