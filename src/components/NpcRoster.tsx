import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Npc } from '../db'

function newId() { return crypto.randomUUID() }

export default function NpcRoster({ campaignId }: { campaignId: string }) {
  const npcs = useLiveQuery(
    () => db.npcs.where('campaignId').equals(campaignId).toArray(),
    [campaignId]
  )

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await db.npcs.add({
      id: newId(),
      campaignId,
      name: form.name.trim(),
      role: form.role.trim(),
      description: form.description.trim(),
      origin: 'prepped',
    })
    setForm(emptyForm())
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

  return (
    <section>
      <div className="section-header">
        <h2 style={{ fontSize: 16 }}>NPCs</h2>
        <button onClick={() => { setShowForm(v => !v); setEditingNpc(null) }}>
          {showForm ? 'Cancel' : '+ Add NPC'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="form-panel">
          <NpcFields values={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} />
          <button type="submit" className="primary">Add NPC</button>
        </form>
      )}

      {npcs?.length === 0 && !showForm && (
        <div className="empty-state">No NPCs yet.</div>
      )}

      <div className="scroll-list">
        {npcs?.map(npc => (
          <div key={npc.id} className="card">
            {editingNpc?.id === npc.id ? (
              <form onSubmit={handleUpdate}>
                <NpcFields
                  values={editingNpc}
                  onChange={patch => setEditingNpc(n => n ? { ...n, ...patch } : n)}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="submit" className="primary">Save</button>
                  <button type="button" onClick={() => setEditingNpc(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <strong>{npc.name}</strong>
                  {npc.role && <span className="meta">{npc.role}</span>}
                  <span style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 99,
                    background: npc.origin === 'improvised' ? '#fef3c7' : 'var(--blue-50)',
                    color: npc.origin === 'improvised' ? '#92400e' : 'var(--blue-800)',
                    fontWeight: 600,
                  }}>
                    {npc.origin}
                  </span>
                </div>
                {npc.description && (
                  <p className="meta" style={{ margin: '4px 0 0' }}>{npc.description}</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="ghost" onClick={() => { setEditingNpc(npc); setShowForm(false) }}>Edit</button>
                  <button className="ghost" onClick={() => db.npcs.delete(npc.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

interface NpcFieldValues { name: string; role: string; description: string }

function emptyForm(): NpcFieldValues { return { name: '', role: '', description: '' } }

function NpcFields({
  values,
  onChange,
}: {
  values: NpcFieldValues
  onChange: (patch: Partial<NpcFieldValues>) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="grid-2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">Name</label>
          <input value={values.name} onChange={e => onChange({ name: e.target.value })} required autoFocus />
        </div>
        <div>
          <label className="label">Role</label>
          <input value={values.role} onChange={e => onChange({ role: e.target.value })} placeholder="Innkeeper, villain…" />
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          value={values.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Appearance, personality, motivation…"
          rows={3}
        />
      </div>
    </div>
  )
}
