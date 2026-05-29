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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Restoring your session…</p>
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Students</p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">Student directory</h1>
          <p className="text-slate-600 mt-2">View student profiles and availability at a glance.</p>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No student profiles are available.</div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.2em] text-slate-600">
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
                  <tr key={student.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">{student.full_name}</td>
                    <td className="px-6 py-4 text-slate-600">{student.university || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{student.degree || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{student.is_available ? 'Available' : 'Unavailable'}</td>
                    <td className="px-6 py-4 text-slate-600">{student.skill_count}</td>
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
