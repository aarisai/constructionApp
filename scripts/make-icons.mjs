import { deflateSync } from 'node:zlib'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function pointInTri(px, py, a, b, c) {
  const sign = (p1, p2, p3) =>
    (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
  const d1 = sign([px, py], a, b)
  const d2 = sign([px, py], b, c)
  const d3 = sign([px, py], c, a)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function paint(x, y, size, inset) {
  const u = (x + 0.5) / size
  const v = (y + 0.5) / size
  const background = [122, 83, 68, 255]
  const span = 1 - inset * 2
  const cu = (u - inset) / span
  const cv = (v - inset) / span
  if (cu < 0 || cu > 1 || cv < 0 || cv > 1) return background
  let color = background
  if ((cu - 0.72) ** 2 + (cv - 0.28) ** 2 <= 0.1 ** 2) color = [243, 215, 161, 255]
  if (pointInTri(cu, cv, [0.22, 0.56], [0.5, 0.28], [0.78, 0.56])) color = [255, 250, 246, 255]
  if (cu >= 0.3 && cu <= 0.7 && cv >= 0.52 && cv <= 0.84) color = [255, 250, 246, 255]
  if (cu >= 0.34 && cu <= 0.43 && cv >= 0.58 && cv <= 0.68) color = [231, 201, 162, 255]
  if (cu >= 0.45 && cu <= 0.56 && cv >= 0.66 && cv <= 0.84) color = [196, 92, 52, 255]
  return color
}

function splashColor(x, y, size) {
  const paper = [246, 243, 238, 255]
  const u = (x + 0.5) / size
  const v = (y + 0.5) / size
  const side = 0.34
  const left = (1 - side) / 2
  const cu = (u - left) / side
  const cv = (v - left) / side
  if (cu < 0 || cu > 1 || cv < 0 || cv > 1) return paper
  const dx = Math.abs(cu - 0.5)
  const dy = Math.abs(cv - 0.5)
  const radius = 0.18
  const cornerX = Math.max(0, dx - (0.5 - radius))
  const cornerY = Math.max(0, dy - (0.5 - radius))
  if (cornerX * cornerX + cornerY * cornerY > radius * radius) return paper
  const mark = 256
  return paint(Math.min(mark - 1, Math.floor(cu * mark)), Math.min(mark - 1, Math.floor(cv * mark)), mark, 0)
}

function pngFrom(size, colorAt) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y += 1) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = colorAt(x, y, size)
      const index = row + 1 + x * 4
      raw[index] = r
      raw[index + 1] = g
      raw[index + 2] = b
      raw[index + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function png(size, inset) {
  return pngFrom(size, (x, y, current) => paint(x, y, current, inset))
}

mkdirSync(root, { recursive: true })
writeFileSync(join(root, 'icon-192.png'), png(192, 0))
writeFileSync(join(root, 'icon-512.png'), png(512, 0))
writeFileSync(join(root, 'icon-512-maskable.png'), png(512, 0.12))
const icon1024 = png(1024, 0)
writeFileSync(join(root, 'icon-1024.png'), icon1024)
const projectRoot = join(root, '..', '..')
const appIcon = join(projectRoot, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')
if (existsSync(dirname(appIcon))) copyFileSync(join(root, 'icon-1024.png'), appIcon)
const splashDir = join(projectRoot, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
if (existsSync(splashDir)) {
  const splash = pngFrom(2732, splashColor)
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    writeFileSync(join(splashDir, name), splash)
  }
}
console.log('Wrote icons to public/icons')
