import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type SessionStatus } from '../db'

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
  if (session === null) return <p style={{ padding: 24 }}>Session not found.</p>

  async function handleAdvanceStatus() {
    const next = NEXT_STATUS[session!.status]
    if (!next) return
    await db.sessions.update(session!.id, { status: next })
  }

  const nextLabel = NEXT_LABEL[session.status]

  return (
    <main style={{ maxWidth: 960, margin: '48px auto', padding: '0 24px' }}>
      <button
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, padding: 0, marginBottom: 16 }}
      >
        ← {campaign?.name ?? 'Campaign'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>{session.name}</h1>
        <StatusBadge status={session.status} />
        {nextLabel && (
          <button onClick={handleAdvanceStatus} style={{ marginLeft: 'auto' }}>
            {nextLabel}
          </button>
        )}
      </div>

      {session.status === 'prep' && (
        <p style={{ color: '#6b7280' }}>Session prep form coming soon (issue #6).</p>
      )}
      {session.status === 'play' && (
        <p style={{ color: '#6b7280' }}>Play view with Quick Generate sidebar coming soon (issues #10–13).</p>
      )}
      {session.status === 'complete' && (
        <p style={{ color: '#6b7280' }}>Session complete. Summary and cleanup coming soon (issues #14–15).</p>
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const styles: Record<SessionStatus, React.CSSProperties> = {
    prep: { background: '#eff6ff', color: '#1e40af' },
    play: { background: '#f0fdf4', color: '#166534' },
    complete: { background: '#f3f4f6', color: '#6b7280' },
  }
  const labels: Record<SessionStatus, string> = {
    prep: 'Prep',
    play: 'In Play',
    complete: 'Complete',
  }
  return (
    <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, ...styles[status] }}>
      {labels[status]}
    </span>
  )
}
