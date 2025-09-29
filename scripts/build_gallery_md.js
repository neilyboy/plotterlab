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
  if (process.stdout.isTTY) console.log('Wrote', outPath)
}

main().catch(err => { console.error(err); process.exit(1) })
