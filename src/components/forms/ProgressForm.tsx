import { useState, type FormEvent } from 'react'
import { useStore } from '../../context/Store'
import { isISODate, toISODate } from '../../lib/format'
import { uid } from '../../lib/id'
import { notify } from '../../lib/notify'
import { STAGES, type ProgressUpdate, type Stage } from '../../types'
import { PhotoPicker } from '../PhotoPicker'
import { Button, Field, inputClassName } from '../ui'
import { DateField, SiteSelect } from './fields'

export function ProgressForm({
  siteId,
  existing,
  onDone,
}: {
  siteId?: string
  existing?: ProgressUpdate
  onDone: () => void
}) {
  const store = useStore()
  const preset = siteId ? store.state.sites.find((site) => site.id === siteId) : undefined
  const [site, setSite] = useState(existing?.siteId ?? siteId ?? '')
  const [date, setDate] = useState(existing?.date ?? toISODate(new Date()))
  const [stage, setStage] = useState<Stage>(existing?.stage ?? preset?.stage ?? 'Excavation')
  const [note, setNote] = useState(existing?.note ?? '')
  const [blockers, setBlockers] = useState(existing?.blockers ?? '')
  const [kept, setKept] = useState<string[]>(existing?.photoIds ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!site) nextErrors.site = 'Choose a site.'
    if (!note.trim()) nextErrors.note = 'Write what was done this week.'
    if (!isISODate(date)) nextErrors.date = 'Choose a valid date.'
    if (kept.length + files.length > 6) nextErrors.photos = 'You can attach up to 6 photos.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    setFormError('')
    try {
      const uploaded: string[] = []
      for (const file of files) uploaded.push(await store.attachPhoto(file))
      store.saveProgress({
        id: existing?.id ?? uid(),
        siteId: site,
        date,
        stage,
        note: note.trim(),
        blockers: blockers.trim(),
        photoIds: [...kept, ...uploaded],
      })
      const current = store.state.sites.find((item) => item.id === site)
      if (current && STAGES.indexOf(stage) > STAGES.indexOf(current.stage)) {
        store.saveSite({ ...current, stage })
      }
      notify('Weekly update saved')
      onDone()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this update.')
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <SiteSelect value={site} onChange={setSite} error={errors.site} />
      <DateField label="Week ending" value={date} onChange={setDate} error={errors.date} />
      <Field label="Stage">
        <select className={inputClassName()} value={stage} onChange={(event) => setStage(event.target.value as Stage)}>
          {STAGES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="What got done this week" error={errors.note}>
        <textarea
          className={inputClassName(Boolean(errors.note))}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <Field label="What slowed the work" hint="Optional. A late delivery, rain, or a short crew.">
        <textarea className={inputClassName()} rows={2} value={blockers} onChange={(event) => setBlockers(event.target.value)} />
      </Field>
      <PhotoPicker
        label="Pictures from the week"
        multiple
        max={6}
        existingIds={kept}
        onRemoveExisting={(id) => setKept((current) => current.filter((item) => item !== id))}
        files={files}
        onFiles={setFiles}
      />
      {errors.photos ? <p className="text-sm font-medium text-due">{errors.photos}</p> : null}
      <p className="text-sm text-muted">Up to 6 photos. If this stage is ahead of the site, the site stage moves forward too.</p>
      {formError ? <p className="text-sm font-medium text-due">{formError}</p> : null}
      <Button type="submit" block disabled={saving}>
        {saving ? 'Saving…' : 'Save update'}
      </Button>
    </form>
  )
}
