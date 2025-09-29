// Generate static SVG thumbnails for all presets into public/thumbs/
// Usage: node scripts/generate_thumbs.js [draft|final]
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { computeRendered as renderAll } from '../src/lib/renderer.js'
import { polylineToPath } from '../src/lib/geometry.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = path.join(__dirname, '..')
const presetsDir = path.join(root, 'presets')
const publicDir = path.join(root, 'public')
const thumbsDir = path.join(publicDir, 'thumbs')

const variantArg = (process.argv[2] === 'draft') ? 'draft' : 'final'

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }) }

function buildSVG(doc, outputs) {
  const docW = Math.max(10, Number(doc.width) || 420)
  const docH = Math.max(10, Number(doc.height) || 297)
  const bg = doc.bg || '#0b0f14'
  // compute bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const { polylines } of outputs) {
    for (const poly of (polylines || [])) {
      for (const [x,y] of poly) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  const hasArt = Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)
  const pad = 8
  const vbX = hasArt ? (minX - pad) : 0
  const vbY = hasArt ? (minY - pad) : 0
  const vbW = hasArt ? Math.max(10, (maxX - minX) + 2*pad) : docW
  const vbH = hasArt ? Math.max(10, (maxY - minY) + 2*pad) : docH
  const svgPaths = outputs.map(({ layer, polylines }) => ({
    color: layer.color || '#fff',
    d: (polylines || []).map(polylineToPath).join(' ')
  }))
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}" shape-rendering="geometricPrecision">`,
    `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}"/>`,
    ...svgPaths.map(p => `<path d="${p.d}" fill="none" stroke="${p.color}" stroke-width="1" vector-effect="non-scaling-stroke"/>`),
    `</svg>`
  ].join('')
  return svg
}

async function main() {
  await ensureDir(thumbsDir)
  const idxPath = path.join(presetsDir, 'index.json')
  const idxTxt = await fs.readFile(idxPath, 'utf8')
  const list = JSON.parse(idxTxt)
  let ok = 0, fail = 0
  for (const e of list) {
    const file = e.file
    if (!file || !file.endsWith('.json')) continue
    try {
      const pPath = path.join(presetsDir, file)
      const txt = await fs.readFile(pPath, 'utf8')
      const json = JSON.parse(txt)
      const doc = { ...(json.doc || {}), optimize: 'none', fastPreview: variantArg === 'draft', previewQuality: variantArg === 'draft' ? 0.5 : 1 }
      const layers = Array.isArray(json.layers) ? json.layers.map(l => ({ ...l, visible: true })) : []
      const outputs = renderAll(layers, doc, {}, {}, variantArg === 'draft' ? 0.6 : 1)
      const svg = buildSVG(doc, outputs)
      const base = file.replace(/[^A-Za-z0-9_\-\.]+/g, '_').replace(/\.json$/i, '')
      const outPath = path.join(thumbsDir, `${base}.${variantArg}.svg`)
      await fs.writeFile(outPath, svg, 'utf8')
      ok++
      if (process.stdout.isTTY) console.log('ok', file)
    } catch (err) {
      fail++
      if (process.stdout.isTTY) console.error('fail', e.file, err?.message || err)
    }
  }
  if (process.stdout.isTTY) console.log(`Done. ok=${ok} fail=${fail}`)
}

main().catch(err => { console.error(err); process.exit(1) })
