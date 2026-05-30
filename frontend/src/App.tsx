import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import InternshipsPage from './pages/InternshipsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import CompaniesPage from './pages/CompaniesPage'
import StudentProfilePage from './pages/StudentProfilePage'
import StudentsPage from './pages/StudentsPage'
import SkillsAdminPage from './pages/SkillsAdminPage'

function EntryRedirect() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="app-loader">
        <span>Restoring session</span>
      </div>
    )
  }

  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/auth'} replace />
}

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<EntryRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/admin/skills" element={<SkillsAdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </div>
  )
}

export default App
