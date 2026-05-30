import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStudents } from '../api/students'
import type { StudentListItem } from '../types/api'

export default function StudentsPage() {
  const { status, user } = useAuth()
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'admin') {
      return
    }

    async function loadStudents() {
      setError(null)
      setLoading(true)
      try {
        const results = await getStudents()
        setStudents(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load student list')
      } finally {
        setLoading(false)
      }
    }

    void loadStudents()
  }, [status, user])

  if (status === 'loading') {
    return (
      <div className="page-shell flex items-center justify-center">
        <p style={{ color: '#888780' }}>Restoring your session…</p>
      </div>
    )
  }

  if (status === 'authenticated' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (status === 'anonymous') {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="page-kicker">Students</p>
          <div className="max-w-2xl">
            <h1 className="page-title">Student directory</h1>
            <p className="page-subtitle">View student profiles and availability at a glance.</p>
          </div>
          <div className="rounded-3xl border border-[#d4d4ce] bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#aaa9a2' }}>Overview</p>
            <p className="mt-2 text-lg" style={{ color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>{students.length} students</p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-3xl border border-[#f09595] bg-[#fcebeb] p-4 text-[#a32d2d]">{error}</div>}

        {loading ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>Loading students…</div>
        ) : students.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>No student profiles are available.</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#d4d4ce] bg-white shadow-sm">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="text-left text-xs uppercase tracking-[0.2em]" style={{ background: '#f0efe9', color: '#888780' }}>
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">University</th>
                  <th className="px-6 py-4">Degree</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4">Skills</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-[#fafaf8]" style={{ borderColor: '#e8e8e4' }}>
                    <td className="px-6 py-4" style={{ color: '#1a1a18' }}>{student.full_name}</td>
                    <td className="px-6 py-4" style={{ color: '#888780' }}>{student.university || 'N/A'}</td>
                    <td className="px-6 py-4" style={{ color: '#888780' }}>{student.degree || 'N/A'}</td>
                    <td className="px-6 py-4" style={{ color: '#888780' }}>{student.is_available ? 'Available' : 'Unavailable'}</td>
                    <td className="px-6 py-4" style={{ color: '#888780' }}>{student.skill_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
