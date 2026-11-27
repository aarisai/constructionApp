import { useState, type ReactNode } from 'react'
import { Camera, HardHat, Receipt, Wallet } from 'lucide-react'
import type { EntryType } from '../lib/notify'
import { LabourEntry } from './forms/LabourForm'
import { MaterialBillForm } from './forms/MaterialBillForm'
import { OwnerPaymentForm } from './forms/OwnerPaymentForm'
import { ProgressForm } from './forms/ProgressForm'
import { Sheet } from './ui'

export function QuickEntry({
  open,
  siteId,
  type,
  onClose,
}: {
  open: boolean
  siteId?: string
  type?: EntryType
  onClose: () => void
}) {
  return (
    <Sheet open={open} title="Log an entry" onClose={onClose}>
      {open ? <QuickBody key={`${siteId ?? 'all'}-${type ?? 'pick'}`} siteId={siteId} initialType={type} onClose={onClose} /> : null}
    </Sheet>
  )
}

function QuickBody({ siteId, initialType, onClose }: { siteId?: string; initialType?: EntryType; onClose: () => void }) {
  const [type, setType] = useState<EntryType | null>(initialType ?? null)
  if (!type) {
    return (
      <div className="grid gap-2">
        <Choice icon={<Wallet size={22} />} title="Owner payment in" body="Money received from the site owner." onClick={() => setType('owner')} />
        <Choice icon={<Receipt size={22} />} title="Material bill" body="Cement, steel, sand, or any supplier bill." onClick={() => setType('material')} />
        <Choice icon={<HardHat size={22} />} title="Labour / kharchi" body="A lump-sum contract, or Saturday advance." onClick={() => setType('labour')} />
        <Choice icon={<Camera size={22} />} title="Site photo" body="Today's work, with a short note." onClick={() => setType('photo')} />
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {initialType ? null : (
        <button type="button" className="text-sm font-semibold" onClick={() => setType(null)}>
          Change entry type
        </button>
      )}
      {type === 'owner' ? <OwnerPaymentForm siteId={siteId} onDone={onClose} /> : null}
      {type === 'material' ? <MaterialBillForm siteId={siteId} onDone={onClose} /> : null}
      {type === 'labour' ? <LabourEntry siteId={siteId} onDone={onClose} /> : null}
      {type === 'photo' ? <ProgressForm siteId={siteId} onDone={onClose} /> : null}
    </div>
  )
}

function Choice({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-20 items-center gap-3 rounded-2xl border border-line bg-paper px-3 text-left">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
    </button>
  )
}
