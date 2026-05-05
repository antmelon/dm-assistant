import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SessionStatus } from '../db'
import SessionPrepForm from '../components/SessionPrepForm'

const NEXT_STATUS: Partial<Record<SessionStatus, SessionStatus>> = {
  prep: 'play',
  play: 'complete',
}

const NEXT_LABEL: Partial<Record<SessionStatus, string>> = {
  prep: 'Start Session →',
  play: 'End Session →',
}

export default function SessionView() {
  const { campaignId, sessionId } = useParams<{ campaignId: string; sessionId: string }>()
  const navigate = useNavigate()

  const session = useLiveQuery(() => db.sessions.get(sessionId!), [sessionId])
  const campaign = useLiveQuery(() => db.campaigns.get(campaignId!), [campaignId])

  if (session === undefined || campaign === undefined) return null
  if (session === null) return <p className="page">Session not found.</p>

  async function handleAdvanceStatus() {
    const next = NEXT_STATUS[session!.status]
    if (!next) return
    await db.sessions.update(session!.id, { status: next })
  }

  const nextLabel = NEXT_LABEL[session.status]

  return (
    <main className="page">
      <button className="ghost-back" onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>
        ← {campaign.name}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22 }}>{session.name}</h1>
        <span className={`badge badge-${session.status}`}>
          {session.status === 'prep' ? 'Prep' : session.status === 'play' ? 'In Play' : 'Complete'}
        </span>
        {nextLabel && (
          <button className="primary" onClick={handleAdvanceStatus} style={{ marginLeft: 'auto' }}>
            {nextLabel}
          </button>
        )}
      </div>

      {session.status === 'prep' && (
        <SessionPrepForm session={session} campaignId={campaignId!} />
      )}
      {session.status === 'play' && (
        <p className="meta">Play view with Quick Generate sidebar coming soon (issues #10–13).</p>
      )}
      {session.status === 'complete' && (
        <p className="meta">Session complete. Summary and cleanup coming soon (issues #14–15).</p>
      )}
    </main>
  )
}
