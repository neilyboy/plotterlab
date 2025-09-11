import seedrandom from 'seedrandom'
import { createNoise2D } from 'simplex-noise'

export function makeRNG(seed) {
  const rng = seedrandom(String(seed || 'seed'))
  const noise2D = createNoise2D(rng)
  const rand = () => rng()
  const range = (a, b) => a + (b - a) * rand()
  const int = (a, b) => Math.floor(range(a, b + 1))
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const shuffle = (arr) => arr.slice().sort(() => rand() - 0.5)
  return { rand, range, int, pick, shuffle, noise2D }
}
