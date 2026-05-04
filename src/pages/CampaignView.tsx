import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Character } from '../db'
import NpcRoster from '../components/NpcRoster'

function newId() {
  return crypto.randomUUID()
}

function emptyCharForm() {
  return { name: '', class: '', level: 1, backstoryHooks: '' }
}

export default function CampaignView() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()

  const campaign = useLiveQuery(() => db.campaigns.get(campaignId!), [campaignId])
  const characters = useLiveQuery(
    () => db.characters.where('campaignId').equals(campaignId!).toArray(),
    [campaignId]
  )

  const [showCharForm, setShowCharForm] = useState(false)
  const [charForm, setCharForm] = useState(emptyCharForm)
  const [editingChar, setEditingChar] = useState<Character | null>(null)

  if (campaign === undefined) return null
  if (campaign === null) return <p style={{ padding: 24 }}>Campaign not found.</p>

  async function handleCreateChar(e: React.FormEvent) {
    e.preventDefault()
    const char: Character = {
      id: newId(),
      campaignId: campaignId!,
      name: charForm.name.trim(),
      class: charForm.class.trim(),
      level: charForm.level,
      backstoryHooks: charForm.backstoryHooks.trim(),
    }
    await db.characters.add(char)
    setCharForm(emptyCharForm)
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
    <main style={{ maxWidth: 960, margin: '48px auto', padding: '0 24px' }}>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, padding: 0, marginBottom: 16 }}
      >
        ← All Campaigns
      </button>

      <h1 style={{ margin: '0 0 4px' }}>{campaign.name}</h1>
      {campaign.description && (
        <p style={{ margin: '0 0 40px', color: '#6b7280' }}>{campaign.description}</p>
      )}

      {/* Characters */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Party</h2>
          <button onClick={() => { setShowCharForm(v => !v); setEditingChar(null) }}>
            {showCharForm ? 'Cancel' : '+ Add Character'}
          </button>
        </div>

        {showCharForm && (
          <form onSubmit={handleCreateChar} style={formStyle}>
            <h3 style={{ margin: '0 0 16px' }}>New Character</h3>
            <CharacterFields
              values={charForm}
              onChange={patch => setCharForm(f => ({ ...f, ...patch }))}
            />
            <button type="submit">Add Character</button>
          </form>
        )}

        {characters?.length === 0 && !showCharForm && (
          <p style={{ color: '#888' }}>No characters yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {characters?.map(char => (
            <div key={char.id} style={cardStyle}>
              {editingChar?.id === char.id ? (
                <form onSubmit={handleUpdateChar}>
                  <CharacterFields
                    values={editingChar}
                    onChange={patch => setEditingChar(c => c ? { ...c, ...patch } : c)}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingChar(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <strong style={{ fontSize: 16 }}>{char.name}</strong>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>{char.class} — Level {char.level}</span>
                  </div>
                  {char.backstoryHooks && (
                    <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>{char.backstoryHooks}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => { setEditingChar(char); setShowCharForm(false) }}
                      style={ghostButtonStyle}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteChar(char.id)}
                      style={ghostButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <NpcRoster campaignId={campaignId!} />

      {/* Sessions placeholder */}
      <section>
        <h2 style={{ margin: '0 0 16px' }}>Sessions</h2>
        <p style={{ color: '#888' }}>Sessions coming soon.</p>
      </section>
    </main>
  )
}

interface CharFieldValues {
  name: string
  class: string
  level: number
  backstoryHooks: string
}

function CharacterFields({
  values,
  onChange,
}: {
  values: CharFieldValues
  onChange: (patch: Partial<CharFieldValues>) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={values.name}
          onChange={e => onChange({ name: e.target.value })}
          required
          autoFocus
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Class</label>
        <input
          value={values.class}
          onChange={e => onChange({ class: e.target.value })}
          required
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Level</label>
        <select
          value={values.level}
          onChange={e => onChange({ level: Number(e.target.value) })}
          style={inputStyle}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Backstory Hooks</label>
        <input
          value={values.backstoryHooks}
          onChange={e => onChange({ backstoryHooks: e.target.value })}
          placeholder="Seeking revenge, lost heir..."
          style={inputStyle}
        />
      </div>
    </div>
  )
}

const formStyle: React.CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  background: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  marginBottom: 4,
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: 14,
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 4,
}

const ghostButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 13,
  color: '#6b7280',
}
