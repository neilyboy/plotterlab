import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import * as MDI from '@mdi/js'

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
