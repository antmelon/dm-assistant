import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 52,
      borderBottom: '1px solid var(--gray-200)',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-900)' }}>
        DM Assistant
      </Link>
      <Link to="/settings" style={{ fontSize: 13, color: 'var(--gray-500)' }}>
        Settings
      </Link>
    </nav>
  )
}
