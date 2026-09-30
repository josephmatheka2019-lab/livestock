// Photos are stored in localStorage (about 5 MB in total), so every upload is
// shrunk to a small JPEG before it is saved.
const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION = 640
const JPEG_QUALITY = 0.72

export function processPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file, such as a JPG or PNG.'))
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error('That photo is larger than 10 MB. Choose a smaller one.'))
      return
    }

    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      // JPEG has no transparency, so paint white behind PNGs.
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This browser could not read that image. Try a JPG or PNG.'))
    }
    image.src = url
  })
}
