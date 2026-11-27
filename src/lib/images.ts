import { SAMPLE_IMAGES } from './sample'

export interface PhotoDraft {
  id: string
  blob: Blob
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const maxEdge = 1280
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not compress this photo.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    return await canvasToJpeg(canvas, 0.72)
  } finally {
    bitmap.close()
  }
}

export async function createSamplePhotos(): Promise<PhotoDraft[]> {
  const progress: Array<[string, string, string, Palette]> = [
    [SAMPLE_IMAGES.jpFoundation, 'Foundation raft', 'JP Nagar', 'rebar'],
    [SAMPLE_IMAGES.jpSlab, 'Ground slab pour', 'JP Nagar', 'slab'],
    [SAMPLE_IMAGES.jpBrick, 'Blockwork to lintel', 'JP Nagar', 'brick'],
    [SAMPLE_IMAGES.wfPit, 'Footing excavation', 'Whitefield', 'pit'],
    [SAMPLE_IMAGES.wfFooting, 'Column starters', 'Whitefield', 'rebar'],
    [SAMPLE_IMAGES.wfSlab, 'Slab centring', 'Whitefield', 'slab'],
  ]
  const photos: PhotoDraft[] = []
  for (const [id, title, place, palette] of progress) {
    photos.push({ id, blob: await drawProgress(title, place, palette) })
  }
  photos.push({ id: SAMPLE_IMAGES.upi, blob: await drawReceipt() })
  photos.push({ id: SAMPLE_IMAGES.challan, blob: await drawChallan() })
  return photos
}

type Palette = 'rebar' | 'slab' | 'brick' | 'pit'

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  try {
    return Promise.resolve(jpegFromDataUrl(canvas.toDataURL('image/jpeg', quality)))
  } catch {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Could not save the photo.'))
        },
        'image/jpeg',
        quality,
      )
    })
  }
}

function jpegFromDataUrl(dataUrl: string): Blob {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Could not save the photo.')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: 'image/jpeg' })
}

async function drawProgress(title: string, place: string, palette: Palette): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 800
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the sample photo.')
  const sky = ctx.createLinearGradient(0, 0, 0, 520)
  sky.addColorStop(0, palette === 'pit' ? '#c9d7c2' : '#d7e4ef')
  sky.addColorStop(1, '#f4efe4')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1200, 800)
  ctx.fillStyle = palette === 'brick' ? '#c46a45' : '#b08968'
  ctx.fillRect(0, 520, 1200, 280)

  if (palette === 'rebar') drawRebar(ctx)
  if (palette === 'slab') drawSlab(ctx)
  if (palette === 'brick') drawBricks(ctx)
  if (palette === 'pit') drawPit(ctx)

  ctx.fillStyle = 'rgba(20, 24, 18, 0.82)'
  ctx.fillRect(0, 680, 1200, 120)
  ctx.fillStyle = '#f7f3ea'
  ctx.font = '600 42px Outfit, sans-serif'
  ctx.fillText(title, 48, 742)
  ctx.font = '400 28px Outfit, sans-serif'
  ctx.fillStyle = '#e7d7b8'
  ctx.fillText(`${place} · sample site photo`, 48, 782)
  return canvasToJpeg(canvas, 0.74)
}

function drawRebar(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = '#5c6b73'
  ctx.lineWidth = 8
  for (let x = 180; x <= 1020; x += 70) {
    ctx.beginPath()
    ctx.moveTo(x, 560)
    ctx.lineTo(x, 250)
    ctx.stroke()
  }
  for (let y = 280; y <= 540; y += 55) {
    ctx.beginPath()
    ctx.moveTo(160, y)
    ctx.lineTo(1040, y)
    ctx.stroke()
  }
  ctx.strokeStyle = '#8d6a45'
  ctx.strokeRect(150, 240, 900, 330)
}

