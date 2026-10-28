import { useState } from 'react'
import { ZONES, lookupZip, zoneLabel } from '../data/zones'

interface Props {
  zone: number
  zoneSource: string | null
  onChange: (zone: number, source: string | null, latitude?: number) => void
}

export function RegionPicker({ zone, zoneSource, onChange }: Props) {
  const [zip, setZip] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'error'; msg?: string }>({ kind: 'idle' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{5}$/.test(zip.trim())) {
      setStatus({ kind: 'error', msg: 'Enter a 5-digit US ZIP' })
      return
    }
    setStatus({ kind: 'busy' })
    try {
      const r = await lookupZip(zip.trim())
      onChange(r.zone, `ZIP ${zip.trim()} → zone ${r.label}`, r.latitude ?? undefined)
      setStatus({ kind: 'idle' })
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message })
    }
  }

  return (
    <div className="region">
      <label className="region-zone">
        <span className="label">Hardiness zone</span>
        <select value={zone} onChange={(e) => onChange(Number(e.target.value), null)}>
          {ZONES.map((z) => (
            <option key={z.zone} value={z.zone}>
              {zoneLabel(z)}
            </option>
          ))}
        </select>
      </label>
      <form className="region-zip" onSubmit={submit}>
        <input inputMode="numeric" maxLength={5} placeholder="US ZIP" value={zip} onChange={(e) => setZip(e.target.value)} aria-label="US ZIP code" />
        <button type="submit" disabled={status.kind === 'busy'}>
          {status.kind === 'busy' ? '…' : 'Find zone'}
        </button>
      </form>
      <span className={status.kind === 'error' ? 'region-note error' : 'region-note'}>
        {status.kind === 'error' ? status.msg : zoneSource ?? 'Outside the US? Pick the zone matching your coldest winter night.'}
      </span>
    </div>
  )
}
