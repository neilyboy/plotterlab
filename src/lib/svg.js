export function buildSVG({ width, height, paths = [], bg = 'none', bleed = 0 }) {
  const b = Math.max(0, +bleed || 0)
  const outW = width + b * 2
  const outH = height + b * 2
  const content = paths.map(({ d, stroke = '#fff', strokeWidth = 1.2, fill = 'none' }) =>
    `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
  ).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}mm" height="${outH}mm" viewBox="${-b} ${-b} ${outW} ${outH}">`+
    (bg !== 'none' ? `<rect x="${-b}" y="${-b}" width="${outW}" height="${outH}" fill="${bg}"/>` : '') +
    content +
    `</svg>`
}
