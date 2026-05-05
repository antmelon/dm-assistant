import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session, type SessionStatus } from '../db'

function newId() {
  return crypto.randomUUID()
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  prep: 'Prep',
  play: 'In Play',
  complete: 'Complete',
}

const STATUS_COLORS: Record<SessionStatus, { bg: string; color: string }> = {
  prep: { bg: '#eff6ff', color: '#1e40af' },
  play: { bg: '#f0fdf4', color: '#166534' },
  complete: { bg: '#f3f4f6', color: '#6b7280' },
}

const EMPTY_PREP_NOTES = {
  strongStart: '',
  scenes: '',
  secretsAndClues: '',
  fantasticLocations: '',
  npcs: '',
  monsters: '',
  magicItems: '',
  characterReview: '',
}

export default function SessionList({ campaignId }: { campaignId: string }) {
  const navigate = useNavigate()
  const sessions = useLiveQuery(
    () => db.sessions.where('campaignId').equals(campaignId).sortBy('date'),
    [campaignId]
  )

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', date: '' })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const session: Session = {
      id: newId(),
      campaignId,
      name: form.name.trim(),
      date: form.date ? new Date(form.date).getTime() : Date.now(),
      status: 'prep',
      prepNotes: EMPTY_PREP_NOTES,
      summary: '',
    }
    await db.sessions.add(session)
    setForm({ name: '', date: '' })
    setShowForm(false)
  }

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Sessions</h2>
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Session'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <h3 style={{ margin: '0 0 16px' }}>New Session</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Session 1 — The Road to Phandalin"
                required
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <button type="submit">Create Session</button>
        </form>
      )}

      {sessions?.length === 0 && !showForm && (
        <p style={{ color: '#888' }}>No sessions yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
        {sessions?.map(session => {
          const colors = STATUS_COLORS[session.status]
          return (
            <div
              key={session.id}
              onClick={() => navigate(`/campaigns/${campaignId}/sessions/${session.id}`)}
              style={{ ...cardStyle, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{session.name}</strong>
                  {session.date && (
                    <span style={{ marginLeft: 12, color: '#6b7280', fontSize: 13 }}>
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 12,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: colors.bg,
                  color: colors.color,
                }}>
                  {STATUS_LABELS[session.status]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
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
