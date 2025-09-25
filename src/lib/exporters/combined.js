// Combined G-code exporter with optional pauses between layers
// Returns [{ name, content }]
export function combined({ entries, doc, applyPathPlanning, toGcode }) {
  if (!Array.isArray(entries)) return []
  const optsBase = baseOpts(doc)
  let first = true
  let combined = ''
  const pauseBetween = (doc.pauseCombined ?? true)
  const pauseCode = String(doc.pauseCode ?? 'M0')
  const pauseMsg = String(doc.pauseMessage ?? 'Change pen to <color>')

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry || !entry.layer || !entry.layer.visible) continue
    const planned = applyPathPlanning(entry.polylines, doc, doc.optimizeJoin)
    if (!planned || !planned.length) continue
    const part = toGcode(planned, { ...optsBase, includeHeader: first, includeFooter: false })
    combined += part
    const hasNext = entries.slice(i + 1).some(e => e && e.layer && e.layer.visible)
    if (pauseBetween && hasNext) {
      const colorText = String(entry.layer.color || '').toUpperCase()
      combined += `\n; Pause for next layer\n; ${pauseMsg.replace('<color>', colorText)}\n${pauseCode}\n`
    }
    first = false
  }
  combined += toGcode([], { ...optsBase, includeHeader: false, includeFooter: true })
  return [{ name: 'combined.gcode', content: combined }]
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
