import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PrepNotes, type Session } from '../db'
import { assembleContext } from '../assembleContext'
import { generate, MissingApiKeyError, type GenerationType } from '../aiService'

interface StepDef {
  key: keyof PrepNotes
  label: string
  placeholder: string
  aiType: GenerationType
  aiHint: string
}

const STEPS: StepDef[] = [
  {
    key: 'strongStart',
    label: 'Strong Start',
    placeholder: 'How does the session begin? A bang, a hook, a revelation…',
    aiType: 'prep-suggestion',
    aiHint: 'Suggest a strong opening for the upcoming session — a bang, hook, or revelation that gets the players engaged immediately.',
  },
  {
    key: 'scenes',
    label: 'Scenes',
    placeholder: 'Potential scenes the players might move through…',
    aiType: 'prep-suggestion',
    aiHint: 'Suggest 3-5 potential scenes the players might move through this session, in the Lazy DM style.',
  },
  {
    key: 'secretsAndClues',
    label: 'Secrets & Clues',
    placeholder: 'Ten secrets or clues the players might uncover…',
    aiType: 'prep-suggestion',
    aiHint: 'Suggest 8-10 secrets and clues the players might uncover this session. Mix character-specific reveals with broader plot hints.',
  },
  {
    key: 'fantasticLocations',
    label: 'Fantastic Locations',
    placeholder: 'Evocative locations for the session…',
    aiType: 'location',
    aiHint: 'Suggest 2-3 evocative locations for the upcoming session.',
  },
  {
    key: 'npcs',
    label: 'NPCs',
    placeholder: 'Notable NPCs who might appear…',
    aiType: 'npc',
    aiHint: 'Suggest 1-2 new NPCs who might appear this session, distinct from the existing roster.',
  },
  {
    key: 'monsters',
    label: 'Monsters',
    placeholder: 'Monsters and their motivations…',
    aiType: 'encounter',
    aiHint: 'Suggest monsters appropriate for the party level and the session prep, with brief notes on their motivations.',
  },
  {
    key: 'magicItems',
    label: 'Magic Items',
    placeholder: 'Relevant magic items or rewards…',
    aiType: 'item',
    aiHint: 'Suggest 1-2 magic items or rewards relevant to the campaign and the upcoming session.',
  },
  {
    key: 'characterReview',
    label: 'Character Review',
    placeholder: 'Party members, their goals, backstory hooks…',
    aiType: 'prep-suggestion',
    aiHint: 'Summarize each party member with their key goals, backstory hooks, and threads that should be honored this session.',
  },
]

interface Props {
  session: Session
  campaignId: string
}

export default function SessionPrepForm({ session, campaignId }: Props) {
  const [notes, setNotes] = useState<PrepNotes>(session.prepNotes)
  const [activeKey, setActiveKey] = useState<keyof PrepNotes | null>(null)
  const [loadingKey, setLoadingKey] = useState<keyof PrepNotes | null>(null)
  const [aiError, setAiError] = useState<{ key: keyof PrepNotes; message: string } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const campaign = useLiveQuery(() => db.campaigns.get(campaignId), [campaignId])

  const characters = useLiveQuery(
    () => db.characters.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const campaignNpcs = useLiveQuery(
    () => db.npcs.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const allSessions = useLiveQuery(
    () => db.sessions.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const prevSession = (allSessions ?? [])
    .filter(s => s.status === 'complete' && s.date < session.date)
    .sort((a, b) => b.date - a.date)[0] ?? null

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

  async function handleAiAssist(step: StepDef) {
    if (!campaign || !characters || !campaignNpcs || !allSessions) return
    setLoadingKey(step.key)
    setAiError(null)
    try {
      const context = assembleContext({
        campaign,
        characters,
        npcs: campaignNpcs,
        sessions: allSessions,
        currentSessionId: session.id,
      })
      const result = await generate({
        type: step.aiType,
        context,
        userPrompt: step.aiHint,
      })
      handleChange(step.key, result.trim())
    } catch (err) {
      const message = err instanceof MissingApiKeyError
        ? 'Set your Claude API key in Settings to use AI assist.'
        : err instanceof Error
          ? err.message
          : 'AI generation failed.'
      setAiError({ key: step.key, message })
    } finally {
      setLoadingKey(null)
    }
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
        {STEPS.map((step, i) => (
          <PrepCard
            key={step.key}
            stepNum={i + 1}
            label={step.label}
            placeholder={step.placeholder}
            value={notes[step.key]}
            isActive={activeKey === step.key}
            onActivate={() => setActiveKey(step.key)}
            onBlur={() => setActiveKey(null)}
            onChange={val => handleChange(step.key, val)}
            isLoading={loadingKey === step.key}
            isOtherLoading={loadingKey !== null && loadingKey !== step.key}
            errorMessage={aiError?.key === step.key ? aiError.message : null}
            onAiAssist={() => handleAiAssist(step)}
            npcPicker={step.key === 'npcs' && campaignNpcs && campaignNpcs.length > 0
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
  isLoading: boolean
  isOtherLoading: boolean
  errorMessage: string | null
  onAiAssist: () => void
  npcPicker: React.ReactNode
}

function PrepCard({
  stepNum,
  label,
  placeholder,
  value,
  isActive,
  onActivate,
  onBlur,
  onChange,
  isLoading,
  isOtherLoading,
  errorMessage,
  onAiAssist,
  npcPicker,
}: PrepCardProps) {
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
            disabled={isLoading}
            style={{ marginBottom: 8 }}
          />
          {npcPicker && <div style={{ marginBottom: 8 }}>{npcPicker}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={onAiAssist}
              disabled={isLoading || isOtherLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                background: isLoading ? 'var(--gray-100)' : '#fff',
                color: 'var(--blue-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius)',
                cursor: isLoading || isOtherLoading ? 'wait' : 'pointer',
                opacity: isOtherLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Spinner /> Generating…
                </>
              ) : (
                <>✨ AI suggest</>
              )}
            </button>
            {errorMessage && (
              <span className="meta" style={{ color: 'var(--red-600, #b91c1c)', fontSize: 12 }}>
                {errorMessage}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        border: '2px solid var(--gray-300)',
        borderTopColor: 'var(--blue-600)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
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
