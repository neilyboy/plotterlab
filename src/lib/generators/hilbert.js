// Hilbert curve generator (order >= 1)
// Generates a single polyline filling a square area inside the page margins.

export function hilbert({ width, height, margin = 20, order = 6, onProgress }) {
  order = Math.max(1, Math.floor(order))
  const n = 1 << order // grid dimension
  const total = n * n

  function rot(n, x, y, rx, ry) {
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x
        y = n - 1 - y
      }
      // Swap x and y
      const t = x; x = y; y = t
    }
    return [x, y]
  }

  function d2xy(n, d) {
    let x = 0, y = 0
    let t = d
    for (let s = 1; s < n; s <<= 1) {
      const rx = 1 & (t >> 1)
      const ry = 1 & (t ^ rx)
      ;[x, y] = rot(s, x, y, rx, ry)
      x += s * rx
      y += s * ry
      t >>= 2
    }
    return [x, y]
  }

  const innerW = Math.max(1, width - 2 * margin)
  const innerH = Math.max(1, height - 2 * margin)
  const scale = Math.min(innerW, innerH) / (n - 1)
  const offX = (width - (n - 1) * scale) / 2
  const offY = (height - (n - 1) * scale) / 2

  const poly = []
  for (let i = 0; i < total; i++) {
    const [gx, gy] = d2xy(n, i)
    const x = offX + gx * scale
    const y = offY + gy * scale
    poly.push([x, y])
    if (onProgress && (i % 10000 === 0)) onProgress(i / total)
  }
  return [poly]
}
