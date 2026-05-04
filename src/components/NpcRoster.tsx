import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Npc } from '../db'

function newId() {
  return crypto.randomUUID()
}

function emptyForm() {
  return { name: '', role: '', description: '' }
}

export default function NpcRoster({ campaignId }: { campaignId: string }) {
  const npcs = useLiveQuery(
    () => db.npcs.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const npc: Npc = {
      id: newId(),
      campaignId,
      name: form.name.trim(),
      role: form.role.trim(),
      description: form.description.trim(),
      origin: 'prepped',
    }
    await db.npcs.add(npc)
    setForm(emptyForm)
    setShowForm(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingNpc) return
    await db.npcs.update(editingNpc.id, {
      name: editingNpc.name.trim(),
      role: editingNpc.role.trim(),
      description: editingNpc.description.trim(),
    })
    setEditingNpc(null)
  }

  async function handleDelete(id: string) {
    await db.npcs.delete(id)
  }

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>NPCs</h2>
        <button onClick={() => { setShowForm(v => !v); setEditingNpc(null) }}>
          {showForm ? 'Cancel' : '+ Add NPC'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <h3 style={{ margin: '0 0 16px' }}>New NPC</h3>
          <NpcFields values={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} />
          <button type="submit">Add NPC</button>
        </form>
      )}

      {npcs?.length === 0 && !showForm && (
        <p style={{ color: '#888' }}>No NPCs yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {npcs?.map(npc => (
          <div key={npc.id} style={cardStyle}>
            {editingNpc?.id === npc.id ? (
              <form onSubmit={handleUpdate}>
                <NpcFields
                  values={editingNpc}
                  onChange={patch => setEditingNpc(n => n ? { ...n, ...patch } : n)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingNpc(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <strong style={{ fontSize: 16 }}>{npc.name}</strong>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>{npc.role}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: npc.origin === 'improvised' ? '#fef3c7' : '#eff6ff',
                    color: npc.origin === 'improvised' ? '#92400e' : '#1e40af',
                  }}>
                    {npc.origin}
                  </span>
                </div>
                {npc.description && (
                  <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>{npc.description}</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => { setEditingNpc(npc); setShowForm(false) }}
                    style={ghostButtonStyle}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(npc.id)} style={ghostButtonStyle}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

interface NpcFieldValues {
  name: string
  role: string
  description: string
}

function NpcFields({
  values,
  onChange,
}: {
  values: NpcFieldValues
  onChange: (patch: Partial<NpcFieldValues>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          <label style={labelStyle}>Role</label>
          <input
            value={values.role}
            onChange={e => onChange({ role: e.target.value })}
            placeholder="Innkeeper, villain, merchant..."
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={values.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Appearance, personality, motivation..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
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
