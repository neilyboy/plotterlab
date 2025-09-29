// Build docs/gallery.md from presets/index.json using public/thumbs final SVGs
// Usage: node scripts/build_gallery_md.js
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.join(__dirname, '..')
const presetsDir = path.join(root, 'presets')
const docsDir = path.join(root, 'docs')
const outPath = path.join(docsDir, 'gallery.md')
const outHtml = path.join(docsDir, 'index.html')

// Adjust if the repo slug changes
const REPO_SLUG = 'neilyboy/plotterlab'
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_SLUG}/main/public/thumbs`

function safeBase(file) {
  return String(file).replace(/[^A-Za-z0-9_\-\.]+/g, '_').replace(/\.json$/i, '')
}

async function main() {
  await fs.mkdir(docsDir, { recursive: true })
  const idxPath = path.join(presetsDir, 'index.json')
  const txt = await fs.readFile(idxPath, 'utf8')
  const list = JSON.parse(txt)

  const lines = []
  lines.push('# Examples Gallery (Auto-generated)')
  lines.push('')
  lines.push('Below is a curated grid of final thumbnails generated from the presets in `presets/`.')
  lines.push('')

  // Render as rows with up to 5 images per row
  const perRow = 5
  for (let i = 0; i < list.length; i += perRow) {
    const row = list.slice(i, i + perRow)
    lines.push('<p align="center">')
    for (const e of row) {
      const base = safeBase(e.file || '')
      if (!base) continue
      const url = `${RAW_BASE}/${base}.final.svg`
      const alt = (e.label || base).replace(/"/g, '')
      lines.push(`  <a href="${url}"><img src="${url}" width="200" alt="${alt}" /></a>`) // each thumb 200px
    }
    lines.push('</p>')
    lines.push('')
  }

  const md = lines.join('\n')
  await fs.writeFile(outPath, md, 'utf8')
  // Also build a minimal index.html for GitHub Pages
  const items = list.map(e => ({ base: safeBase(e.file||''), label: e.label || '' })).filter(x=>x.base)
  const cards = items.map(({ base, label }) => `
      <a class="card" href="${RAW_BASE}/${base}.final.svg" title="${label}">
        <img src="${RAW_BASE}/${base}.final.svg" alt="${label}" />
        <div class="caption">${label}</div>
      </a>`).join('\n')
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Plotter Lab – Examples Gallery</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; background:#0b0f14; color:#e5e7eb; }
    header { position: sticky; top:0; backdrop-filter: blur(6px); background: rgba(12,16,22,0.8); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; }
    main { padding: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(0,0,0,0.2); text-decoration: none; color: inherit; overflow: hidden; }
    .card img { width: 100%; aspect-ratio: 1 / 1; object-fit: contain; background: rgba(0,0,0,0.3); }
    .caption { font-size: 12px; opacity: 0.8; padding: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
    .muted { opacity: 0.7; font-size: 12px; }
  </style>
  <link rel="icon" href="data:," />
  <meta name="robots" content="noindex" />
  </head>
<body>
  <header>
    <div>Plotter Lab – Examples Gallery <span class="muted">(auto-generated)</span></div>
  </header>
  <main>
    <div class="grid">
${cards}
    </div>
  </main>
</body>
</html>`
  await fs.writeFile(outHtml, html, 'utf8')
  if (process.stdout.isTTY) console.log('Wrote', outPath, 'and', outHtml)
}

main().catch(err => { console.error(err); process.exit(1) })
