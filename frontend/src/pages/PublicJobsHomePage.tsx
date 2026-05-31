import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublicJobs } from '../api/jobs'
import { useAuth } from '../context/AuthContext'
import type { JobCard } from '../types/api'

function formatDeadline(value?: string | null) {
  if (!value) return 'Rolling applications'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

function formatStipend(job: JobCard) {
  if (job.stipend_min || job.stipend_max) {
    return `NPR ${job.stipend_min ?? ''}${job.stipend_min && job.stipend_max ? ` - ${job.stipend_max}` : ''} / month`
  }
  return 'Stipend negotiable'
}

export default function PublicJobsHomePage() {
  const { status } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'company'>('newest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPublicJobs() {
      setLoading(true)
      setError(null)
      try {
        const result = await getPublicJobs()
        setJobs(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load public jobs right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadPublicJobs()
  }, [])

  useEffect(() => {
    const jobParam = searchParams.get('job')
    if (!jobParam || !jobs.length || selectedJob) return

    const targetId = Number(jobParam)
    if (!Number.isFinite(targetId)) return

    const found = jobs.find((job) => job.id === targetId)
    if (found) {
      setSelectedJob(found)
    }
  }, [jobs, searchParams, selectedJob])

  const locationOptions = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => job.location || 'Remote')))
    return values.sort((a, b) => a.localeCompare(b))
  }, [jobs])

  const topSkills = useMemo(() => {
    const bag = new Map<string, number>()
    jobs.forEach((job) => {
      job.skill_names.forEach((skill) => {
        bag.set(skill, (bag.get(skill) ?? 0) + 1)
      })
    })
    return Array.from(bag.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
  }, [jobs])

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      const q = query.trim().toLowerCase()
      const queryMatch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company_name.toLowerCase().includes(q) ||
        job.skill_names.some((skill) => skill.toLowerCase().includes(q))
      const typeMatch = typeFilter === 'all' || job.type === typeFilter
      const location = job.location || 'Remote'
      const locationMatch = locationFilter === 'all' || location === locationFilter
      return queryMatch && typeMatch && locationMatch
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'company') return a.company_name.localeCompare(b.company_name)
      if (sortBy === 'deadline') {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
        return aTime - bTime
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [jobs, locationFilter, query, sortBy, typeFilter])

  function openJob(job: JobCard) {
    setSelectedJob(job)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('job', String(job.id))
    setSearchParams(nextParams, { replace: true })
  }

  function closeJobModal() {
    setSelectedJob(null)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('job')
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#f5f8ef_45%,#f4f6fb_100%)] text-[#182024]">
      <header className="sticky top-0 z-40 border-b border-[#d5ddd8] bg-[#f7f3eb]/95 backdrop-blur">
        <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#182024] text-sm font-bold text-white">IP</span>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2d3a3e]">Internship Portal</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#4a5a5f] md:flex">
            <a href="#jobs" className="transition hover:text-[#182024]">Jobs</a>
            <a href="#skills" className="transition hover:text-[#182024]">Top Skills</a>
            <a href="#how" className="transition hover:text-[#182024]">How It Works</a>
          </div>
          {status === 'authenticated' ? (
            <Link to="/dashboard" className="rounded-full bg-[#182024] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#243238]">
              Dashboard
            </Link>
          ) : (
            <Link to="/auth" className="rounded-full bg-[#182024] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#243238]">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <section id="top" className="w-full px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <section id="jobs" className="order-1 lg:order-2 lg:mt-9">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-[#182024]">Discover Open Opportunities</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5a6b6f]">{filteredJobs.length} results</span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((current) => !current)}
                  className="rounded-full border border-[#cfd8d2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4d6260] md:hidden"
                >
                  {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
            </div>

            {error && <div className="mb-5 rounded-2xl border border-[#f3b0ab] bg-[#ffeceb] p-4 text-sm text-[#8c2a25]">{error}</div>}

            {loading ? (
              <div className="rounded-3xl border border-[#d9dfdc] bg-white p-8 text-center text-sm text-[#5e6e72]">Loading jobs...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="rounded-3xl border border-[#d9dfdc] bg-white p-8 text-center text-sm text-[#5e6e72]">No roles match your filters.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => openJob(job)}
                    className="rounded-3xl border border-[#d9dfdc] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#5a6b6f]">{job.company_name}</p>
                        <h3 className="mt-1 font-serif text-xl text-[#182024]">{job.title}</h3>
                      </div>
                      <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-[#405957]">
                        {job.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#5a6b6f]">{job.location || 'Remote'} · Apply by {formatDeadline(job.deadline)}</p>
                    <p className="mt-1 text-sm text-[#5a6b6f]">{formatStipend(job)} · {job.duration_months ? `${job.duration_months} months` : 'Duration flexible'}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skill_names.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full border border-[#d2dcd8] bg-[#f7fbf8] px-3 py-1 text-xs text-[#465f5c]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="order-2 mt-9 lg:order-1 lg:mt-0">
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} rounded-[2rem] border border-[#d7ddd7] bg-white p-6 shadow-sm sm:p-7 lg:block`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#6e817a]">Smart Filters</p>
                  <p className="mt-2 text-sm text-[#5a6b6f]">Refine jobs instantly by role type, location, and priority.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setTypeFilter('all')
                      setLocationFilter('all')
                      setSortBy('newest')
                    }}
                    className="rounded-full border border-[#d0dad5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4e6260] transition hover:border-[#182024] hover:text-[#182024]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-full border border-[#d0dad5] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4e6260] transition hover:border-[#182024] hover:text-[#182024] lg:hidden"
                  >
                    Close
                  </button>
                </div>
              </div>

              <label className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Search</label>
              <input
                className="mt-2 w-full rounded-2xl border border-[#d6dfda] bg-[#f8faf8] px-4 py-3 text-sm outline-none transition focus:border-[#182024]"
                placeholder="Type title, company, or skill"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d6dfda] bg-[#f8faf8] px-3 py-2.5 text-sm text-[#2a3a3e] outline-none transition focus:border-[#182024]"
                  >
                    <option value="all">All Types</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on_site">On Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(event) => setLocationFilter(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d6dfda] bg-[#f8faf8] px-3 py-2.5 text-sm text-[#2a3a3e] outline-none transition focus:border-[#182024]"
                  >
                    <option value="all">All Locations</option>
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Sort Results</label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { key: 'newest', label: 'Newest' },
                    { key: 'deadline', label: 'Deadline' },
                    { key: 'company', label: 'Company A-Z' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSortBy(option.key as 'newest' | 'deadline' | 'company')}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        sortBy === option.key
                          ? 'border-[#182024] bg-[#182024] text-white'
                          : 'border-[#d6dfda] bg-[#f8faf8] text-[#2a3a3e] hover:border-[#182024]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-xs text-[#6a7c7a]">
                Showing {filteredJobs.length} matching jobs.
              </p>
            </div>
          </div>
        </div>

        <section id="skills" className="mt-10 rounded-3xl border border-[#d7ddd7] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-[#182024]">Trending Skills In Open Jobs</h3>
            <span className="text-sm text-[#5a6b6f]">Updated from current listings</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-[#edf4ef] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.11em] text-[#3f5653]">
                {skill}
              </span>
            ))}
            {topSkills.length === 0 && <span className="text-sm text-[#5a6b6f]">No skill data available yet.</span>}
          </div>
        </section>

        <section id="how" className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Browse Publicly', desc: 'Inspect live postings, compare locations, and understand market demand instantly.' },
            { title: 'Create Your Account', desc: 'Sign in as student or company to unlock private workflows and profile tools.' },
            { title: 'Apply With Precision', desc: 'Open any role and move into direct apply in one click once authenticated.' },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-[#d7ddd7] bg-white p-6 shadow-sm">
              <p className="font-serif text-xl text-[#182024]">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6b6f]">{item.desc}</p>
            </div>
          ))}
        </section>
      </section>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/45" onClick={closeJobModal} />
          <div className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d4ddd8] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#5a6b6f]">{selectedJob.company_name}</p>
                <h3 className="mt-1 font-serif text-2xl text-[#182024]">{selectedJob.title}</h3>
                <p className="mt-2 text-sm text-[#5a6b6f]">{selectedJob.location || 'Remote'} · {selectedJob.type.replace('_', ' ')} · {formatDeadline(selectedJob.deadline)}</p>
              </div>
              <button
                type="button"
                onClick={closeJobModal}
                className="rounded-full border border-[#d2dcd8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#4d6260]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#465a5f]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Description</p>
                <p className="mt-1">{selectedJob.description || 'Detailed job description will be available after sign in.'}</p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Requirements</p>
                  <p className="mt-1">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.responsibilities && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e817a]">Responsibilities</p>
                  <p className="mt-1">{selectedJob.responsibilities}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedJob.skill_names.map((skill) => (
                  <span key={skill} className="rounded-full border border-[#d2dcd8] bg-[#f7fbf8] px-3 py-1 text-xs text-[#465f5c]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3ebe6] pt-4">
              <p className="text-sm text-[#5a6b6f]">{formatStipend(selectedJob)} · {selectedJob.duration_months ? `${selectedJob.duration_months} months` : 'Duration flexible'}</p>
              {status === 'authenticated' ? (
                <Link
                  to={`/internships?job=${selectedJob.id}`}
                  className="rounded-full bg-[#182024] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#243238]"
                >
                  Apply Now
                </Link>
              ) : (
                <Link
                  to={`/auth?next=${encodeURIComponent(`/jobs?job=${selectedJob.id}`)}`}
                  className="rounded-full bg-[#182024] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#243238]"
                >
                  Login To Apply
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
