import * as THREE from 'three'

const textureCache = {}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function noise2D(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function fractalNoise(x, y, octaves = 4) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency)
    amplitude *= 0.5
    frequency *= 2
  }
  return value
}

export function createAsphaltTexture() {
  if (textureCache.asphalt) return textureCache.asphalt
  const size = 512
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Base dark gray
  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(0, 0, size, size)

  // Add grain/noise
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size
    const y = Math.floor((i / 4) / size)
    const noise = (fractalNoise(x * 0.05, y * 0.05, 3) - 0.5) * 30
    const crack = fractalNoise(x * 0.02, y * 0.02, 2) > 0.7 ? -15 : 0
    data[i] += noise + crack
    data[i + 1] += noise + crack
    data[i + 2] += noise + crack + 2
  }
  ctx.putImageData(imageData, 0, 0)

  // Add subtle crack lines
  ctx.strokeStyle = 'rgba(20, 20, 22, 0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    let x = Math.random() * size
    let y = Math.random() * size
    ctx.moveTo(x, y)
    for (let j = 0; j < 20; j++) {
      x += (Math.random() - 0.5) * 30
      y += (Math.random() - 0.5) * 30
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(50, 50)
  textureCache.asphalt = texture
  return texture
}

export function createConcreteTexture() {
  if (textureCache.concrete) return textureCache.concrete
  const size = 256
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#888885'
  ctx.fillRect(0, 0, size, size)

  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size
    const y = Math.floor((i / 4) / size)
    const noise = (fractalNoise(x * 0.08, y * 0.08, 3) - 0.5) * 25
    data[i] += noise
    data[i + 1] += noise
    data[i + 2] += noise
  }
  ctx.putImageData(imageData, 0, 0)

  // Joint lines
  ctx.strokeStyle = 'rgba(100, 100, 95, 0.6)'
  ctx.lineWidth = 2
  const tileSize = 64
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke()
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(10, 10)
  textureCache.concrete = texture
  return texture
}

export function createGrassTexture() {
  if (textureCache.grass) return textureCache.grass
  const size = 256
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#2d5a1e'
  ctx.fillRect(0, 0, size, size)

  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size
    const y = Math.floor((i / 4) / size)
    const noise = fractalNoise(x * 0.1, y * 0.1, 4)
    const variation = (noise - 0.5) * 60
    data[i] = Math.max(0, Math.min(255, 30 + variation * 0.5))
    data[i + 1] = Math.max(0, Math.min(255, 75 + variation))
    data[i + 2] = Math.max(0, Math.min(255, 20 + variation * 0.3))
  }
  ctx.putImageData(imageData, 0, 0)

  // Grass blade strokes
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const h = 3 + Math.random() * 6
    ctx.strokeStyle = `rgba(${30 + Math.random() * 40}, ${80 + Math.random() * 60}, ${15 + Math.random() * 20}, 0.4)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(20, 20)
  textureCache.grass = texture
  return texture
}

export function createBrickTexture() {
  if (textureCache.brick) return textureCache.brick
  const size = 256
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Mortar base
  ctx.fillStyle = '#b0a090'
  ctx.fillRect(0, 0, size, size)

  const brickW = 32
  const brickH = 16
  const mortarW = 2

  for (let row = 0; row < size / brickH; row++) {
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col < size / brickW + 1; col++) {
      const x = col * brickW + offset
      const y = row * brickH
      const noise = fractalNoise(col * 0.3, row * 0.3, 2)
      const r = 140 + noise * 50
      const g = 60 + noise * 30
      const b = 40 + noise * 20
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(x + mortarW, y + mortarW, brickW - mortarW * 2, brickH - mortarW * 2)

      // Brick texture variation
      const imgData = ctx.getImageData(x + mortarW, y + mortarW, brickW - mortarW * 2, brickH - mortarW * 2)
      const d = imgData.data
      for (let i = 0; i < d.length; i += 4) {
        const bx = (i / 4) % (brickW - mortarW * 2)
        const by = Math.floor((i / 4) / (brickW - mortarW * 2))
        const n = (noise2D(bx * 0.2 + col * 10, by * 0.2 + row * 10) - 0.5) * 20
        d[i] += n; d[i + 1] += n; d[i + 2] += n
      }
      ctx.putImageData(imgData, x + mortarW, y + mortarW)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.brick = texture
  return texture
}

export function createMetalTexture() {
  if (textureCache.metal) return textureCache.metal
  const size = 128
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#6a6a72')
  gradient.addColorStop(0.5, '#8a8a92')
  gradient.addColorStop(1, '#6a6a72')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Brushed metal lines
  for (let i = 0; i < 200; i++) {
    const y = Math.random() * size
    ctx.strokeStyle = `rgba(${140 + Math.random() * 30}, ${140 + Math.random() * 30}, ${148 + Math.random() * 30}, 0.2)`
    ctx.lineWidth = Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + (Math.random() - 0.5) * 10)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.metal = texture
  return texture
}

export function createWoodTexture() {
  if (textureCache.wood) return textureCache.wood
  const size = 128
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#6b4226'
  ctx.fillRect(0, 0, size, size)

  // Wood grain lines
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * size
    const darkness = 60 + Math.random() * 40
    ctx.strokeStyle = `rgba(${darkness}, ${darkness * 0.55}, ${darkness * 0.3}, 0.3)`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    let cx = 0
    let cy = y
    while (cx < size) {
      cx += 5
      cy += (Math.random() - 0.5) * 3
      ctx.lineTo(cx, cy)
    }
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.wood = texture
  return texture
}

export function createSignTexture(text, bgColor, fgColor, width = 128, height = 128) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  // Border
  ctx.strokeStyle = fgColor
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, width - 8, height - 8)

  // Text
  ctx.fillStyle = fgColor
  ctx.font = `bold ${Math.floor(height * 0.35)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)

  return new THREE.CanvasTexture(canvas)
}

