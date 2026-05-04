import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Campaign } from '../db'

function newId() {
  return crypto.randomUUID()
}

function emptyForm() {
  return { name: '', description: '' }
}

export default function Dashboard() {
  const campaigns = useLiveQuery(() => db.campaigns.orderBy('createdAt').reverse().toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
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
    setForm(emptyForm)
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    await db.campaigns.delete(id)
    setDeleteConfirm(null)
  }

  return (
    <main style={{ maxWidth: 960, margin: '48px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>Campaigns</h1>
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}>
          <h2 style={{ margin: '0 0 16px' }}>New Campaign</h2>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="The Lost Mines of Phandelver"
            required
            autoFocus
            style={{ width: '100%', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }}
          />
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="A short description of the campaign..."
            rows={3}
            style={{ width: '100%', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box', marginBottom: 16, resize: 'vertical' }}
          />
          <button type="submit">Create Campaign</button>
        </form>
      )}

      {campaigns === undefined && <p style={{ color: '#888' }}>Loading...</p>}

      {campaigns?.length === 0 && !showForm && (
        <p style={{ color: '#888' }}>No campaigns yet. Create one to get started.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {campaigns?.map(campaign => (
          <div
            key={campaign.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 20,
              background: '#fff',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{campaign.name}</h2>
            {campaign.description && (
              <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 14 }}>{campaign.description}</p>
            )}
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
              Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>

            {deleteConfirm === campaign.id ? (
              <div
                style={{ marginTop: 12, display: 'flex', gap: 8 }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => handleDelete(campaign.id)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}
                >
                  Confirm delete
                </button>
                <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setDeleteConfirm(campaign.id) }}
                style={{
                  marginTop: 12,
                  background: 'none',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#6b7280',
                }}
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
