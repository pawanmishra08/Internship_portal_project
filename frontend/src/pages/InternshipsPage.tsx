import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getJobs } from '../api/jobs'
import { createApplication } from '../api/applications'
import type { JobCard } from '../types/api'

export default function InternshipsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)

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

        <div className="mb-6 flex items-center gap-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search internships by title or company..."
            className="input-field flex-1"
          />
          <div className="text-sm text-slate-500">{jobs.length} roles</div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading internships…</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No internships available yet.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {jobs.filter((job) => {
              if (!searchQuery) return true
              const q = searchQuery.toLowerCase()
              return job.title.toLowerCase().includes(q) || job.company_name.toLowerCase().includes(q)
            }).map((job) => (
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

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500 items-center">
                  <span className="text-sm text-slate-600">
                    {job.stipend_min || job.stipend_max
                      ? `Rs. ${job.stipend_min ?? ''}${job.stipend_min && job.stipend_max ? `–${job.stipend_max}` : ''}/mo`
                      : 'Stipend: Negotiable'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {job.duration_months ? `${job.duration_months} months` : 'Duration TBD'}
                  </span>
                  <span className="text-sm text-slate-500">
                    {job.deadline ? `Apply by ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(job.deadline))}` : 'No deadline'}
                  </span>
                </div>

                {user?.role === 'student' && (
                  <div className="mt-4">
                    <button onClick={() => { setSelectedJob(job); setCoverLetter('') }} 
                      className="mt-4 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
                      Apply now
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {applySuccess && (
          <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            ✓ {applySuccess}
          </div>
        )}

        {/* Apply Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedJob(null)} />
            <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900">Apply to {selectedJob.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{selectedJob.company_name}</p>

              {applyError && <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">{applyError}</div>}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Cover letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="input-field h-36"
                  placeholder="Explain why you're a great fit (min 50 characters)"
                />
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setSelectedJob(null)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                <button
                  type="button"
                  disabled={applying}
                  onClick={async () => {
                    setApplyError(null)
                    if (coverLetter.trim().length < 50) {
                      setApplyError('Cover letter must be at least 50 characters.')
                      return
                    }
                    setApplying(true)
                    try {
                      await createApplication({ job: selectedJob.id, cover_letter: coverLetter })
                      setSelectedJob(null)
                      setCoverLetter('')
                      setApplySuccess('Application submitted successfully.')
                      setTimeout(() => setApplySuccess(null), 3000)
                    } catch (err) {
                      setApplyError(err instanceof Error ? err.message : 'Unable to submit application')
                    } finally {
                      setApplying(false)
                    }
                  }}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {applying ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
