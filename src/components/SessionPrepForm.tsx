import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PrepNotes, type Session } from '../db'

const STEPS: { key: keyof PrepNotes; label: string; placeholder: string }[] = [
  { key: 'strongStart', label: '1. Strong Start', placeholder: 'How does the session begin? A bang, a hook, a revelation…' },
  { key: 'scenes', label: '2. Scenes', placeholder: 'Potential scenes the players might move through…' },
  { key: 'secretsAndClues', label: '3. Secrets & Clues', placeholder: 'Ten secrets or clues the players might uncover…' },
  { key: 'fantasticLocations', label: '4. Fantastic Locations', placeholder: 'Evocative locations for the session…' },
  { key: 'npcs', label: '5. NPCs', placeholder: 'Notable NPCs who might appear…' },
  { key: 'monsters', label: '6. Monsters', placeholder: 'Monsters and their motivations…' },
  { key: 'magicItems', label: '7. Magic Items', placeholder: 'Relevant magic items or rewards…' },
  { key: 'characterReview', label: '8. Character Review', placeholder: 'Party members, their goals, backstory hooks…' },
]

interface Props {
  session: Session
  campaignId: string
}

export default function SessionPrepForm({ session, campaignId }: Props) {
  const [notes, setNotes] = useState<PrepNotes>(session.prepNotes)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const characters = useLiveQuery(
    () => db.characters.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const prevSession = useLiveQuery(async () => {
    const sessions = await db.sessions
      .where('campaignId')
      .equals(campaignId)
      .toArray()
    return sessions
      .filter(s => s.status === 'complete' && s.date < session.date)
      .sort((a, b) => b.date - a.date)[0] ?? null
  }, [campaignId, session.date])

  // Pre-populate Character Review from party if empty
  useEffect(() => {
    if (!characters || characters.length === 0) return
    if (notes.characterReview) return
    const text = characters
      .map(c => `${c.name} — ${c.class} ${c.level}${c.backstoryHooks ? ` (${c.backstoryHooks})` : ''}`)
      .join('\n')
    setNotes(n => ({ ...n, characterReview: text }))
  }, [characters])

  function handleChange(key: keyof PrepNotes, value: string) {
    const updated = { ...notes, [key]: value }
    setNotes(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      db.sessions.update(session.id, { prepNotes: updated })
    }, 500)
  }

  return (
    <div>
      {prevSession && prevSession.summary && (
        <div style={prevSummaryStyle}>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Previous Session Summary — {prevSession.name}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280', whiteSpace: 'pre-wrap' }}>{prevSession.summary}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {STEPS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <textarea
              value={notes[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={placeholder}
              rows={key === 'characterReview' ? 5 : 4}
              style={textareaStyle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const prevSummaryStyle: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  marginBottom: 32,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 14,
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.5,
}
