// Simple nearest-neighbor ordering of polylines with orientation selection.
// Each polyline is an array of [x,y]. Returns new array without mutating input.

function dist2(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return dx*dx + dy*dy
}

function nearestNeighbor(polys, startX, startY) {
  const remaining = polys.map(p => p.slice())
  const out = []
  let cur = [startX, startY]
  while (remaining.length) {
    let bestIdx = 0
    let bestRev = false
    let bestD = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const poly = remaining[i]
      if (!poly || poly.length === 0) continue
      const s = poly[0]
      const e = poly[poly.length - 1]
      const dStart = dist2(cur, s)
      const dEnd = dist2(cur, e)
      if (dStart < bestD) { bestD = dStart; bestIdx = i; bestRev = false }
      if (dEnd < bestD) { bestD = dEnd; bestIdx = i; bestRev = true }
    }
    const chosen = remaining.splice(bestIdx, 1)[0]
    const oriented = bestRev ? chosen.slice().reverse() : chosen
    out.push(oriented)
    cur = oriented[oriented.length - 1]
  }
  return out
}

function routeCost(route, startX, startY) {
  if (route.length === 0) return 0
  let cost = Math.sqrt(dist2([startX, startY], route[0][0]))
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i][route[i].length - 1]
    const b = route[i+1][0]
    cost += Math.sqrt(dist2(a, b))
  }
  return cost
}

function improveOrientations(route, startX, startY, passes = 2) {
  const r = route.map(p => p.slice())
  for (let pass = 0; pass < passes; pass++) {
    // Try flipping polylines to reduce local junction distances
    for (let i = 0; i < r.length; i++) {
      const prevEnd = (i === 0) ? [startX, startY] : r[i-1][r[i-1].length - 1]
      const curStart = r[i][0]
      const curEnd = r[i][r[i].length - 1]
      const dKeep = dist2(prevEnd, curStart)
      const dFlip = dist2(prevEnd, curEnd)
      if (dFlip + 1e-9 < dKeep) {
        r[i] = r[i].slice().reverse()
      }
    }
    for (let i = 0; i < r.length - 1; i++) {
      const aEnd = r[i][r[i].length - 1]
      const bStart = r[i+1][0]
      const bEnd = r[i+1][r[i+1].length - 1]
      const dStart = dist2(aEnd, bStart)
      const dFlip = dist2(aEnd, bEnd)
      if (dFlip + 1e-9 < dStart) {
        r[i+1] = r[i+1].slice().reverse()
      }
    }
  }
  return r
}

function localSwap(route, startX, startY) {
  // Try a limited adjacent swap if it reduces local cost
  const r = route.map(p => p.slice())
  let improved = false
  for (let i = 0; i < r.length - 2; i++) {
    const before = routeCost(r.slice(i, i+3), (i===0?startX:r[i-1][r[i-1].length-1][0]??startX), (i===0?startY:r[i-1][r[i-1].length-1][1]??startY))
    const swapped = r.slice()
    const tmp = swapped[i+1]; swapped[i+1] = swapped[i+2]; swapped[i+2] = tmp
    const after = routeCost(swapped.slice(i, i+3), (i===0?startX:swapped[i-1][swapped[i-1].length-1][0]??startX), (i===0?startY:swapped[i-1][swapped[i-1].length-1][1]??startY))
    if (after + 1e-9 < before) {
      r.splice(0, r.length, ...swapped)
      improved = true
    }
  }
  return { route: r, improved }
}

function nearestImprove(polys, startX, startY) {
  let r = nearestNeighbor(polys, startX, startY)
  r = improveOrientations(r, startX, startY, 2)
  for (let it = 0; it < 2; it++) {
    const { route, improved } = localSwap(r, startX, startY)
    r = improveOrientations(route, startX, startY, 1)
    if (!improved) break
  }
  // Light 2-opt pass (conservative): try a few improving segment reversals
  const maxSwaps = Math.min(200, Math.max(10, Math.floor(r.length * 0.2)))
  let swaps = 0
  const n = r.length
  const baseCost = () => routeCost(r, startX, startY)
  let bestCost = baseCost()
  outer: for (let i = 0; i < n - 3; i++) {
    for (let k = i + 1; k < n - 1; k++) {
      if (swaps >= maxSwaps) break outer
      const trial = r.slice()
      // Reverse the block (i+1 .. k)
      const mid = trial.slice(i + 1, k + 1).map(p => p.slice().reverse()).reverse()
      trial.splice(i + 1, k - i, ...mid)
      const oriented = improveOrientations(trial, startX, startY, 1)
      const c = routeCost(oriented, startX, startY)
      if (c + 1e-9 < bestCost) {
        r = oriented
        bestCost = c
        swaps++
      }
    }
  }
  return r
}

// Join polylines that are close together.
// This assumes polylines are already ordered by a method like nearestNeighbor.
export function joinPolylines(polylines, tolerance = 0.1) {
  if (polylines.length < 2) {
    return polylines.map(p => p.slice());
  }
  const tol2 = tolerance * tolerance;
  const out = [];
  let currentPoly = polylines[0].slice();

  for (let i = 1; i < polylines.length; i++) {
    const nextPoly = polylines[i];
    if (currentPoly.length === 0 || nextPoly.length === 0) {
      if (currentPoly.length > 0) {
        out.push(currentPoly);
      }
      currentPoly = nextPoly.slice();
      continue;
    }

    const endOfCurrent = currentPoly[currentPoly.length - 1];
    const startOfNext = nextPoly[0];

    if (dist2(endOfCurrent, startOfNext) < tol2) {
      // Using concat instead of spread for potentially better performance with large arrays
      currentPoly = currentPoly.concat(nextPoly.slice(1));
    } else {
      out.push(currentPoly);
      currentPoly = nextPoly.slice();
    }
  }

  if (currentPoly.length > 0) {
    out.push(currentPoly);
  }

  return out;
}

export function orderPolylines(polylines, method = 'none', startX = 0, startY = 0) {
  if (method === 'none') return polylines.map(p => p.slice())
  if (method === 'improve' || method === 'nearest+improve') return nearestImprove(polylines, startX, startY)
  return nearestNeighbor(polylines, startX, startY)
}
