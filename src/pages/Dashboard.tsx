import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Campaign } from '../db'

function newId() { return crypto.randomUUID() }

export default function Dashboard() {
  const campaigns = useLiveQuery(() => db.campaigns.orderBy('createdAt').reverse().toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const campaign: Campaign = {
      id: newId(),
      name: form.name.trim(),
      description: form.description.trim(),
      createdAt: Date.now(),
    }
    await db.campaigns.add(campaign)
    setForm({ name: '', description: '' })
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await db.campaigns.delete(id)
    setDeleteConfirm(null)
  }

  return (
    <main className="page">
      <div className="section-header">
        <h1 style={{ fontSize: 22 }}>Campaigns</h1>
        <button className="primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="form-panel" style={{ marginBottom: 28 }}>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label className="label">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="The Lost Mines of Phandelver"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="A short description…"
              />
            </div>
          </div>
          <button type="submit" className="primary">Create Campaign</button>
        </form>
      )}

      {campaigns?.length === 0 && !showForm && (
        <div className="empty-state" style={{ paddingTop: 60 }}>
          <p style={{ margin: '0 0 16px', fontSize: 15 }}>No campaigns yet.</p>
          <button className="primary" onClick={() => setShowForm(true)}>+ New Campaign</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {campaigns?.map(campaign => (
          <div
            key={campaign.id}
            className="card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
          >
            <strong style={{ fontSize: 16 }}>{campaign.name}</strong>
            {campaign.description && (
              <p className="meta" style={{ margin: 0 }}>{campaign.description}</p>
            )}
            <p className="meta" style={{ margin: 0 }}>
              Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>

            {deleteConfirm === campaign.id ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                <button className="danger" onClick={() => handleDelete(campaign.id)}>Confirm delete</button>
                <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <button
                className="ghost"
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
                onClick={e => { e.stopPropagation(); setDeleteConfirm(campaign.id) }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
