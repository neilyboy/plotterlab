// Load an image File into a downscaled grayscale array (0..1)
export async function fileToGrayscale(file, maxDim = 800) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = reject
      im.src = url
    })
    const { width: w0, height: h0 } = img
    const scale = Math.min(1, maxDim / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const gray = new Float32Array(w * h)
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const r = data[i], g = data[i+1], b = data[i+2]
      // Rec. 709 luma
      const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      gray[j] = y
    }
    return { width: w, height: h, data: gray }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Load an image File into downscaled separate channels r,g,b plus grayscale in 0..1
export async function fileToRGB(file, maxDim = 800) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = reject
      im.src = url
    })
    const { width: w0, height: h0 } = img
    const scale = Math.min(1, maxDim / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    const { data } = ctx.getImageData(0, 0, w, h)
    const r = new Float32Array(w * h)
    const g = new Float32Array(w * h)
    const b = new Float32Array(w * h)
    const gray = new Float32Array(w * h)
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const R = data[i] / 255
      const G = data[i+1] / 255
      const B = data[i+2] / 255
      r[j] = R
      g[j] = G
      b[j] = B
      // Rec. 709 luma
      gray[j] = 0.2126 * R + 0.7152 * G + 0.0722 * B
    }
    return { width: w, height: h, data: gray, r, g, b }
  } finally {
    URL.revokeObjectURL(url)
  }
}
