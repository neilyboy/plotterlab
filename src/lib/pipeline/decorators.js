// Decorators for post-processing polylines
// - applyPathPlanning: apply ordering and joining according to document settings

import { orderPolylines, joinPolylines } from '../pathopt.js'

/**
 * Apply path planning to a set of polylines.
 * @param {Array<Array<[number,number]>>} polylines
 * @param {Object} doc - Document settings (expects optimize, startX, startY)
 * @param {boolean} optimizeJoin - Whether to join contiguous paths
 * @returns {Array<Array<[number,number]>>}
 */
export function applyPathPlanning(polylines, doc = {}, optimizeJoin = false) {
  let polys = polylines || []
  const mode = doc.optimize
  if (mode && mode !== 'none') {
    const sx = Number(doc.startX) || 0
    const sy = Number(doc.startY) || 0
    polys = orderPolylines(polys, mode, sx, sy)
  }
  if (optimizeJoin) {
    polys = joinPolylines(polys)
  }
  return polys
}
