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
    <div className="page-shell">
      <div className="page-container py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Internships</p>
            <h1 className="page-title">Browse opportunities</h1>
            <p className="page-subtitle">{user?.role === 'student' ? 'Explore active internships from verified employers.' : 'Review your job listings and keep them updated.'}</p>
          </div>
          <div className="rounded-3xl border border-[#d4d4ce] bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#aaa9a2' }}>View</p>
            <p className="mt-2 text-lg" style={{ color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>{jobs.length} roles</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search internships by title or company..."
            className="input-field flex-1"
          />
          <div className="rounded-full bg-[#f0efe9] px-4 py-2 text-sm font-medium" style={{ color: '#1a1a18' }}>{jobs.length} roles</div>
        </div>

        {error && <div className="mb-6 rounded-3xl border border-[#f09595] bg-[#fcebeb] p-4 text-[#a32d2d]">{error}</div>}

        {loading ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>Loading internships…</div>
        ) : jobs.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>No internships available yet.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {jobs.filter((job) => {
              if (!searchQuery) return true
              const q = searchQuery.toLowerCase()
              return job.title.toLowerCase().includes(q) || job.company_name.toLowerCase().includes(q)
            }).map((job) => (
              <article key={job.id} className="rounded-3xl border border-[#d4d4ce] bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm" style={{ color: '#888780' }}>{job.company_name}</p>
                    <h2 className="mt-2 text-xl" style={{ color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>{job.title}</h2>
                    <p className="mt-3 text-sm" style={{ color: '#888780' }}>{job.location || 'Remote'} · {job.type.replace('_', ' ')}</p>
                  </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#1a1a18', background: '#f0efe9' }}>{job.status}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {job.skill_names.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#f0efe9', color: '#1a1a18' }}>{skill}</span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm" style={{ color: '#888780' }}>
                  <span>
                    {job.stipend_min || job.stipend_max
                      ? `Rs. ${job.stipend_min ?? ''}${job.stipend_min && job.stipend_max ? `–${job.stipend_max}` : ''}/mo`
                      : 'Stipend: Negotiable'}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#f0efe9', color: '#1a1a18' }}>
                    {job.duration_months ? `${job.duration_months} months` : 'Duration TBD'}
                  </span>
                  <span>
                    {job.deadline ? `Apply by ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(job.deadline))}` : 'No deadline'}
                  </span>
                </div>

                {user?.role === 'student' && (
                  <div className="mt-4">
                    <button onClick={() => { setSelectedJob(job); setCoverLetter('') }}
                      className="mt-4 w-full rounded-full bg-[#1a1a18] px-4 py-2 text-xs uppercase tracking-[0.14em] font-medium text-white transition hover:bg-[#2a2a27]">
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
            <div className="relative w-full max-w-xl rounded-3xl border border-[#d4d4ce] bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold" style={{ color: '#1a1a18' }}>Apply to {selectedJob.title}</h3>
              <p className="mt-1 text-sm" style={{ color: '#888780' }}>{selectedJob.company_name}</p>

              {applyError && <div className="mt-4 rounded-3xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{applyError}</div>}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold" style={{ color: '#1a1a18' }}>Cover letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="input-field h-36"
                  placeholder="Explain why you're a great fit (min 50 characters)"
                />
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setSelectedJob(null)} className="rounded-full border border-[#d4d4ce] bg-white px-4 py-2 text-sm font-semibold" style={{ color: '#1a1a18' }}>Cancel</button>
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
                      await createApplication({ job_id: selectedJob.id, cover_letter: coverLetter })
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
                  className="rounded-full bg-[#1a1a18] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a2a27]"
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
