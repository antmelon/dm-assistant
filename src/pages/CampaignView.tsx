import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Character } from '../db'
import NpcRoster from '../components/NpcRoster'
import SessionList from '../components/SessionList'

function newId() { return crypto.randomUUID() }

type Tab = 'sessions' | 'party' | 'npcs'

export default function CampaignView() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('sessions')

  const campaign = useLiveQuery(() => db.campaigns.get(campaignId!), [campaignId])
  const characters = useLiveQuery(
    () => db.characters.where('campaignId').equals(campaignId!).toArray(),
    [campaignId]
  )

  const [showCharForm, setShowCharForm] = useState(false)
  const [charForm, setCharForm] = useState(emptyCharForm())
  const [editingChar, setEditingChar] = useState<Character | null>(null)

  if (campaign === undefined) return null
  if (campaign === null) return <p className="page">Campaign not found.</p>

  async function handleCreateChar(e: React.FormEvent) {
    e.preventDefault()
    await db.characters.add({
      id: newId(),
      campaignId: campaignId!,
      name: charForm.name.trim(),
      class: charForm.class.trim(),
      level: charForm.level,
      backstoryHooks: charForm.backstoryHooks.trim(),
    })
    setCharForm(emptyCharForm())
    setShowCharForm(false)
  }

  async function handleUpdateChar(e: React.FormEvent) {
    e.preventDefault()
    if (!editingChar) return
    await db.characters.update(editingChar.id, {
      name: editingChar.name.trim(),
      class: editingChar.class.trim(),
      level: editingChar.level,
      backstoryHooks: editingChar.backstoryHooks.trim(),
    })
    setEditingChar(null)
  }

  async function handleDeleteChar(id: string) {
    await db.characters.delete(id)
  }

  return (
    <main className="page">
      <button className="ghost-back" onClick={() => navigate('/')} style={{ marginBottom: 12 }}>
        ← All Campaigns
      </button>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{campaign.name}</h1>
      {campaign.description && (
        <p className="meta" style={{ marginBottom: 24 }}>{campaign.description}</p>
      )}

      {/* Tabs */}
      <div className="tabs">
        {(['sessions', 'party', 'npcs'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'sessions' ? 'Sessions' : tab === 'party' ? `Party${characters?.length ? ` (${characters.length})` : ''}` : 'NPCs'}
          </button>
        ))}
      </div>

      {activeTab === 'sessions' && <SessionList campaignId={campaignId!} />}

      {activeTab === 'npcs' && <NpcRoster campaignId={campaignId!} />}

      {activeTab === 'party' && (
        <section>
          <div className="section-header">
            <h2 style={{ fontSize: 16 }}>Party</h2>
            <button onClick={() => { setShowCharForm(v => !v); setEditingChar(null) }}>
              {showCharForm ? 'Cancel' : '+ Add Character'}
            </button>
          </div>

          {showCharForm && (
            <form onSubmit={handleCreateChar} className="form-panel">
              <CharacterFields
                values={charForm}
                onChange={patch => setCharForm(f => ({ ...f, ...patch }))}
              />
              <button type="submit" className="primary">Add Character</button>
            </form>
          )}

          {characters?.length === 0 && !showCharForm && (
            <div className="empty-state">No characters yet.</div>
          )}

          <div className="scroll-list">
            {characters?.map(char => (
              <div key={char.id} className="card">
                {editingChar?.id === char.id ? (
                  <form onSubmit={handleUpdateChar}>
                    <CharacterFields
                      values={editingChar}
                      onChange={patch => setEditingChar(c => c ? { ...c, ...patch } : c)}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button type="submit" className="primary">Save</button>
                      <button type="button" onClick={() => setEditingChar(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <strong>{char.name}</strong>
                      <span className="meta">{char.class} — Level {char.level}</span>
                    </div>
                    {char.backstoryHooks && (
                      <p className="meta" style={{ margin: '4px 0 0' }}>{char.backstoryHooks}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        className="ghost"
                        onClick={() => { setEditingChar(char); setShowCharForm(false) }}
                      >Edit</button>
                      <button className="ghost" onClick={() => handleDeleteChar(char.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

interface CharFieldValues {
  name: string
  class: string
  level: number
  backstoryHooks: string
}

function emptyCharForm(): CharFieldValues {
  return { name: '', class: '', level: 1, backstoryHooks: '' }
}

function CharacterFields({
  values,
  onChange,
}: {
  values: CharFieldValues
  onChange: (patch: Partial<CharFieldValues>) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="grid-2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">Name</label>
          <input value={values.name} onChange={e => onChange({ name: e.target.value })} required autoFocus />
        </div>
        <div>
          <label className="label">Class</label>
          <input value={values.class} onChange={e => onChange({ class: e.target.value })} required />
        </div>
        <div>
          <label className="label">Level</label>
          <select value={values.level} onChange={e => onChange({ level: Number(e.target.value) })}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Backstory Hooks</label>
          <input
            value={values.backstoryHooks}
            onChange={e => onChange({ backstoryHooks: e.target.value })}
            placeholder="Seeking revenge, lost heir…"
          />
        </div>
      </div>
    </div>
  )
}
