import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCompanies, getOwnCompanyProfile } from '../api/companies'
import { createJob, getJob, getJobs, updateJob } from '../api/jobs'
import type { CompanyListItem, CompanyProfile, JobCard, JobDetail, JobFormPayload } from '../types/api'

const initialJobForm: JobFormPayload = {
  title: '',
  description: '',
  requirements: '',
  responsibilities: '',
  location: '',
  type: 'full_time',
  status: 'active',
  stipend_min: null,
  stipend_max: null,
  duration_months: null,
  openings: 1,
  deadline: null,
  skill_ids: [],
}

export default function CompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [jobForm, setJobForm] = useState<JobFormPayload>(initialJobForm)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentJobTitle = useMemo(() => (isEditing ? 'Edit role' : 'Create new role'), [isEditing])

  useEffect(() => {
    async function loadCompanies() {
      setError(null)
      setLoading(true)
      setSuccessMessage(null)

      try {
        if (user?.role === 'company') {
          const [profile, jobsData] = await Promise.all([getOwnCompanyProfile(), getJobs()])
          setCompanyProfile(profile)
          setJobs(jobsData)
        } else {
          const results = await getCompanies(user?.role === 'admin' ? {} : { is_verified: true })
          setCompanies(results)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load companies')
      } finally {
        setLoading(false)
      }
    }

    void loadCompanies()
  }, [user?.role])

  async function handleSelectJob(jobId: number) {
    setError(null)
    setSaving(true)
    try {
      const job = await getJob(jobId)
      setSelectedJobId(jobId)
      setIsEditing(true)
      setJobForm({
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        location: job.location || '',
        type: job.type || 'full_time',
        status: job.status || 'active',
        stipend_min: job.stipend_min ?? null,
        stipend_max: job.stipend_max ?? null,
        duration_months: job.duration_months ?? null,
        openings: job.openings ?? 1,
        deadline: job.deadline || null,
        skill_ids: [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load job')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setSelectedJobId(null)
    setIsEditing(false)
    setJobForm(initialJobForm)
    setSuccessMessage(null)
  }

  function setFormValue<K extends keyof JobFormPayload>(key: K, value: JobFormPayload[K]) {
    setJobForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSaving(true)

    try {
      const payload = { ...jobForm }
      const response: JobDetail = isEditing && selectedJobId
        ? await updateJob(selectedJobId, payload)
        : await createJob(payload)

      const updatedJobs = isEditing
        ? jobs.map((job) => (job.id === response.id ? response : job))
        : [response, ...jobs]

      setJobs(updatedJobs)
      setSuccessMessage(isEditing ? 'Job updated successfully.' : 'Job created successfully.')
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Companies</p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-2">Employer dashboard</h1>
            <p className="text-slate-600 mt-2">{user?.role === 'company' ? 'Manage your company page and open roles.' : 'Browse verified employers and review company details.'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mode</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user?.role === 'company' ? 'Company tools' : `${companies.length} companies`}</p>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">{error}</div>}
        {successMessage && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 mb-6">{successMessage}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading companies…</div>
        ) : user?.role === 'company' ? (
          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">{companyProfile?.company_name || 'Company profile'}</h2>
                <p className="mt-3 text-slate-600">{companyProfile?.tagline || 'Keep your company profile updated so students can trust your listings.'}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Industry</p>
                    <p className="mt-2 text-slate-900">{companyProfile?.industry || 'Not set'}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="mt-2 text-slate-900">{companyProfile?.location || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{currentJobTitle}</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{isEditing ? 'Edit job posting' : 'Create job posting'}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    New job
                  </button>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Job title</label>
                    <input
                      value={jobForm.title}
                      onChange={(event) => setFormValue('title', event.target.value)}
                      required
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <input
                      value={jobForm.location}
                      onChange={(event) => setFormValue('location', event.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                      <select
                        value={jobForm.type}
                        onChange={(event) => setFormValue('type', event.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      >
                        <option value="full_time">Full time</option>
                        <option value="part_time">Part time</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="on_site">On site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        value={jobForm.status}
                        onChange={(event) => setFormValue('status', event.target.value)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={jobForm.description}
                      onChange={(event) => setFormValue('description', event.target.value)}
                      required
                      className="min-h-[140px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Stipend min</label>
                      <input
                        type="number"
                        min={0}
                        value={jobForm.stipend_min ?? ''}
                        onChange={(event) => setFormValue('stipend_min', event.target.value ? Number(event.target.value) : null)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Stipend max</label>
                      <input
                        type="number"
                        min={0}
                        value={jobForm.stipend_max ?? ''}
                        onChange={(event) => setFormValue('stipend_max', event.target.value ? Number(event.target.value) : null)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (months)</label>
                      <input
                        type="number"
                        min={0}
                        value={jobForm.duration_months ?? ''}
                        onChange={(event) => setFormValue('duration_months', event.target.value ? Number(event.target.value) : null)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Openings</label>
                      <input
                        type="number"
                        min={1}
                        value={jobForm.openings ?? ''}
                        onChange={(event) => setFormValue('openings', Number(event.target.value) || 1)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                      <input
                        type="date"
                        value={jobForm.deadline ?? ''}
                        onChange={(event) => setFormValue('deadline', event.target.value || null)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Responsibilities</label>
                    <textarea
                      value={jobForm.responsibilities}
                      onChange={(event) => setFormValue('responsibilities', event.target.value)}
                      className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Requirements</label>
                    <textarea
                      value={jobForm.requirements}
                      onChange={(event) => setFormValue('requirements', event.target.value)}
                      className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                    >
                      {saving ? 'Saving…' : isEditing ? 'Update job' : 'Create job'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Job board</p>
                  <h2 className="text-2xl font-semibold text-slate-900">Your open roles</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{jobs.length}</span>
              </div>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">No job postings yet. Create the first posting to start receiving applications.</div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{job.title}</p>
                          <p className="text-sm text-slate-500 mt-1">{job.location || 'Remote'} · {job.type.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{job.status}</span>
                          <button
                            type="button"
                            onClick={() => void handleSelectJob(job.id)}
                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                        <span>{job.stipend_min || job.stipend_max ? `${job.stipend_min ?? 0} - ${job.stipend_max ?? 0} stipend` : 'Stipend TBD'}</span>
                        <span>{job.duration_months ? `${job.duration_months} months` : 'Duration TBD'}</span>
                        <span>{job.deadline ? `Deadline ${job.deadline}` : 'No deadline'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No employers are available right now.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {companies.map((company) => (
              <div key={company.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{company.company_name}</h2>
                    <p className="mt-2 text-sm text-slate-500">{company.industry || 'Industry not set'} · {company.location || 'Location not set'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${company.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {company.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
