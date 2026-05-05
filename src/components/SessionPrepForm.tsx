import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PrepNotes, type Session } from '../db'

const STEPS: { key: keyof PrepNotes; label: string; placeholder: string }[] = [
  { key: 'strongStart',        label: 'Strong Start',       placeholder: 'How does the session begin? A bang, a hook, a revelation…' },
  { key: 'scenes',             label: 'Scenes',             placeholder: 'Potential scenes the players might move through…' },
  { key: 'secretsAndClues',    label: 'Secrets & Clues',    placeholder: 'Ten secrets or clues the players might uncover…' },
  { key: 'fantasticLocations', label: 'Fantastic Locations', placeholder: 'Evocative locations for the session…' },
  { key: 'npcs',               label: 'NPCs',               placeholder: 'Notable NPCs who might appear…' },
  { key: 'monsters',           label: 'Monsters',           placeholder: 'Monsters and their motivations…' },
  { key: 'magicItems',         label: 'Magic Items',        placeholder: 'Relevant magic items or rewards…' },
  { key: 'characterReview',    label: 'Character Review',   placeholder: 'Party members, their goals, backstory hooks…' },
]

interface Props {
  session: Session
  campaignId: string
}

export default function SessionPrepForm({ session, campaignId }: Props) {
  const [notes, setNotes] = useState<PrepNotes>(session.prepNotes)
  const [activeKey, setActiveKey] = useState<keyof PrepNotes | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const characters = useLiveQuery(
    () => db.characters.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const campaignNpcs = useLiveQuery(
    () => db.npcs.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const prevSession = useLiveQuery(async () => {
    const sessions = await db.sessions.where('campaignId').equals(campaignId).toArray()
    return sessions
      .filter(s => s.status === 'complete' && s.date < session.date)
      .sort((a, b) => b.date - a.date)[0] ?? null
  }, [campaignId, session.date])

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

  function appendNpc(npc: { name: string; role: string }) {
    const line = npc.role ? `${npc.name} — ${npc.role}` : npc.name
    const existing = notes.npcs
    handleChange('npcs', existing ? `${existing}\n${line}` : line)
  }

  const filledCount = STEPS.filter(s => notes[s.key].trim()).length

  return (
    <div>
      {prevSession && prevSession.summary && (
        <div className="form-panel" style={{ marginBottom: 24 }}>
          <p className="label" style={{ marginBottom: 4 }}>Previous Session — {prevSession.name}</p>
          <p className="meta" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{prevSession.summary}</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="meta">{filledCount} of {STEPS.length} steps completed</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map(s => (
            <div
              key={s.key}
              title={s.label}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: notes[s.key].trim() ? 'var(--blue-600)' : 'var(--gray-200)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map(({ key, label, placeholder }, i) => (
          <PrepCard
            key={key}
            stepNum={i + 1}
            label={label}
            placeholder={placeholder}
            value={notes[key]}
            isActive={activeKey === key}
            onActivate={() => setActiveKey(key)}
            onBlur={() => setActiveKey(null)}
            onChange={val => handleChange(key, val)}
            npcPicker={key === 'npcs' && campaignNpcs && campaignNpcs.length > 0
              ? <NpcDropdown npcs={campaignNpcs} onAdd={appendNpc} />
              : null
            }
          />
        ))}
      </div>
    </div>
  )
}

interface PrepCardProps {
  stepNum: number
  label: string
  placeholder: string
  value: string
  isActive: boolean
  onActivate: () => void
  onBlur: () => void
  onChange: (val: string) => void
  npcPicker: React.ReactNode
}

function PrepCard({ stepNum, label, placeholder, value, isActive, onActivate, onBlur, onChange, npcPicker }: PrepCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const filled = value.trim().length > 0

  useEffect(() => {
    if (isActive) textareaRef.current?.focus()
  }, [isActive])

  function handleCardBlur(e: React.FocusEvent) {
    // only blur if focus leaves the whole card (including NPC dropdown)
    if (cardRef.current && !cardRef.current.contains(e.relatedTarget as Node)) {
      onBlur()
    }
  }

  return (
    <div
      ref={cardRef}
      onBlur={handleCardBlur}
      onClick={() => { if (!isActive) onActivate() }}
      style={{
        background: '#fff',
        border: `1px solid ${isActive ? 'var(--blue-600)' : filled ? 'var(--gray-200)' : 'var(--gray-200)'}`,
        borderRadius: 'var(--radius)',
        boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.1)' : 'var(--shadow-sm)',
        cursor: isActive ? 'default' : 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isActive ? '12px 16px 8px' : '12px 16px',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          background: filled ? 'var(--blue-600)' : 'var(--gray-100)',
          color: filled ? '#fff' : 'var(--gray-400)',
          transition: 'background 0.2s, color 0.2s',
        }}>
          {filled ? '✓' : stepNum}
        </span>
        <span style={{
          fontSize: 14,
          fontWeight: 600,
          color: filled ? 'var(--gray-900)' : 'var(--gray-500)',
        }}>
          {label}
        </span>
        {!isActive && filled && (
          <span className="meta" style={{
            marginLeft: 'auto',
            fontSize: 12,
            maxWidth: 260,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {value.split('\n')[0]}
          </span>
        )}
        {!isActive && !filled && (
          <span className="meta" style={{ marginLeft: 'auto', fontSize: 12, fontStyle: 'italic' }}>
            Click to add…
          </span>
        )}
      </div>

      {/* Edit area */}
      {isActive && (
        <div style={{ padding: '0 16px 14px' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={5}
            style={{ marginBottom: npcPicker ? 8 : 0 }}
          />
          {npcPicker}
        </div>
      )}
    </div>
  )
}

function NpcDropdown({
  npcs,
  onAdd,
}: {
  npcs: { id: string; name: string; role: string }[]
  onAdd: (npc: { name: string; role: string }) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? npcs.filter(n => n.name.toLowerCase().includes(query.toLowerCase()))
    : npcs

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function select(npc: { id: string; name: string; role: string }) {
    onAdd(npc)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Add NPC from roster…"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--gray-300)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
          zIndex: 20, maxHeight: 200, overflowY: 'auto', marginTop: 2,
        }}>
          {filtered.map(npc => (
            <div
              key={npc.id}
              onMouseDown={() => select(npc)}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <span style={{ fontWeight: 500 }}>{npc.name}</span>
              {npc.role && <span className="meta" style={{ marginLeft: 8 }}>{npc.role}</span>}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
          background: '#fff', border: '1px solid var(--gray-300)',
          borderRadius: 'var(--radius)', padding: '8px 12px',
        }}>
          <span className="meta">No NPCs match.</span>
        </div>
      )}
    </div>
  )
}
