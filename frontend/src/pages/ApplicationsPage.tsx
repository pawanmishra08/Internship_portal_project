import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { deleteApplication, downloadApplicantDocument, getApplications, getJobApplicants, updateApplicationStatus } from '../api/applications'
import { getJobs } from '../api/jobs'
import type { ApplicationItem, ApplicantItem, JobCard, StudentProfile } from '../types/api'

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [applicants, setApplicants] = useState<ApplicantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setError(null)
      setLoading(true)

      try {
        if (user?.role === 'student') {
          const applicationsData = await getApplications()
          setApplications(applicationsData)
        }

        if (user?.role === 'company') {
          const jobsData = await getJobs()
          setJobs(jobsData)
          if (jobsData.length > 0) {
            setSelectedJobId(jobsData[0].id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load applications')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [user?.role])

  useEffect(() => {
    if (selectedJobId === null || user?.role !== 'company') {
      return
    }

    const jobId = selectedJobId

    async function loadApplicants() {
      setError(null)
      try {
        const results = await getJobApplicants(jobId)
        setApplicants(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load applicants')
      }
    }

    void loadApplicants()
  }, [selectedJobId, user?.role])

  async function handleWithdraw(id: number) {
    try {
      await deleteApplication(id)
      setApplications((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to withdraw application')
    }
  }

  async function handleDownloadApplicant(applicant: ApplicantItem) {
    try {
      const { blob, filename, contentType } = await downloadApplicantDocument(applicant.id)
      const url = URL.createObjectURL(new Blob([blob], { type: contentType }))
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `${applicant.student.full_name.replace(/\s+/g, '-').toLowerCase()}-profile.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download applicant document')
    }
  }

  function renderStudentHighlights(student: StudentProfile) {
    return [
      student.bio,
      student.location,
      student.university,
      student.degree,
      student.field_of_study,
      student.target_role,
      student.preferred_work_mode,
      student.available_from,
    ].filter(Boolean).length
  }

  return (
    <div className="page-shell">
      <div className="page-container py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Applications</p>
            <h1 className="page-title">Manage your pipeline</h1>
            <p className="page-subtitle">{user?.role === 'company' ? 'Review applicants for your open jobs.' : 'Track the internships you applied to.'}</p>
          </div>
          <div className="rounded-3xl border border-[#d4d4ce] bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#aaa9a2' }}>Summary</p>
            <p className="mt-2 text-lg" style={{ color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>{user?.role === 'company' ? jobs.length : applications.length} items</p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-3xl border border-[#f09595] bg-[#fcebeb] p-4 text-[#a32d2d]">{error}</div>}

        {loading ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>Loading applications…</div>
        ) : user?.role === 'student' ? (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="card p-10 text-center" style={{ color: '#888780' }}>You have not applied to any roles yet.</div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="rounded-3xl border border-[#d4d4ce] bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold" style={{ color: '#1a1a18' }}>{application.job.title}</p>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>{application.job.company_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: '#f0efe9', color: '#1a1a18' }}>{application.status_display}</span>
                      {application.status !== 'accepted' && application.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => void handleWithdraw(application.id)}
                          className="rounded-full border bg-white px-4 py-2 text-xs uppercase tracking-[0.14em] font-medium transition hover:bg-[#fafaf8]"
                          style={{ borderColor: '#d4d4ce', color: '#1a1a18' }}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : user?.role === 'company' ? (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-[#d4d4ce] bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em]" style={{ color: '#aaa9a2' }}>Open roles</p>
              <div className="mt-4 space-y-3">
                {jobs.length === 0 ? (
                  <div className="rounded-3xl border border-[#d4d4ce] p-4" style={{ color: '#888780' }}>No jobs found. Add a job first.</div>
                ) : (
                  jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedJobId === job.id ? 'bg-[#f0efe9]' : 'bg-white hover:bg-[#fafaf8]'}`}
                      style={{ borderColor: selectedJobId === job.id ? '#1a1a18' : '#d4d4ce' }}
                    >
                      <p className="font-semibold" style={{ color: '#1a1a18' }}>{job.title}</p>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>{job.location || 'Remote'}</p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="space-y-4">
              <div className="rounded-3xl border border-[#d4d4ce] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em]" style={{ color: '#aaa9a2' }}>Applicants</p>
                    <h2 className="text-xl" style={{ color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>{selectedJobId ? 'Selected role' : 'Pick a job'}</h2>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ background: '#f0efe9', color: '#1a1a18' }}>{applicants.length} applicants</span>
                </div>
                {selectedJobId === null ? (
                  <p style={{ color: '#888780' }}>Select a job to review applicants.</p>
                ) : applicants.length === 0 ? (
                  <p style={{ color: '#888780' }}>No applicants have applied to this position yet.</p>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="rounded-3xl border border-[#d4d4ce] p-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                            <div>
                              <p className="font-semibold" style={{ color: '#1a1a18' }}>{applicant.student.full_name}</p>
                              <p className="text-sm" style={{ color: '#888780' }}>{applicant.student.email}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>
                                Match score {Math.round(applicant.match_score ?? 0)}%
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: '#f0efe9', color: '#1a1a18' }}>{applicant.status_display}</span>
                              <button
                                type="button"
                                onClick={() => void handleDownloadApplicant(applicant)}
                                className="rounded-full border border-[#d4d4ce] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition hover:bg-[#fafaf8]"
                                style={{ color: '#1a1a18' }}
                              >
                                Download CV / Profile
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-2xl bg-[#fafaf8] p-4">
                              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Overview</p>
                              <div className="mt-2 space-y-1 text-sm" style={{ color: '#1a1a18' }}>
                                <p>{applicant.student.university || 'University not set'}</p>
                                <p>{applicant.student.degree || 'Degree not set'}</p>
                                <p>{applicant.student.field_of_study || 'Field of study not set'}</p>
                                <p>{applicant.student.target_role || 'Target role not set'}</p>
                                <p>{applicant.student.preferred_work_mode || 'Work mode not set'}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#fafaf8] p-4">
                              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Contact</p>
                              <div className="mt-2 space-y-1 text-sm" style={{ color: '#1a1a18' }}>
                                <p>{applicant.student.phone || 'Phone not set'}</p>
                                <p>{applicant.student.location || 'Location not set'}</p>
                                <p>{applicant.student.linkedin_url || 'LinkedIn not set'}</p>
                                <p>{applicant.student.github_url || 'GitHub not set'}</p>
                                <p>{applicant.student.portfolio_url || 'Portfolio not set'}</p>
                              </div>
                            </div>

                            <div className="rounded-2xl bg-[#fafaf8] p-4">
                              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Profile health</p>
                              <p className="mt-2 text-2xl font-semibold" style={{ color: '#1a1a18' }}>{renderStudentHighlights(applicant.student)}</p>
                              <p className="mt-1 text-sm" style={{ color: '#888780' }}>Key fields filled</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Bio</p>
                              <p className="mt-2 text-sm leading-6" style={{ color: '#1a1a18' }}>{applicant.student.bio || 'No bio provided.'}</p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Skills</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {applicant.student.skills?.length ? applicant.student.skills.map((skill) => (
                                  <span key={skill.id} className="rounded-full bg-[#f0efe9] px-3 py-1 text-xs font-medium" style={{ color: '#1a1a18' }}>{skill.name}</span>
                                )) : (
                                  <p className="text-sm" style={{ color: '#888780' }}>No skills listed.</p>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Education preferences</p>
                                <div className="mt-2 space-y-2">
                                  {applicant.student.degree_preferences?.length ? applicant.student.degree_preferences.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-[#e4e3dd] bg-white p-3 text-sm" style={{ color: '#1a1a18' }}>
                                      <p className="font-semibold">{item.level.toUpperCase()} · {item.institution || 'Institution not set'}</p>
                                      <p className="mt-1" style={{ color: '#888780' }}>{item.field_of_study || 'Field not set'} · {item.graduation_year || 'Year not set'}</p>
                                    </div>
                                  )) : (
                                    <p className="text-sm" style={{ color: '#888780' }}>No education preferences added.</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Projects</p>
                                <div className="mt-2 space-y-2">
                                  {applicant.student.projects?.length ? applicant.student.projects.slice(0, 3).map((project) => (
                                    <div key={project.id} className="rounded-2xl border border-[#e4e3dd] bg-white p-3 text-sm" style={{ color: '#1a1a18' }}>
                                      <p className="font-semibold">{project.title}</p>
                                      <p className="mt-1" style={{ color: '#888780' }}>{project.year || 'Year not set'} · {project.technologies || 'No technologies listed'}</p>
                                      <p className="mt-2" style={{ color: '#888780' }}>{project.description || 'No description provided.'}</p>
                                    </div>
                                  )) : (
                                    <p className="text-sm" style={{ color: '#888780' }}>No projects added.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const prev = applicants
                                    setApplicants((cur) => cur.map((a) => a.id === applicant.id ? { ...a, status: 'shortlisted', status_display: 'Shortlisted' } : a))
                                    try {
                                      await updateApplicationStatus(applicant.id, 'shortlisted')
                                    } catch (err) {
                                      setApplicants(prev)
                                      setError(err instanceof Error ? err.message : 'Unable to update status')
                                    }
                                  }}
                                  disabled={applicant.status === 'accepted' || applicant.status === 'rejected'}
                                  className="rounded-full border border-blue-300 px-3 py-1 text-sm text-blue-700 disabled:opacity-50"
                                >
                                  Shortlist
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const prev = applicants
                                    setApplicants((cur) => cur.map((a) => a.id === applicant.id ? { ...a, status: 'accepted', status_display: 'Accepted' } : a))
                                    try {
                                      await updateApplicationStatus(applicant.id, 'accepted')
                                    } catch (err) {
                                      setApplicants(prev)
                                      setError(err instanceof Error ? err.message : 'Unable to update status')
                                    }
                                  }}
                                  disabled={applicant.status === 'accepted' || applicant.status === 'rejected'}
                                  className="rounded-full bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                                >
                                  Accept
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const prev = applicants
                                    setApplicants((cur) => cur.map((a) => a.id === applicant.id ? { ...a, status: 'rejected', status_display: 'Rejected' } : a))
                                    try {
                                      await updateApplicationStatus(applicant.id, 'rejected')
                                    } catch (err) {
                                      setApplicants(prev)
                                      setError(err instanceof Error ? err.message : 'Unable to update status')
                                    }
                                  }}
                                  disabled={applicant.status === 'accepted' || applicant.status === 'rejected'}
                                  className="rounded-full border border-red-300 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>

                              <p className="text-sm" style={{ color: '#888780' }}>Cover note: {applicant.cover_letter || 'Not provided.'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>This section is only available for students and company users.</div>
        )}
      </div>
    </div>
  )
}
