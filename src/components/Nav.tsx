import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 56,
      borderBottom: '1px solid #e5e7eb',
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: 'none', color: 'inherit' }}>
        DM Assistant
      </Link>
      <Link to="/settings" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>
        Settings
      </Link>
    </nav>
  )
}
