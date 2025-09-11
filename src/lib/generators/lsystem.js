// Turtle/L-system generator
// Supports a few presets to avoid verbose text inputs in the UI.
// Symbols: F = draw forward, f = move without drawing, + = turn +angle, - = turn -angle,
// [ = push, ] = pop. Other symbols are ignored unless expanded by rules.

import { makeRNG } from '../random.js'

function presetSpec(name) {
  switch ((name || 'koch').toLowerCase()) {
    case 'dragon':
      return {
        axiom: 'FX',
        rules: { X: 'X+YF+', Y: '-FX-Y' },
        angleDeg: 90,
        iterations: 10,
        step: 4
      }
    case 'plant':
      return {
        axiom: 'X',
        // classic bracketed plant
        rules: { X: 'F-[[X]+X]+F[+FX]-X', F: 'FF' },
        angleDeg: 25,
        iterations: 4,
        step: 5
      }
    case 'koch':
    default:
      return {
        axiom: 'F--F--F',
        rules: { F: 'F+F--F+F' },
        angleDeg: 60,
        iterations: 4,
        step: 6
      }
  }
}

function expand(axiom, rules, iterations) {
  let s = axiom
  for (let i = 0; i < iterations; i++) {
    let out = ''
    for (const ch of s) {
      out += (rules[ch] || ch)
    }
    s = out
  }
  return s
}

export function lsystem({ width, height, margin = 20, seed, preset = 'koch', iterations, angleDeg, step, jitter = 0, onProgress }) {
  const P = presetSpec(preset)
  const iter = Number.isFinite(iterations) ? Math.max(0, Math.floor(iterations)) : P.iterations
  const ang = Number.isFinite(angleDeg) ? angleDeg : P.angleDeg
  const len = Number.isFinite(step) ? step : P.step
  const rng = makeRNG(seed)

  const seq = expand(P.axiom, P.rules, iter)
  const a = ang * Math.PI / 180

  // Start at bottom-left margin
  const startX = margin
  const startY = height - margin
  let x = startX, y = startY, th = 0
  const stack = []
  let cur = [[x, y]]
  const out = [cur]

  const emit = (nx, ny) => {
    cur.push([nx, ny])
  }

  const N = seq.length
  for (let i = 0; i < N; i++) {
    const ch = seq[i]
    if (ch === 'F' || ch === 'G') {
      const j = (jitter > 0) ? (1 + (rng.range(-jitter, jitter))) : 1
      const nx = x + Math.cos(th) * len * j
      const ny = y + Math.sin(th) * len * j
      emit(nx, ny)
      x = nx; y = ny
    } else if (ch === 'f') {
      x = x + Math.cos(th) * len
      y = y + Math.sin(th) * len
      // move without drawing: start a new polyline segment
      cur = [[x, y]]
      out.push(cur)
    } else if (ch === '+') {
      th += a
    } else if (ch === '-') {
      th -= a
    } else if (ch === '[') {
      stack.push([x, y, th])
    } else if (ch === ']') {
      const s = stack.pop()
      if (s) {
        x = s[0]; y = s[1]; th = s[2]
        cur = [[x, y]]
        out.push(cur)
      }
    }
    if (onProgress && i % 500 === 0) onProgress(i / N)
  }

  // Keep only polylines that have at least 2 points
  return out.filter(p => p.length >= 2)
}
