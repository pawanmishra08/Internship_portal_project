import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublicJobs } from '../api/jobs'
import { useAuth } from '../context/AuthContext'
import type { JobCard } from '../types/api'
import sitelogo from '../assets/sitelogo.png'

function formatDeadline(value?: string | null) {
  if (!value) return 'Rolling applications'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

function formatStipend(job: JobCard) {
  if (job.stipend_min || job.stipend_max) {
    return `NPR ${job.stipend_min ?? ''}${job.stipend_min && job.stipend_max ? ` - ${job.stipend_max}` : ''} / mo`
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
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-indigo-50/40 via-sky-50/20 to-transparent" />

      {/* Modern Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 transition hover:opacity-90">
                <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
              <img src={sitelogo} alt="Internify Logo" className="h-full w-full object-contain" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-sm font-bold uppercase tracking-[0.18em] text-transparent">
              Internship Portal
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#jobs" className="transition hover:text-indigo-600">Explore Jobs</a>
            <a href="#skills" className="transition hover:text-indigo-600">Trending Skills</a>
            <a href="#how" className="transition hover:text-indigo-600">Process</a>
          </div>

          <div>
            {status === 'authenticated' ? (
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow active:scale-[0.98]">
                Dashboard
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-indigo-100 transition-all duration-200 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]">
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <div id="top" className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        
        {/* Modernized Hero/Intro Block */}
        <div className="relative mb-12 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm sm:p-10 overflow-hidden">
          <div className="absolute right-0 top-0 -z-10 h-full w-1/3 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-40 hidden md:block" />
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Live Placement Network
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight bg-text-blue text-slate-900 sm:text-4xl lg:text-5xl font-sans">
              Launch your career with absolute clarity.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Discover verified internal and remote roles across Nepal's fastest-growing ecosystems. Filter intuitively, track your deadlines, and connect directly with industry leads.
            </p>
          </div>
        </div>

        {/* Dynamic Split Screen Structure */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT: Sidebar Filters (Sticky on Desktop) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <p className="text-sm font-medium text-slate-500">Filter Framework</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {mobileFiltersOpen ? 'Hide System Filters' : 'Adjust System Filters'}
              </button>
            </div>

            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm`}>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Smart Controls</h2>
                  <p className="mt-1 text-xs text-slate-400">Refine live results catalog</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setTypeFilter('all')
                    setLocationFilter('all')
                    setSortBy('newest')
                  }}
                  className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Reset
                </button>
              </div>

              {/* Input Filters Form Structure */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Search Keywords</label>
                  <div className="relative mt-1.5">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                      placeholder="Title, partner company, or stack..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Workplace Configuration</label>
                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="all">All Structures</option>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="on_site">On Site</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Geographic Region</label>
                    <select
                      value={locationFilter}
                      onChange={(event) => setLocationFilter(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="all">Everywhere</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Sort Matrix</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                    {[
                      { key: 'newest', label: 'Newest' },
                      { key: 'deadline', label: 'Deadline' },
                      { key: 'company', label: 'A-Z' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSortBy(option.key as 'newest' | 'deadline' | 'company')}
                        className={`rounded-lg py-1.5 text-center text-xs font-medium transition-all ${
                          sortBy === option.key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Active Pipeline Match</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{filteredJobs.length} Positions</span>
              </div>
            </div>
          </aside>

          {/* RIGHT: Jobs Grid Block */}
          <section id="jobs" className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">Available Roles</h3>
              <p className="text-xs text-slate-400 italic">Showing global & matching parameters</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-red-700 backdrop-blur-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="mt-3 text-sm font-medium text-slate-500">Querying directory listings...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <p className="text-sm font-medium text-slate-500">No active postings match your query parameter filters.</p>
                <p className="mt-1 text-xs text-slate-400">Try modifying structural tags or resetting inputs.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => openJob(job)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="max-w-[70%]">
                          <p className="truncate text-xs font-medium text-slate-400">{job.company_name}</p>
                          <h4 className="mt-1 font-semibold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {job.title}
                          </h4>
                        </div>
                        <span className="shrink-0 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {job.type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
                          <span>{job.location || 'Remote'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
                          <span>Apply before: <span className="font-medium text-slate-700">{formatDeadline(job.deadline)}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-indigo-400" />
                          <span className="font-medium text-indigo-600">{formatStipend(job)}</span>
                          {job.duration_months && (
                            <span className="text-slate-400">({job.duration_months} mos)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-50 pt-3">
                      {job.skill_names.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-md bg-indigo-50/60 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                          {skill}
                        </span>
                      ))}
                      {job.skill_names.length > 3 && (
                        <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
                          +{job.skill_names.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Trending Skills Ecosystem */}
        <section id="skills" className="mt-16 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">High-Demand Skill Sets</h3>
              <p className="text-xs text-slate-400">Aggregated automatically based on current active partner demand metrics</p>
            </div>
            <span className="inline-flex self-start sm:self-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Live Updates
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <span key={skill} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                {skill}
              </span>
            ))}
            {topSkills.length === 0 && <span className="text-sm text-slate-400">No telemetry parameters compiled yet.</span>}
          </div>
        </section>

        {/* Methodology Feature Strip */}
        <section id="how" className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: '1. Sandbox Discovery', desc: 'Audit verified jobs framework pipelines directly. Map local stipend curves effortlessly.' },
            { title: '2. Profile Activation', desc: 'Register unified standard profiles to save state vectors and interface variables securely.' },
            { title: '3. Instant Handshake', desc: 'Transition straight into active corporate pipelines without middleware disruption.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{item.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Dynamic Detail Modal Sheet */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Overlay element layer backdrop */}
          <button
            type="button"
            aria-label="Close modal layer"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeJobModal}
          />
          <div className="relative mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Bar */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{selectedJob.company_name}</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedJob.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>{selectedJob.location || 'Remote'}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600">{selectedJob.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Deadline: <span className="text-slate-600">{formatDeadline(selectedJob.deadline)}</span></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeJobModal}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                >
                  <span className="sr-only">Close Sheet</span>
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content Core */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Overview Specification</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {selectedJob.description || 'Detailed parameters will be rendered comprehensively inside authenticated pipeline tools.'}
                </p>
              </div>

              {selectedJob.requirements && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Core Competencies</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.responsibilities && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Execution Mandates</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{selectedJob.responsibilities}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Validated Stacks</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skill_names.map((skill) => (
                    <span key={skill} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Modal Action Tray */}
            <div className="border-t border-slate-100 bg-slate-50/60 p-4 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span className="block text-slate-400 font-medium">Stipend Yield Matrix</span>
                <span className="text-sm font-bold text-slate-900">{formatStipend(selectedJob)}</span>
                {selectedJob.duration_months && ` / For ${selectedJob.duration_months} Months Term`}
              </div>

              <div className="flex justify-end">
                {status === 'authenticated' ? (
                  <Link
                    to={`/internships?job=${selectedJob.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 hover:shadow"
                  >
                    Transmit Application
                  </Link>
                ) : (
                  <Link
                    to={`/auth?next=${encodeURIComponent(`/jobs?job=${selectedJob.id}`)}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-slate-800"
                  >
                    Authenticate To Apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}