export function createNeonSignTexture(text, color) {
  const canvas = createCanvas(256, 64)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(0,0,0,0.8)'
  ctx.fillRect(0, 0, 256, 64)

  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fillStyle = color
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  ctx.fillText(text, 128, 32) // Double draw for stronger glow

  return new THREE.CanvasTexture(canvas)
}

export function createCrosswalkTexture() {
  const canvas = createCanvas(64, 256)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(0, 0, 64, 256)

  // White stripes
  ctx.fillStyle = '#dddddd'
  for (let y = 0; y < 256; y += 40) {
    ctx.fillRect(2, y, 60, 20)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

export function createWindowTexture(isLit, hasCurtain) {
  const canvas = createCanvas(32, 48)
  const ctx = canvas.getContext('2d')

  // Frame
  ctx.fillStyle = '#3a3a42'
  ctx.fillRect(0, 0, 32, 48)

  // Glass
  const glassColor = isLit ? '#ffdd88' : '#5577aa'
  ctx.fillStyle = glassColor
  ctx.fillRect(2, 2, 28, 44)

  // Cross frame
  ctx.fillStyle = '#3a3a42'
  ctx.fillRect(14, 2, 4, 44)
  ctx.fillRect(2, 22, 28, 4)

  // Curtain
  if (hasCurtain) {
    ctx.fillStyle = isLit ? 'rgba(180, 60, 60, 0.5)' : 'rgba(60, 60, 80, 0.5)'
    ctx.fillRect(2, 2, 8, 20)
    ctx.fillRect(22, 2, 8, 20)
  }

  // Light glow
  if (isLit) {
    ctx.fillStyle = 'rgba(255, 220, 100, 0.3)'
    ctx.fillRect(4, 24, 24, 20)
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

export function createRoofTexture() {
  if (textureCache.roof) return textureCache.roof
  const size = 128
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#444448'
  ctx.fillRect(0, 0, size, size)

  // Tar paper pattern
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % size
    const y = Math.floor((i / 4) / size)
    const n = (noise2D(x * 0.15, y * 0.15) - 0.5) * 20
    data[i] += n; data[i + 1] += n; data[i + 2] += n + 2
  }
  ctx.putImageData(imageData, 0, 0)

  // Gravel dots
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = `rgba(${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${84 + Math.random() * 40}, 0.5)`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.roof = texture
  return texture
}
