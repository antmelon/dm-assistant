import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session, type SessionStatus } from '../db'

function newId() { return crypto.randomUUID() }

const STATUS_LABELS: Record<SessionStatus, string> = {
  prep: 'Prep',
  play: 'In Play',
  complete: 'Complete',
}

const EMPTY_PREP_NOTES = {
  strongStart: '', scenes: '', secretsAndClues: '', fantasticLocations: '',
  npcs: '', monsters: '', magicItems: '', characterReview: '',
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
      <div className="section-header">
        <h2 style={{ fontSize: 16 }}>Sessions</h2>
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Session'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="form-panel">
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label className="label">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Session 1 — The Road to Phandalin"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="primary">Create Session</button>
        </form>
      )}

      {sessions?.length === 0 && !showForm && (
        <div className="empty-state">No sessions yet.</div>
      )}

      <div className="scroll-list">
        {sessions?.map(session => (
          <div
            key={session.id}
            className="card"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => navigate(`/campaigns/${campaignId}/sessions/${session.id}`)}
          >
            <div>
              <strong style={{ fontSize: 15 }}>{session.name}</strong>
              {session.date && (
                <span className="meta" style={{ marginLeft: 10 }}>
                  {new Date(session.date).toLocaleDateString()}
                </span>
              )}
            </div>
            <span className={`badge badge-${session.status}`}>
              {STATUS_LABELS[session.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
