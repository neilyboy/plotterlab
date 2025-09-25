// Exporter strategy registry for G-code grouping modes
// Each strategy returns an array of { name, content } objects to be zipped

import { perLayer } from './perLayer.js'
import { perColor } from './perColor.js'
import { combined } from './combined.js'

const REGISTRY = {
  layers: perLayer,
  colors: perColor,
  combined
}

export function getExporter(mode) {
  const key = String(mode || 'layers')
  return REGISTRY[key] || REGISTRY.layers
}

export function registerExporter(key, fn) {
  if (!key || typeof key !== 'string') return
  if (typeof fn !== 'function') return
  REGISTRY[key] = fn
}
