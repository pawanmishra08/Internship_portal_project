import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getJobs } from '../api/jobs'
import type { JobCard } from '../types/api'

export default function InternshipsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadJobs() {
      setError(null)
      setLoading(true)

      try {
        const params = user?.role === 'student' ? { status: 'active' } : undefined
        const results = await getJobs(params)
        setJobs(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load internships')
      } finally {
        setLoading(false)
      }
    }

    void loadJobs()
  }, [user?.role])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Internships</p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-2">Browse opportunities</h1>
            <p className="text-slate-600 mt-2">{user?.role === 'student' ? 'Explore active internships from verified employers.' : 'Review your job listings and keep them updated.'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">View</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{jobs.length} roles</p>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading internships…</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No internships available yet.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {jobs.map((job) => (
              <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{job.company_name}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{job.title}</h2>
                    <p className="mt-3 text-sm text-slate-600">{job.location || 'Remote'} · {job.type.replace('_', ' ')}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{job.status}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {job.skill_names.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{skill}</span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>{job.deadline ? `Deadline ${job.deadline}` : 'No deadline'}</span>
                  <span>{job.duration_months ? `${job.duration_months} mo` : 'Duration TBD'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
