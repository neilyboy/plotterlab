// De Jong attractor generator
// x_{n+1} = sin(a*y_n) - cos(b*x_n)
// y_{n+1} = sin(c*x_n) - cos(d*y_n)
// We iterate points, discard burn-in, normalize extents, and map to page.

export function deJong({ width = 420, height = 297, margin = 20, a = 2.01, b = -2.53, c = 1.61, d = -0.33, iter = 120000, burn = 1000 }) {
  const pts = new Array(Math.max(0, iter))
  let x = 0.1, y = 0.1
  for (let i = 0; i < iter + burn; i++) {
    const nx = Math.sin(a * y) - Math.cos(b * x)
    const ny = Math.sin(c * x) - Math.cos(d * y)
    x = nx; y = ny
    if (i >= burn) pts[i - burn] = [x, y]
  }
  if (pts.length === 0) return []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [px, py] of pts) { if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py }
  const W = Math.max(1e-6, maxX - minX)
  const H = Math.max(1e-6, maxY - minY)
  const innerW = Math.max(1, width - 2 * margin)
  const innerH = Math.max(1, height - 2 * margin)
  const s = Math.min(innerW / W, innerH / H)
  const ox = (width - W * s) * 0.5 - minX * s
  const oy = (height - H * s) * 0.5 - minY * s
  const poly = pts.map(([px, py]) => [px * s + ox, py * s + oy])
  return [poly]
}
