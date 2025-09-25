// Per-color G-code exporter
// Returns [{ name, content }]
export function perColor({ entries, doc, applyPathPlanning, toGcode }) {
  if (!Array.isArray(entries)) return []
  const optsBase = baseOpts(doc)
  const colorMap = {}
  for (const entry of entries) {
    if (!entry || !entry.layer || !entry.layer.visible) continue
    const planned = applyPathPlanning(entry.polylines, doc, doc.optimizeJoin)
    if (!planned || !planned.length) continue
    const key = String(entry.layer.color || '#000000').toLowerCase()
    if (!colorMap[key]) colorMap[key] = []
    colorMap[key].push(...planned)
  }
  const out = []
  for (const [color, polys] of Object.entries(colorMap)) {
    if (!polys.length) continue
    const gcode = toGcode(polys, { ...optsBase, includeHeader: true, includeFooter: true })
    const safe = color.replace('#', '')
    out.push({ name: `color_${safe}.gcode`, content: gcode })
  }
  return out
}

function baseOpts(doc) {
  return {
    feed: doc.feed ?? 1800,
    travel: doc.travel ?? 3000,
    scale: 1,
    penUp: doc.penUp ?? 5,
    penDown: doc.penDown ?? 0,
    safeZ: doc.safeZ ?? (doc.penUp ?? 5),
    penMode: doc.penMode || 'servo',
    servoUp: doc.servoUp || 'M3 S180',
    servoDown: doc.servoDown || 'M3 S0',
    delayAfterUp: doc.delayAfterUp ?? 0,
    delayAfterDown: doc.delayAfterDown ?? 0,
    startX: (doc.startUseMargin ? (doc.margin ?? 0) : (doc.startX ?? 0)),
    startY: (doc.startUseMargin ? (doc.margin ?? 0) : (doc.startY ?? 0)),
    originX: 0,
    originY: 0,
  }
}
