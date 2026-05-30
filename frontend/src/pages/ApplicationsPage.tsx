import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { deleteApplication, getApplications, getJobApplicants, updateApplicationStatus } from '../api/applications'
import { getJobs } from '../api/jobs'
import type { ApplicationItem, ApplicantItem, JobCard } from '../types/api'

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Applications</p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-2">Manage your pipeline</h1>
            <p className="text-slate-600 mt-2">{user?.role === 'company' ? 'Review applicants for your open jobs.' : 'Track the internships you applied to.'}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Summary</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user?.role === 'company' ? jobs.length : applications.length} items</p>
          </div>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading applications…</div>
        ) : user?.role === 'student' ? (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">You have not applied to any roles yet.</div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{application.job.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{application.job.company_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{application.status_display}</span>
                      {application.status !== 'accepted' && application.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => void handleWithdraw(application.id)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Open roles</p>
              <div className="mt-4 space-y-3">
                {jobs.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 p-4 text-slate-600">No jobs found. Add a job first.</div>
                ) : (
                  jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left rounded-3xl border px-4 py-4 ${selectedJobId === job.id ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{job.location || 'Remote'}</p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Applicants</p>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedJobId ? 'Selected role' : 'Pick a job'}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{applicants.length} applicants</span>
                </div>
                {selectedJobId === null ? (
                  <p className="text-slate-600">Select a job to review applicants.</p>
                ) : applicants.length === 0 ? (
                  <p className="text-slate-600">No applicants have applied to this position yet.</p>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="rounded-3xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                          <div>
                            <p className="font-semibold text-slate-900">{applicant.student.full_name}</p>
                            <p className="text-sm text-slate-500">{applicant.student.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{applicant.status_display}</span>
                            <div className="flex gap-2">
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
                                className="px-3 py-1 rounded-lg border border-blue-300 text-blue-700 text-sm disabled:opacity-50"
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
                                className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
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
                                className="px-3 py-1 rounded-lg border border-red-300 text-red-700 text-sm disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">Cover note: {applicant.cover_letter || 'Not provided.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">This section is only available for students and company users.</div>
        )}
      </div>
    </div>
  )
}
