// Maze generator (recursive backtracker) with grid cols x rows
// Outputs line segments for walls as short polylines [[x1,y1],[x2,y2]].

export function maze({ width = 420, height = 297, margin = 20, cols = 24, rows = 16 }) {
  cols = Math.max(2, Math.floor(cols))
  rows = Math.max(2, Math.floor(rows))
  const minX = margin, minY = margin
  const maxX = width - margin, maxY = height - margin
  const cw = (maxX - minX) / cols
  const ch = (maxY - minY) / rows

  // Walls: for each cell, store walls: [top,right,bottom,left]
  const N = cols * rows
  const idx = (c, r) => r * cols + c
  const walls = new Array(N).fill(0).map(() => [1,1,1,1])
  const visited = new Uint8Array(N)

  // Random helper deterministic-ish via Math.random (seed could be added later)
  const neighbors = (c, r) => {
    const L = []
    if (r > 0) L.push([c, r-1, 0])
    if (c < cols-1) L.push([c+1, r, 1])
    if (r < rows-1) L.push([c, r+1, 2])
    if (c > 0) L.push([c-1, r, 3])
    // shuffle
    for (let i = L.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = L[i]; L[i] = L[j]; L[j] = t
    }
    return L
  }

  const stack = []
  let c = 0, r = 0
  visited[idx(c,r)] = 1
  stack.push([c,r])

  while (stack.length) {
    const [cc, rr] = stack[stack.length - 1]
    const neigh = neighbors(cc, rr)
    let advanced = false
    for (const [nc, nr, dir] of neigh) {
      if (!visited[idx(nc, nr)]) {
        // knock down wall between (cc,rr) and (nc,nr)
        const d = dir
        // dir 0=up,1=right,2=down,3=left
        walls[idx(cc, rr)][d] = 0
        walls[idx(nc, nr)][(d+2)%4] = 0
        visited[idx(nc, nr)] = 1
        stack.push([nc, nr])
        advanced = true
        break
      }
    }
    if (!advanced) stack.pop()
  }

  // Convert remaining walls to line segments
  const out = []
  for (let rr = 0; rr < rows; rr++) {
    for (let cc = 0; cc < cols; cc++) {
      const w = walls[idx(cc, rr)]
      const x0 = minX + cc * cw
      const y0 = minY + rr * ch
      const x1 = x0 + cw
      const y1 = y0 + ch
      if (w[0]) out.push([[x0, y0], [x1, y0]])     // top
      if (w[1]) out.push([[x1, y0], [x1, y1]])     // right
      if (w[2]) out.push([[x1, y1], [x0, y1]])     // bottom
      if (w[3]) out.push([[x0, y1], [x0, y0]])     // left
    }
  }
  return out
}