function drawSlab(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8e98a0'
  ctx.fillRect(120, 360, 960, 180)
  ctx.strokeStyle = '#5e6770'
  ctx.lineWidth = 6
  for (let x = 150; x <= 1040; x += 80) {
    ctx.beginPath()
    ctx.moveTo(x, 360)
    ctx.lineTo(x, 540)
    ctx.stroke()
  }
  ctx.fillStyle = '#d9dee3'
  ctx.fillRect(120, 330, 960, 36)
}

function drawBricks(ctx: CanvasRenderingContext2D): void {
  for (let row = 0; row < 8; row += 1) {
    const y = 250 + row * 36
    const offset = row % 2 === 0 ? 0 : 28
    for (let x = 160 - offset; x < 1040; x += 86) {
      ctx.fillStyle = row % 2 === 0 ? '#b85a3d' : '#a44b34'
      ctx.fillRect(x, y, 78, 28)
    }
  }
}

function drawPit(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8c6244'
  ctx.fillRect(220, 300, 760, 280)
  ctx.fillStyle = '#6d4a32'
  ctx.fillRect(300, 360, 600, 180)
  ctx.strokeStyle = '#f4efe4'
  ctx.lineWidth = 4
  ctx.strokeRect(220, 300, 760, 280)
}

async function drawReceipt(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1200
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the sample receipt.')
  ctx.fillStyle = '#f7f3ea'
  ctx.fillRect(0, 0, 900, 1200)
  ctx.fillStyle = '#1e3a2f'
  ctx.fillRect(0, 0, 900, 220)
  ctx.fillStyle = '#f7f3ea'
  ctx.font = '700 42px Outfit, sans-serif'
  ctx.fillText('SAMPLE UPI RECEIPT', 48, 100)
  ctx.font = '400 28px Outfit, sans-serif'
  ctx.fillText('Not a real bank payment', 48, 155)
  ctx.fillStyle = '#1a1814'
  ctx.font = '600 64px "Fraunces Variable", Georgia, serif'
  ctx.fillText('₹5,00,000', 48, 360)
  ctx.font = '400 32px Outfit, sans-serif'
  writeLine(ctx, 'Paid to Sankalpa Constructions', 48, 450)
  writeLine(ctx, 'From Prakash Rao', 48, 510)
  writeLine(ctx, 'UPI ref 529100448213', 48, 570)
  writeLine(ctx, 'Lakshmi Nilaya · part of first slab', 48, 630)
  ctx.fillStyle = '#8a5600'
  ctx.font = '600 28px Outfit, sans-serif'
  ctx.fillText('Sample image for the app demo', 48, 1100)
  return canvasToJpeg(canvas, 0.8)
}

async function drawChallan(): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1200
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the sample challan.')
  ctx.fillStyle = '#fffdf8'
  ctx.fillRect(0, 0, 900, 1200)
  ctx.strokeStyle = '#1e3a2f'
  ctx.lineWidth = 8
  ctx.strokeRect(36, 36, 828, 1128)
  ctx.fillStyle = '#1e3a2f'
  ctx.font = '700 40px Outfit, sans-serif'
  ctx.fillText('SAMPLE DELIVERY CHALLAN', 72, 120)
  ctx.font = '400 30px Outfit, sans-serif'
  ctx.fillStyle = '#1a1814'
  writeLine(ctx, 'Maruthi Traders · Bengaluru', 72, 200)
  writeLine(ctx, 'Site: Lakshmi Nilaya, JP Nagar', 72, 270)
  writeLine(ctx, 'Cement · UltraTech PPC', 72, 360)
  writeLine(ctx, '200 bags', 72, 420)
  writeLine(ctx, 'Bill ₹76,000', 72, 480)
  writeLine(ctx, 'Received at site for column work', 72, 560)
  ctx.fillStyle = '#8a5600'
  ctx.font = '600 28px Outfit, sans-serif'
  ctx.fillText('Sample image. Not a supplier document.', 72, 1080)
  return canvasToJpeg(canvas, 0.8)
}

function writeLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillText(text, x, y)
}
