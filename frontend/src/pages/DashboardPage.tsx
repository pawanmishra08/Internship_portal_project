import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApplications } from '../api/applications'
import { getCompanies, getOwnCompanyProfile } from '../api/companies'
import { createJob, getJobs } from '../api/jobs'
import { getRecommendations } from '../api/recommendations'
import { getStudentProfile, getStudents, updateStudentProfile } from '../api/students'
import type {
  ApplicationItem,
  CompanyListItem,
  CompanyProfile,
  JobCard,
  JobFormPayload,
  RecommendationItem,
  StudentListItem,
  StudentProfile,
  StudentProfilePayload,
} from '../types/api'

function formatDate(value: string | undefined) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

const initialStudentForm: StudentProfilePayload = {
  bio: '',
  phone: '',
  location: '',
  university: '',
  degree: '',
  field_of_study: '',
  graduation_year: null,
  gpa: null,
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  available_from: null,
  is_available: true,
  skill_ids: [],
}

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

function profileScore(profile: StudentProfile | null) {
  if (!profile) return 0
  const fields = [
    profile.bio,
    profile.phone,
    profile.location,
    profile.university,
    profile.degree,
    profile.field_of_study,
    profile.graduation_year,
    profile.gpa,
    profile.resume_url,
    profile.linkedin_url,
    profile.github_url,
    profile.portfolio_url,
  ]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { status, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [studentForm, setStudentForm] = useState<StudentProfilePayload>(initialStudentForm)
  const [studentSaving, setStudentSaving] = useState(false)
  const [studentMessage, setStudentMessage] = useState<string | null>(null)
  const [jobForm, setJobForm] = useState<JobFormPayload>(initialJobForm)
  const [jobSaving, setJobSaving] = useState(false)
  const [jobMessage, setJobMessage] = useState<string | null>(null)
  const [adminQuery, setAdminQuery] = useState('')
  const [adminFilter, setAdminFilter] = useState<'students' | 'companies'>('students')

  const filteredStudents = useMemo(
    () => students.filter((student) =>
      student.full_name.toLowerCase().includes(adminQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(adminQuery.toLowerCase())
    ),
    [students, adminQuery]
  )

  const filteredCompanies = useMemo(
    () => companies.filter((company) =>
      company.company_name.toLowerCase().includes(adminQuery.toLowerCase()) ||
      (company.industry ?? '').toLowerCase().includes(adminQuery.toLowerCase())
    ),
    [companies, adminQuery]
  )

  useEffect(() => {
    if (status === 'anonymous') {
      navigate('/auth', { replace: true })
      return
    }

    if (status !== 'authenticated' || !user) {
      return
    }

    const currentUser = user

    async function loadDashboard() {
      setError(null)
      setLoading(true)

      try {
        if (currentUser.role === 'student') {
          const [profileData, applicationsData, recommendationData] = await Promise.all([
            getStudentProfile(),
            getApplications(),
            getRecommendations(3),
          ])
          setProfile(profileData)
          setApplications(applicationsData)
          setRecommendations(recommendationData.results)
          setStudentForm({
            bio: profileData.bio ?? '',
            phone: profileData.phone ?? '',
            location: profileData.location ?? '',
            university: profileData.university ?? '',
            degree: profileData.degree ?? '',
            field_of_study: profileData.field_of_study ?? '',
            graduation_year: profileData.graduation_year ?? null,
            gpa: profileData.gpa ?? null,
            linkedin_url: profileData.linkedin_url ?? '',
            github_url: profileData.github_url ?? '',
            portfolio_url: profileData.portfolio_url ?? '',
            available_from: profileData.available_from ?? null,
            is_available: profileData.is_available,
            skill_ids: profileData.skills.map((skill) => skill.id),
          })
        }

        if (currentUser.role === 'company') {
          const [companyData, jobsData] = await Promise.all([
            getOwnCompanyProfile(),
            getJobs(),
          ])
          setCompanyProfile(companyData)
          setJobs(jobsData)
        }

        if (currentUser.role === 'admin') {
          const [studentData, companyData, jobsData] = await Promise.all([
            getStudents({ is_available: true }),
            getCompanies(),
            getJobs({ status: 'active' }),
          ])
          setStudents(studentData)
          setCompanies(companyData)
          setJobs(jobsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [status, user, navigate])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">Preparing your workspace…</div>
      </div>
    )
  }

  async function handleStudentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStudentMessage(null)
    setStudentSaving(true)

    try {
      const updated = await updateStudentProfile(studentForm)
      setProfile(updated)
      setStudentMessage('Profile updated successfully.')
    } catch (err) {
      setStudentMessage(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setStudentSaving(false)
    }
  }

  async function handleJobSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setJobMessage(null)
    setJobSaving(true)

    try {
      const createdJob = await createJob(jobForm)
      setJobs((current) => [createdJob, ...current])
      setJobForm(initialJobForm)
      setJobMessage('Job published successfully.')
    } catch (err) {
      setJobMessage(err instanceof Error ? err.message : 'Unable to publish job.')
    } finally {
      setJobSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-slate-300 border-t-slate-900 rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Welcome back</p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3">{user.full_name}</h1>
              <p className="max-w-2xl text-gray-600 mt-3">
                You are signed in as a <span className="font-semibold text-indigo-600">{user.role}</span>. Your dashboard is tailored to your role.
              </p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Member since</p>
              <p className="mt-3 text-2xl font-bold text-gray-900">{formatDate(user.date_joined)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {user.role === 'student' && (
          <section className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Profile completeness</p>
                <p className="mt-3 text-4xl font-bold text-indigo-600">{profileScore(profile)}%</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2 rounded-full" style={{width: `${profileScore(profile)}%`}} />
                </div>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Recommended jobs</p>
                <p className="mt-3 text-4xl font-bold text-emerald-600">{recommendations.length}</p>
                <p className="text-xs text-gray-500 mt-2">Based on your skills</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Applications</p>
                <p className="mt-3 text-4xl font-bold text-blue-600">{applications.length}</p>
                <p className="text-xs text-gray-500 mt-2">Total submitted</p>
              </div>
            </div>

            <div className="card">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Quick Profile Update</h2>
                  <p className="text-gray-600 mt-1">Keep your information fresh and discoverable</p>
                </div>
                <span className="badge badge-primary">Student</span>
              </div>
              {studentMessage && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
                  ✓ {studentMessage}
                </div>
              )}
              <form onSubmit={handleStudentSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
                    <textarea
                      value={studentForm.bio ?? ''}
                      onChange={(event) => setStudentForm((current) => ({ ...current, bio: event.target.value }))}
                      className="input-field h-24"
                      placeholder="Tell companies about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Quick Links</label>
                    <div className="space-y-3">
                      <input
                        value={studentForm.linkedin_url ?? ''}
                        onChange={(event) => setStudentForm((current) => ({ ...current, linkedin_url: event.target.value }))}
                        className="input-field"
                        placeholder="LinkedIn URL"
                      />
                      <input
                        value={studentForm.github_url ?? ''}
                        onChange={(event) => setStudentForm((current) => ({ ...current, github_url: event.target.value }))}
                        className="input-field"
                        placeholder="GitHub URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">University</label>
                    <input
                      value={studentForm.university ?? ''}
                      onChange={(event) => setStudentForm((current) => ({ ...current, university: event.target.value }))}
                      className="input-field"
                      placeholder="University name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Field of Study</label>
                    <input
                      value={studentForm.field_of_study ?? ''}
                      onChange={(event) => setStudentForm((current) => ({ ...current, field_of_study: event.target.value }))}
                      className="input-field"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Availability</label>
                    <label className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={studentForm.is_available ?? true}
                        onChange={(event) => setStudentForm((current) => ({ ...current, is_available: event.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Available now</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={studentSaving}
                    className="btn btn-primary"
                  >
                    {studentSaving ? 'Saving…' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="card">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recommended opportunities</h2>
                    <p className="text-gray-600 mt-1">Based on your skills and profile</p>
                  </div>
                  <span className="badge badge-primary">Top picks</span>
                </div>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Complete your profile and add skills to see recommendations.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendations.map((recommendation) => (
                      <div key={recommendation.job.id} className="card group hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">{recommendation.job.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{recommendation.job.company_name}</p>
                            <p className="text-xs text-gray-500 mt-1">{recommendation.job.location || 'Remote'}</p>
                          </div>
                          <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent font-bold text-lg">
                            {Math.round(recommendation.score * 100)}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recommendation.matched_skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="badge badge-primary text-xs">{skill}</span>
                          ))}
                          {recommendation.matched_skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{recommendation.matched_skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent applications</h2>
                    <p className="text-gray-600 mt-1">Your latest submissions</p>
                  </div>
                  <span className="badge badge-primary">Latest</span>
                </div>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">You haven't applied to any roles yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 5).map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-indigo-50 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">{item.job.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.job.company_name} · {formatDate(item.applied_at)}</p>
                          </div>
                          <span className={`badge text-xs ${
                            item.status === 'accepted' ? 'badge-success' :
                            item.status === 'rejected' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {item.status_display}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {user.role === 'company' && (
          <section className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Company Status</p>
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  <span className={`badge ${companyProfile?.is_verified ? 'badge-success' : 'badge-warning'}`}>
                    {companyProfile?.is_verified ? '✓ Verified' : 'Pending'}
                  </span>
                </p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Open Roles</p>
                <p className="mt-3 text-4xl font-bold text-blue-600">{jobs.filter((job) => job.status === 'active').length}</p>
                <p className="text-xs text-gray-500 mt-2">Currently active</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Total Positions</p>
                <p className="mt-3 text-4xl font-bold text-purple-600">{jobs.length}</p>
                <p className="text-xs text-gray-500 mt-2">All time</p>
              </div>
            </div>

            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{companyProfile?.company_name || 'Company'}</h2>
                <p className="text-gray-600 mt-1">{companyProfile?.industry || 'Industry not specified'}</p>
              </div>
              <p className="text-gray-700 leading-relaxed">{companyProfile?.description || 'No company description available yet. Update your profile to tell students about your company.'}</p>
            </div>

            <div className="card">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Publish a New Role</h2>
                  <p className="text-gray-600 mt-1">Create an internship or job posting</p>
                </div>
                <span className="badge badge-primary">Post</span>
              </div>
              {jobMessage && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
                  ✓ {jobMessage}
                </div>
              )}
              <form onSubmit={handleJobSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Role Title</label>
                    <input
                      value={jobForm.title}
                      onChange={(event) => setJobForm((current) => ({ ...current, title: event.target.value }))}
                      className="input-field"
                      placeholder="e.g. Frontend Engineer Intern"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                    <input
                      value={jobForm.location ?? ''}
                      onChange={(event) => setJobForm((current) => ({ ...current, location: event.target.value }))}
                      className="input-field"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                  <textarea
                    value={jobForm.description}
                    onChange={(event) => setJobForm((current) => ({ ...current, description: event.target.value }))}
                    className="input-field h-24"
                    placeholder="Tell candidates about this role..."
                    required
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                    <select
                      value={jobForm.type}
                      onChange={(event) => setJobForm((current) => ({ ...current, type: event.target.value }))}
                      className="input-field"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Openings</label>
                    <input
                      type="number"
                      min={1}
                      value={jobForm.openings ?? 1}
                      onChange={(event) => setJobForm((current) => ({ ...current, openings: Number(event.target.value) }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Deadline</label>
                    <input
                      type="date"
                      value={jobForm.deadline ?? ''}
                      onChange={(event) => setJobForm((current) => ({ ...current, deadline: event.target.value || null }))}
                      className="input-field"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={jobSaving}
                      className="btn btn-primary w-full"
                    >
                      {jobSaving ? 'Publishing…' : 'Publish'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Job Postings</h3>
              {jobs.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No job postings yet. Create your first role above!</p>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{job.location || 'Remote'} · {job.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-700">{job.application_count ?? 0} applications</p>
                          <span className={`inline-block mt-1 badge ${job.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {user.role === 'admin' && (
          <section className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Active Students</p>
                <p className="mt-3 text-4xl font-bold text-blue-600">{students.length}</p>
                <p className="text-xs text-gray-500 mt-2">Available for opportunities</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Registered Companies</p>
                <p className="mt-3 text-4xl font-bold text-purple-600">{companies.length}</p>
                <p className="text-xs text-gray-500 mt-2">In the network</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-gray-600">Active Roles</p>
                <p className="mt-3 text-4xl font-bold text-emerald-600">{jobs.length}</p>
                <p className="text-xs text-gray-500 mt-2">Current openings</p>
              </div>
            </div>

            <div className="card">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Admin Quick Search</h2>
                  <p className="text-gray-600 mt-1">Filter students and companies by name or details</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminFilter('students')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      adminFilter === 'students'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminFilter('companies')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      adminFilter === 'companies'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Companies
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  value={adminQuery}
                  onChange={(event) => setAdminQuery(event.target.value)}
                  placeholder={adminFilter === 'students' ? 'Search by name or email...' : 'Search by company name...'}
                  className="input-field md:col-span-2"
                />
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 flex items-center justify-center font-semibold text-indigo-900">
                  {adminFilter === 'students' ? filteredStudents.length : filteredCompanies.length} result{adminFilter === 'students' ? filteredStudents.length !== 1 ? 's' : '' : filteredCompanies.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {adminFilter === 'students' ? 'Student Profiles' : 'Companies'}
              </h3>
              {adminFilter === 'students' ? (
                filteredStudents.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No students matched your search</p>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.slice(0, 5).map((student) => (
                      <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                        <p className="font-semibold text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{student.university || 'University not specified'}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : filteredCompanies.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No companies matched your search</p>
              ) : (
                <div className="space-y-3">
                  {filteredCompanies.slice(0, 5).map((company) => (
                    <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">{company.company_name}</p>
                        {company.is_verified && <span className="badge badge-success text-xs">Verified</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{company.industry || 'Industry not specified'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
