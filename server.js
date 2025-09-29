import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import * as MDI from '@mdi/js'
import fs from 'fs/promises'
import { computeRendered as renderAll } from './src/lib/renderer.js'
import { polylineToPath } from './src/lib/geometry.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

app.use(express.json({ limit: '5mb' }))

// Simple health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Normalize incoming mdi name to module key
function normalizeMdiName(name) {
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

// Resolve MDI path data for any provided name
app.get('/api/mdi/:name', (req, res) => {
  try {
    const key = normalizeMdiName(req.params.name)
    const d = MDI[key]
    if (!d) return res.status(404).json({ error: 'Not found', key })
    res.json({ key, d })
  } catch (e) {
    res.status(500).json({ error: 'resolution_failed' })
  }
})

// Serve built-in example presets
const presetsPath = path.join(__dirname, 'presets')
app.use('/presets', express.static(presetsPath, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (/\.json$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store')
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600')
    }
  }
}))

// Serve external plugins directory (optional)
const pluginsPath = path.join(__dirname, 'plugins')
app.use('/plugins', express.static(pluginsPath, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (/\.json$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store')
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600')
    }
  }
}))

// Serve additional static assets (thumbnails, etc.) from ./public under /static
const publicPath = path.join(__dirname, 'public')
app.use('/static', express.static(publicPath, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (/\.svg$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400')
    }
  }
}))

// On-demand thumbnail generation for presets (SVG)
// GET /api/thumb/:file?q=draft|final
app.get('/api/thumb/:file', async (req, res) => {
  try {
    const file = String(req.params.file || '')
    if (!/^[A-Za-z0-9._\-]+$/.test(file)) return res.status(400).json({ error: 'bad_name' })
    const variant = (req.query.q === 'draft') ? 'draft' : 'final'
    const presetPath = path.join(__dirname, 'presets', file)
    const txt = await fs.readFile(presetPath, 'utf8')
    const json = JSON.parse(txt)
  const doc = { ...(json.doc || {}), optimize: 'none', fastPreview: variant === 'draft', previewQuality: variant === 'draft' ? 0.5 : 1 }
  const layers = Array.isArray(json.layers) ? json.layers.map(l => ({ ...l, visible: true })) : []
  let outputs = []
  let hadError = false
  try {
    outputs = renderAll(layers, doc, {}, {}, variant === 'draft' ? 0.6 : 1)
  } catch (e) {
    hadError = true
  }
  // Build compact SVG
  const docW = Math.max(10, Number(doc.width) || 420)
  const docH = Math.max(10, Number(doc.height) || 297)
  const bg = doc.bg || '#0b0f14'
  const paths = (outputs || []).map(({ layer, polylines }) => ({
    color: layer.color || '#fff',
    polys: polylines || []
  })).filter(p => p.polys.length > 0)
  // Compute art bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of paths) {
    for (const poly of p.polys) {
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
  const svgPaths = []
  for (const p of paths) {
    const d = p.polys.map(poly => polylineToPath(poly)).join(' ')
    if (d) svgPaths.push(`<path d="${d}" fill="none" stroke="${p.color}" stroke-width="1" vector-effect="non-scaling-stroke"/>`)
  }
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}" shape-rendering="geometricPrecision">`,
    `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${bg}"/>`,
    ...svgPaths,
    `</svg>`
  ].join('')
    // Save to public/thumbs for reuse
    const safeBase = file.replace(/[^A-Za-z0-9_\-\.]+/g, '_').replace(/\.json$/i, '')
    const thumbsDir = path.join(publicPath, 'thumbs')
    await fs.mkdir(thumbsDir, { recursive: true })
    const outPath = path.join(thumbsDir, `${safeBase}.${variant}.svg`)
    // Only persist when we had no error
    if (!hadError) {
      await fs.writeFile(outPath, svg, 'utf8')
    }
    res.set('Content-Type', 'image/svg+xml')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(svg)
  } catch (err) {
    console.error('thumb error', err)
    res.status(500).json({ error: 'thumb_failed' })
  }
})

// Serve static files from dist
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath, {
  index: false,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Never cache index.html (so new hashed assets are picked up)
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store')
      return
    }
    // Cache hashed assets aggressively
    if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
}))

// Fallback to index.html (SPA) – make it non-cacheable
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`)
})
