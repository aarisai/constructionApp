import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { useStore } from '../context/Store'
import { Lightbox } from './ui'

export function PhotoPicker({
  label,
  existingIds,
  onRemoveExisting,
  files,
  onFiles,
  multiple = false,
  max = 1,
}: {
  label: string
  existingIds: string[]
  onRemoveExisting: (id: string) => void
  files: File[]
  onFiles: (files: File[]) => void
  multiple?: boolean
  max?: number
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const total = existingIds.length + files.length
  const room = Math.max(0, max - total)

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
    }
  }, [files])

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    const incoming = [...list]
    if (!multiple) {
      onFiles(incoming.slice(0, 1))
      return
    }
    onFiles([...files, ...incoming].slice(0, Math.max(0, max - existingIds.length)))
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <p className="mb-2 text-sm text-muted">Compressed on this phone before saving.</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 text-sm font-semibold"
          onClick={() => cameraRef.current?.click()}
          disabled={room === 0 && multiple}
        >
          <Camera size={18} />
          Take photo
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 text-sm font-semibold"
          onClick={() => galleryRef.current?.click()}
          disabled={room === 0 && multiple}
        >
          <ImagePlus size={18} />
          Gallery
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      {existingIds.length + previews.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {existingIds.map((id) => (
            <ExistingThumb key={id} id={id} onRemove={() => onRemoveExisting(id)} />
          ))}
          {previews.map((url, index) => (
            <Preview key={url} url={url} alt={`New photo ${index + 1}`} onRemove={() => onFiles(files.filter((_, fileIndex) => fileIndex !== index))} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ExistingThumb({ id, onRemove }: { id: string; onRemove: () => void }) {
  const { photoUrl } = useStore()
  const url = photoUrl(id)
  if (!url) return <p className="text-sm text-muted">Photo missing</p>
  return <Preview url={url} alt="Saved photo" onRemove={onRemove} />
}

function Preview({ url, alt, onRemove }: { url: string; alt: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(true)} className="block size-20 overflow-hidden rounded-xl border border-line">
        <img src={url} alt={alt} className="size-full object-cover" />
      </button>
      <button
        type="button"
        aria-label="Remove photo"
        onClick={onRemove}
        className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-due text-white"
      >
        <X size={14} />
      </button>
      {open ? <Lightbox src={url} alt={alt} onClose={() => setOpen(false)} /> : null}
    </div>
  )
}

export function Thumb({ id, alt }: { id: string | null; alt: string }) {
  const { photoUrl } = useStore()
  const [open, setOpen] = useState(false)
  if (!id) return null
  const url = photoUrl(id)
  if (!url) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="size-16 overflow-hidden rounded-xl border border-line">
        <img src={url} alt={alt} className="size-full object-cover" />
      </button>
      {open ? <Lightbox src={url} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
