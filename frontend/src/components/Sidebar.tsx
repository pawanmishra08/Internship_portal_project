import { NavLink } from 'react-router-dom'

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 14px',
  color: 'var(--text)',
  textDecoration: 'none',
  borderRadius: 8,
}

export default function Sidebar() {
  return (
    <aside style={{ width: 220, borderRight: '1px solid var(--line)', padding: 20 }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <NavLink to="/dashboard" style={({ isActive }) => ({ ...linkStyle, background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent' })}>
          Dashboard
        </NavLink>
        <NavLink to="/internships" style={({ isActive }) => ({ ...linkStyle, background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent' })}>
          Internships
        </NavLink>
        <NavLink to="/applications" style={({ isActive }) => ({ ...linkStyle, background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent' })}>
          Applications
        </NavLink>
        <NavLink to="/companies" style={({ isActive }) => ({ ...linkStyle, background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent' })}>
          Companies
        </NavLink>
      </nav>
    </aside>
  )
}
