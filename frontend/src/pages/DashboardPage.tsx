import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApplications } from '../api/applications'
import { getCompany, getCompanies, getCompanyJobs, getOwnCompanyProfile, updateCompanyVerification } from '../api/companies'
import { createJob, getJobs } from '../api/jobs'
import { getRecommendations } from '../api/recommendations'
import { getStudent, getStudentProfile, getStudents } from '../api/students'
import { COMMON_COLORS } from '../utils/themeTokens'
import type {
  ApplicationItem,
  CompanyListItem,
  CompanyProfile,
  JobCard,
  JobFormPayload,
  RecommendationItem,
  StudentListItem,
  StudentProfile,
} from '../types/api'

function formatDate(value: string | undefined) {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
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
    profile.bio, profile.phone, profile.location, profile.university,
    profile.degree, profile.field_of_study, profile.graduation_year, profile.gpa,
    profile.resume_url, profile.degree_preferences?.length, profile.projects?.length,
    profile.linkedin_url, profile.github_url, profile.portfolio_url,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = COMMON_COLORS

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="dp-label">{label}</label>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="dp-card">
      <div className="dp-card-inner">
        <p className="dp-kicker" style={{ marginBottom: 10 }}>{label}</p>
        <p className="dp-serif" style={{ fontSize: 32, fontWeight: 400, color: C.ink, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ marginTop: 8, fontSize: 12, color: C.inkSoft }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
  const [companySavingId, setCompanySavingId] = useState<number | null>(null)

  const [jobForm, setJobForm] = useState<JobFormPayload>(initialJobForm)
  const [jobSaving, setJobSaving] = useState(false)
  const [jobMessage, setJobMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [adminQuery, setAdminQuery] = useState('')
  const [adminFilter, setAdminFilter] = useState<'students' | 'companies'>('students')
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null)
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<CompanyProfile | null>(null)
  const [selectedCompanyJobs, setSelectedCompanyJobs] = useState<JobCard[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const filteredStudents = useMemo(
    () => students.filter((s) =>
      s.full_name.toLowerCase().includes(adminQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(adminQuery.toLowerCase())
    ), [students, adminQuery]
  )

  const filteredCompanies = useMemo(
    () => companies.filter((c) =>
      c.company_name.toLowerCase().includes(adminQuery.toLowerCase()) ||
      (c.industry ?? '').toLowerCase().includes(adminQuery.toLowerCase())
    ), [companies, adminQuery]
  )

  const studentCompletion = profileScore(profile)
  const verifiedCompanyCount = useMemo(
    () => companies.filter((company) => company.is_verified).length,
    [companies],
  )
  const pendingCompanyCount = companies.length - verifiedCompanyCount
  const activeJobCount = useMemo(
    () => jobs.filter((job) => job.status === 'active').length,
    [jobs],
  )
  const adminAnchors = [
    { href: '#platform-overview', label: 'Overview' },
    { href: '#admin-profile-explorer', label: 'Profiles' },
    { href: '#hiring-ops', label: 'Hiring' },
  ]

  async function openStudentPreview(studentId: number) {
    setAdminFilter('students')
    setSelectedStudentId(studentId)
    setPreviewError(null)
    setPreviewLoading(true)
    try {
      const student = await getStudent(studentId)
      setSelectedStudentProfile(student)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Unable to load student profile')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function openCompanyPreview(companyId: number) {
    setAdminFilter('companies')
    setSelectedCompanyId(companyId)
    setPreviewError(null)
    setPreviewLoading(true)
    try {
      const [company, roles] = await Promise.all([getCompany(companyId), getCompanyJobs(companyId)])
      setSelectedCompanyProfile(company)
      setSelectedCompanyJobs(roles)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Unable to load company profile')
    } finally {
      setPreviewLoading(false)
    }
  }

  function focusAdminExplorer(view: 'students' | 'companies') {
    if (view === 'students') {
      const firstStudent = filteredStudents[0]
      if (firstStudent) {
        void openStudentPreview(firstStudent.id)
      } else {
        setAdminFilter('students')
        setPreviewError(null)
      }
    } else {
      const firstCompany = filteredCompanies[0]
      if (firstCompany) {
        void openCompanyPreview(firstCompany.id)
      } else {
        setAdminFilter('companies')
        setPreviewError(null)
      }
    }

    document.getElementById('admin-profile-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (status === 'anonymous') { navigate('/auth', { replace: true }); return }
    if (status !== 'authenticated' || !user) return
    const currentUser = user

    async function loadDashboard() {
      setError(null); setLoading(true)
      try {
        if (currentUser.role === 'student') {
          const [profileData, applicationsData, recommendationData] = await Promise.all([
            getStudentProfile(), getApplications(), getRecommendations(3),
          ])
          setProfile(profileData); setApplications(applicationsData)
          setRecommendations(recommendationData.results)
        }
        if (currentUser.role === 'company') {
          const [companyData, jobsData] = await Promise.all([getOwnCompanyProfile(), getJobs()])
          setCompanyProfile(companyData); setJobs(jobsData)
        }
        if (currentUser.role === 'admin') {
          const [studentData, companyData, jobsData] = await Promise.all([
            getStudents({ is_available: true }), getCompanies(), getJobs({ status: 'active' }),
          ])
          setStudents(studentData); setCompanies(companyData); setJobs(jobsData)
          if (studentData.length > 0) {
            void openStudentPreview(studentData[0].id)
          } else if (companyData.length > 0) {
            void openCompanyPreview(companyData[0].id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    void loadDashboard()
  }, [status, user, navigate])

  async function handleJobSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setJobMessage(null); setJobSaving(true)
    try {
      const created = await createJob(jobForm)
      setJobs((cur) => [created, ...cur])
      setJobForm(initialJobForm)
      setJobMessage('Job published successfully.')
    } catch (err) {
      setJobMessage(err instanceof Error ? err.message : 'Unable to publish job.')
    } finally {
      setJobSaving(false)
    }
  }

  async function handleToggleCompanyVerification(companyId: number, nextVerified: boolean) {
    setError(null)
    setSuccessMessage(null)
    setCompanySavingId(companyId)

    try {
      const updatedCompany = await updateCompanyVerification(companyId, { is_verified: nextVerified })
      setCompanies((current) => current.map((company) => (company.id === updatedCompany.id ? updatedCompany : company)))
      setSelectedCompanyProfile((current) => (current?.id === updatedCompany.id ? updatedCompany : current))
      setSuccessMessage(nextVerified ? 'Company verified successfully.' : 'Company verification removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update company verification')
    } finally {
      setCompanySavingId(null)
    }
  }

  if (!user) {
    return (
      <div className="dp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: C.inkSoft, fontSize: 14 }}>Preparing your workspace…</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="common-spinner" style={{ borderColor: C.border, borderTopColor: C.ink, margin: '0 auto 16px' }} />
          <p style={{ color: C.inkSoft, fontSize: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1)

  return (
    <div className="dp-root">

        {/* ── Header band ── */}
        <div className="dp-header-band">
          <div className="dp-shell" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <div className="dp-hero-copy">
              <div>
                <p className="dp-kicker" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Welcome back</p>
                <h1 className="dp-serif" style={{ fontSize: 36, fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1.15 }}>{user.full_name}</h1>
                <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
                  Signed in as <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{roleLabel}</span>
                  {' '}— your dashboard is tailored to your role.
                </p>
              </div>
              <div className="dp-hero-panel">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Member since</p>
                <p className="dp-serif" style={{ fontSize: 22, color: '#fff', fontWeight: 400 }}>{formatDate(user.date_joined)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="dp-shell">

          {successMessage && (
            <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: '12px 18px', color: C.success, fontSize: 14, marginBottom: 24 }}>
              {successMessage}
            </div>
          )}

          {error && (
            <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 10, padding: '12px 18px', color: C.error, fontSize: 14, marginBottom: 24 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* ══ STUDENT VIEW ══ */}
          {user.role === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Quick nav */}
              <div className="dp-card">
                <div className="dp-card-inner">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 4 }}>Navigation</p>
                      <p className="dp-serif" style={{ fontSize: 20, fontWeight: 400, color: C.ink }}>Jump to a section</p>
                    </div>
                    <span className="dp-badge dp-badge-neutral">Student flow</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      ['#profile-completion', 'Profile'],
                      ['#project-highlights', 'Projects'],
                      ['#recommended-opportunities', 'Recommendations'],
                      ['#recent-applications', 'Applications'],
                    ].map(([href, label]) => (
                      <a key={href} href={href} className="dp-nav-link" style={{ border: `1px solid ${C.border}` }}>{label}</a>
                    ))}
                    <a href="/profile#profile-basics" className="dp-nav-link" style={{ border: `1px solid ${C.border}` }}>Edit profile →</a>
                  </div>
                </div>
              </div>

              {/* Stat row */}
              <div id="profile-completion" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                <StatCard label="Profile complete" value={`${studentCompletion}%`} sub="Based on filled fields" />
                <StatCard label="Recommended" value={recommendations.length} sub="Matched to your skills" />
                <StatCard label="Applications" value={applications.length} sub="Total submitted" />
                <StatCard label="Projects" value={profile?.projects?.length ?? 0} sub="Shared on profile" />
                {/* Progress card */}
                <div className="dp-card" style={{ gridColumn: 'span 2' }}>
                  <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 4 }}>Finish your profile</p>
                      <p style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.6 }}>
                        Add projects, education, resume, and a few more details so companies can review you faster.
                      </p>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: C.inkSoft }}>Completion</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{studentCompletion}%</span>
                      </div>
                      <div className="dp-progress-track">
                        <div className="dp-progress-fill" style={{ width: `${studentCompletion}%` }} />
                      </div>
                    </div>
                    <button type="button" onClick={() => navigate('/profile')} className="dp-btn-ghost" style={{ alignSelf: 'flex-start' }}>
                      Complete profile →
                    </button>
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div id="project-highlights" className="dp-card">
                <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="dp-kicker" style={{ marginBottom: 4 }}>Portfolio</p>
                    <h2 className="dp-serif" style={{ fontSize: 22, fontWeight: 400, color: C.ink }}>Project highlights</h2>
                  </div>
                  <span className="dp-badge dp-badge-neutral">{profile?.projects?.length ?? 0} saved</span>
                </div>
                <div className="dp-card-inner">
                  {profile?.projects?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                      {profile.projects.slice(0, 3).map((project) => (
                        <div key={project.id} className="dp-project-card">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6 }}>{project.year || 'Project'}</p>
                              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{project.title}</h3>
                            </div>
                            <span className="dp-badge dp-badge-neutral">Saved</span>
                          </div>
                          <p style={{ marginTop: 10, fontSize: 13, color: C.inkMid, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {project.description || 'No description added yet.'}
                          </p>
                          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {project.technologies && (
                              <span style={{ fontSize: 12, background: C.surfaceAlt, color: C.inkMid, borderRadius: 6, padding: '3px 10px' }}>{project.technologies}</span>
                            )}
                            {project.link && (
                              <a href={project.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.ink, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                                Open link
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: C.surfaceAlt, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '40px 28px', textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 6 }}>No projects yet.</p>
                      <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Add a few projects on your profile to showcase your work here.</p>
                      <button type="button" onClick={() => navigate('/profile')} className="dp-btn-ghost">Add projects</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations + Applications */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                <div id="recommended-opportunities" className="dp-card">
                  <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 4 }}>AI matched</p>
                      <h2 className="dp-serif" style={{ fontSize: 22, fontWeight: 400, color: C.ink }}>Opportunities</h2>
                    </div>
                    <span className="dp-badge dp-badge-neutral">Top picks</span>
                  </div>
                  <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recommendations.length === 0 ? (
                      <p style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', padding: '24px 0' }}>
                        Complete your profile and add skills to see recommendations.
                      </p>
                    ) : recommendations.map((rec) => (
                      <div key={rec.job.id} className="dp-row">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{rec.job.title}</p>
                            <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>{rec.job.company_name}</p>
                            <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{rec.job.location || 'Remote'}</p>
                          </div>
                          <div className="dp-score-ring">{Math.round(rec.score)}%</div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {rec.matched_skills.slice(0, 3).map((skill) => (
                            <span key={skill} style={{ fontSize: 12, background: C.surfaceAlt, color: C.inkMid, borderRadius: 6, padding: '3px 10px' }}>{skill}</span>
                          ))}
                          {rec.matched_skills.length > 3 && (
                            <span style={{ fontSize: 12, color: C.inkSoft }}>+{rec.matched_skills.length - 3} more</span>
                          )}
                        </div>
                        {rec.missing_skills.length > 0 && (
                          <p style={{ marginTop: 8, fontSize: 12, color: C.inkSoft }}>
                            Missing: {rec.missing_skills.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div id="recent-applications" className="dp-card">
                  <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 4 }}>Activity</p>
                      <h2 className="dp-serif" style={{ fontSize: 22, fontWeight: 400, color: C.ink }}>Applications</h2>
                    </div>
                    <span className="dp-badge dp-badge-neutral">Latest</span>
                  </div>
                  <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {applications.length === 0 ? (
                      <p style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', padding: '24px 0' }}>
                        You haven't applied to any roles yet.
                      </p>
                    ) : applications.slice(0, 5).map((item) => {
                      const statusBadge =
                        item.status === 'accepted' ? 'dp-badge-green' :
                        item.status === 'rejected' ? 'dp-badge-red' : 'dp-badge-amber'
                      return (
                        <div key={item.id} className="dp-row">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{item.job.title}</p>
                              <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>
                                {item.job.company_name} · {formatDate(item.applied_at)}
                              </p>
                            </div>
                            <span className={`dp-badge ${statusBadge}`}>{item.status_display}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ COMPANY VIEW ══ */}
          {user.role === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div className="dp-card">
                  <div className="dp-card-inner">
                    <p className="dp-kicker" style={{ marginBottom: 10 }}>Verification</p>
                    <span className={`dp-badge ${companyProfile?.is_verified ? 'dp-badge-green' : 'dp-badge-amber'}`}>
                      {companyProfile?.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
                <StatCard label="Active roles" value={jobs.filter((j) => j.status === 'active').length} sub="Currently open" />
                <StatCard label="Total positions" value={jobs.length} sub="All time" />
              </div>

              {/* Company info */}
              <div className="dp-card">
                <div className="dp-card-inner">
                  <p className="dp-kicker" style={{ marginBottom: 8 }}>Company</p>
                  <h2 className="dp-serif" style={{ fontSize: 26, fontWeight: 400, color: C.ink, marginBottom: 4 }}>
                    {companyProfile?.company_name || 'Your company'}
                  </h2>
                  <p style={{ fontSize: 13, color: C.inkMid, marginBottom: 14 }}>{companyProfile?.industry || 'Industry not specified'}</p>
                  <div className="dp-divider" style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 14, color: C.inkMid, lineHeight: 1.75 }}>
                    {companyProfile?.description || 'No company description available yet. Update your profile to tell students about your company.'}
                  </p>
                </div>
              </div>

              {/* Job form */}
              <div className="dp-card">
                <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="dp-kicker" style={{ marginBottom: 4 }}>Post a role</p>
                    <h2 className="dp-serif" style={{ fontSize: 22, fontWeight: 400, color: C.ink }}>Publish a new role</h2>
                  </div>
                  <span className="dp-badge dp-badge-neutral">Quick post</span>
                </div>
                <form onSubmit={handleJobSubmit}>
                  <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {jobMessage && (
                      <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.success }}>
                        {jobMessage}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <FieldGroup label="Role title">
                        <input value={jobForm.title} onChange={(e) => setJobForm((c) => ({ ...c, title: e.target.value }))} className="dp-field" placeholder="e.g. Frontend Engineer Intern" required />
                      </FieldGroup>
                      <FieldGroup label="Location">
                        <input value={jobForm.location ?? ''} onChange={(e) => setJobForm((c) => ({ ...c, location: e.target.value }))} className="dp-field" placeholder="e.g. Remote, Bangalore" />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Description">
                      <textarea value={jobForm.description} onChange={(e) => setJobForm((c) => ({ ...c, description: e.target.value }))} className="dp-field" rows={4} placeholder="Tell candidates about this role…" required style={{ resize: 'vertical' }} />
                    </FieldGroup>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <FieldGroup label="Type">
                        <select value={jobForm.type} onChange={(e) => setJobForm((c) => ({ ...c, type: e.target.value }))} className="dp-field">
                          <option value="full_time">Full time</option>
                          <option value="part_time">Part time</option>
                          <option value="internship">Internship</option>
                          <option value="contract">Contract</option>
                        </select>
                      </FieldGroup>
                      <FieldGroup label="Openings">
                        <input type="number" min={1} value={jobForm.openings ?? 1} onChange={(e) => setJobForm((c) => ({ ...c, openings: Number(e.target.value) }))} className="dp-field" />
                      </FieldGroup>
                      <FieldGroup label="Deadline">
                        <input type="date" value={jobForm.deadline ?? ''} onChange={(e) => setJobForm((c) => ({ ...c, deadline: e.target.value || null }))} className="dp-field" />
                      </FieldGroup>
                    </div>
                  </div>
                  <div style={{ padding: '16px 28px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={jobSaving} className="dp-btn-primary">
                      {jobSaving ? 'Publishing…' : 'Publish role'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Job list */}
              <div className="dp-card">
                <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="dp-kicker" style={{ marginBottom: 4 }}>Job board</p>
                    <h2 className="dp-serif" style={{ fontSize: 22, fontWeight: 400, color: C.ink }}>Recent postings</h2>
                  </div>
                  <span className="dp-badge dp-badge-neutral">{jobs.length} roles</span>
                </div>
                <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {jobs.length === 0 ? (
                    <div style={{ background: C.surfaceAlt, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '40px', textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
                      No job postings yet — create your first role above.
                    </div>
                  ) : jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="dp-row">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{job.title}</p>
                          <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>{job.location || 'Remote'} · {job.type.replace('_', ' ')}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: C.inkSoft }}>{job.application_count ?? 0} applications</span>
                          <span className={`dp-badge ${job.status === 'active' ? 'dp-badge-green' : 'dp-badge-amber'}`}>{job.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ADMIN VIEW ══ */}
          {user.role === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div className="dp-callout">
                <div className="dp-section-header" style={{ alignItems: 'flex-start' }}>
                  <div style={{ maxWidth: 640 }}>
                    <p className="dp-kicker" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Admin cockpit</p>
                    <h2 className="dp-serif" style={{ fontSize: 28, fontWeight: 400, color: '#fff', marginBottom: 8 }}>Manage the student and company pipeline from one view</h2>
                    <p className="dp-callout-muted" style={{ lineHeight: 1.7 }}>
                      Review student readiness, verify companies, and keep hiring moving with a clear workspace for each workflow.
                    </p>
                  </div>
                  <div className="dp-chip-row">
                    <button type="button" onClick={() => focusAdminExplorer('students')} className="dp-chip" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>Students</button>
                    <button type="button" onClick={() => focusAdminExplorer('companies')} className="dp-chip" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>Companies</button>
                    {adminAnchors.map((anchor) => (
                      <a key={anchor.href} href={anchor.href} className="dp-chip" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                        {anchor.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="dp-mini-grid" style={{ marginTop: 18 }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Students</p>
                    <p className="dp-serif" style={{ fontSize: 26, color: '#fff', fontWeight: 400 }}>{students.length}</p>
                    <p className="dp-callout-muted" style={{ marginTop: 6 }}>Available profiles ready for review.</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Companies</p>
                    <p className="dp-serif" style={{ fontSize: 26, color: '#fff', fontWeight: 400 }}>{companies.length}</p>
                    <p className="dp-callout-muted" style={{ marginTop: 6 }}>{pendingCompanyCount} pending verification.</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Hiring</p>
                    <p className="dp-serif" style={{ fontSize: 26, color: '#fff', fontWeight: 400 }}>{activeJobCount}</p>
                    <p className="dp-callout-muted" style={{ marginTop: 6 }}>Currently active job openings.</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="dp-mini-grid" id="platform-overview">
                <StatCard label="Active students" value={students.length} sub="Available for opportunities" />
                <StatCard label="Registered companies" value={companies.length} sub="In the network" />
                <StatCard label="Verified companies" value={verifiedCompanyCount} sub="Ready for student browsing" />
                <StatCard label="Active roles" value={activeJobCount} sub="Current openings" />
              </div>

              <div id="admin-profile-explorer" className="dp-workflow-card">
                <div className="dp-workflow-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="dp-section-header">
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 4 }}>Profile explorer</p>
                      <h2 className="dp-serif" style={{ fontSize: 24, fontWeight: 400, color: C.ink }}>
                        {adminFilter === 'students' ? 'Student profiles' : 'Company profiles'}
                      </h2>
                    </div>
                    <div className="dp-chip-row">
                      <button type="button" onClick={() => focusAdminExplorer('students')} className={`dp-chip ${adminFilter === 'students' ? 'active' : ''}`}>Students</button>
                      <button type="button" onClick={() => focusAdminExplorer('companies')} className={`dp-chip ${adminFilter === 'companies' ? 'active' : ''}`}>Companies</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <input
                      value={adminQuery}
                      onChange={(e) => setAdminQuery(e.target.value)}
                      placeholder={adminFilter === 'students' ? 'Search by name or email…' : 'Search by company name…'}
                      className="dp-field"
                    />
                    <div className="dp-stat-box" style={{ padding: '10px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                        {adminFilter === 'students' ? filteredStudents.length : filteredCompanies.length} results
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)', gap: 20, alignItems: 'start' }}>
                    <div>
                      <p className="dp-kicker" style={{ marginBottom: 10 }}>{adminFilter === 'students' ? 'Available students' : 'Registered companies'}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {adminFilter === 'students' ? (
                          filteredStudents.length === 0 ? (
                            <div className="dp-empty">No students matched your search.</div>
                          ) : filteredStudents.map((student) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => void openStudentPreview(student.id)}
                              className="dp-row"
                              style={{ textAlign: 'left', borderColor: selectedStudentId === student.id ? C.ink : C.border, background: selectedStudentId === student.id ? '#fafafa' : '#fff' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{student.full_name}</p>
                                  <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>{student.university || 'University not specified'}</p>
                                  <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{student.degree || 'Degree not specified'}</p>
                                </div>
                                <span className={`dp-badge ${student.is_available ? 'dp-badge-green' : 'dp-badge-amber'}`}>
                                  {student.is_available ? 'Available' : 'Busy'}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          filteredCompanies.length === 0 ? (
                            <div className="dp-empty">No companies matched your search.</div>
                          ) : filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => void openCompanyPreview(company.id)}
                              className="dp-row"
                              style={{ textAlign: 'left', borderColor: selectedCompanyId === company.id ? C.ink : C.border, background: selectedCompanyId === company.id ? '#fafafa' : '#fff' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{company.company_name}</p>
                                  <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>{company.industry || 'Industry not specified'}</p>
                                  <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{company.location || 'Location not specified'}</p>
                                </div>
                                <span className={`dp-badge ${company.is_verified ? 'dp-badge-green' : 'dp-badge-amber'}`}>
                                  {company.is_verified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      {previewLoading ? (
                        <div className="dp-empty">Loading profile preview…</div>
                      ) : previewError ? (
                        <div className="dp-empty" style={{ color: C.error }}>{previewError}</div>
                      ) : adminFilter === 'students' ? (
                        selectedStudentProfile ? (
                          <div className="dp-card" style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}` }}>
                              <p className="dp-kicker" style={{ marginBottom: 4 }}>Student profile</p>
                              <h3 className="dp-serif" style={{ fontSize: 24, fontWeight: 400, color: C.ink }}>{selectedStudentProfile.full_name}</h3>
                              <p style={{ fontSize: 13, color: C.inkMid, marginTop: 5 }}>{selectedStudentProfile.email}</p>
                            </div>
                            <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                              <div className="dp-mini-grid">
                                <StatCard label="Profile complete" value={`${profileScore(selectedStudentProfile)}%`} sub="Based on filled fields" />
                                <StatCard label="Skills" value={selectedStudentProfile.skills.length} sub="Tagged skills" />
                              </div>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => navigate('/students')} className="dp-btn-ghost">Open students directory</button>
                              </div>
                              <div className="dp-workflow-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                  <p className="dp-kicker" style={{ marginBottom: 6 }}>Academic details</p>
                                  <div className="dp-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>University: {selectedStudentProfile.university || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Degree: {selectedStudentProfile.degree || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Role goal: {selectedStudentProfile.target_role || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Availability: {selectedStudentProfile.is_available ? 'Available' : 'Unavailable'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="dp-kicker" style={{ marginBottom: 6 }}>Work mode</p>
                                  <div className="dp-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Preferred mode: {selectedStudentProfile.preferred_work_mode || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Location: {selectedStudentProfile.location || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Phone: {selectedStudentProfile.phone || 'Not specified'}</p>
                                    <p style={{ color: C.inkMid, fontSize: 13 }}>Graduation: {selectedStudentProfile.graduation_year || 'Not specified'}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="dp-kicker" style={{ marginBottom: 8 }}>Skills</p>
                                <div className="dp-chip-row">
                                  {selectedStudentProfile.skills.length === 0 ? (
                                    <span className="dp-empty" style={{ padding: '10px 14px', width: '100%', textAlign: 'left' }}>No skills listed.</span>
                                  ) : selectedStudentProfile.skills.map((skill) => (
                                    <span key={skill.id} className="dp-chip">{skill.name}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null
                      ) : selectedCompanyProfile ? (
                        <div className="dp-card" style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}` }}>
                            <p className="dp-kicker" style={{ marginBottom: 4 }}>Company profile</p>
                            <h3 className="dp-serif" style={{ fontSize: 24, fontWeight: 400, color: C.ink }}>{selectedCompanyProfile.company_name}</h3>
                            <p style={{ fontSize: 13, color: C.inkMid, marginTop: 5 }}>{selectedCompanyProfile.industry || 'Industry not specified'} · {selectedCompanyProfile.location || 'Location not specified'}</p>
                          </div>
                          <div className="dp-card-inner" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="dp-mini-grid">
                              <StatCard label="Open roles" value={selectedCompanyJobs.length} sub="Jobs posted by company" />
                              <StatCard label="Status" value={selectedCompanyProfile.is_verified ? 'Verified' : 'Pending'} sub="Visibility state" />
                            </div>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => void handleToggleCompanyVerification(selectedCompanyProfile.id, !selectedCompanyProfile.is_verified)}
                                  className="dp-btn-primary"
                                  disabled={companySavingId === selectedCompanyProfile.id}
                                >
                                  {selectedCompanyProfile.is_verified ? 'Remove verification' : 'Verify company'}
                                </button>
                                <button type="button" onClick={() => navigate('/companies')} className="dp-btn-ghost">Open companies directory</button>
                              </div>
                            <div className="dp-workflow-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                              <div>
                                <p className="dp-kicker" style={{ marginBottom: 6 }}>Overview</p>
                                <div className="dp-row" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <p style={{ color: C.inkMid, fontSize: 13 }}>Tagline: {selectedCompanyProfile.tagline || 'Not specified'}</p>
                                  <p style={{ color: C.inkMid, fontSize: 13 }}>Website: {selectedCompanyProfile.website || 'Not specified'}</p>
                                  <p style={{ color: C.inkMid, fontSize: 13 }}>Size: {selectedCompanyProfile.size || 'Not specified'}</p>
                                  <p style={{ color: C.inkMid, fontSize: 13 }}>LinkedIn: {selectedCompanyProfile.linkedin_url || 'Not specified'}</p>
                                </div>
                              </div>
                              <div>
                                <p className="dp-kicker" style={{ marginBottom: 6 }}>About</p>
                                <div className="dp-row">
                                  <p style={{ color: C.inkMid, fontSize: 13, lineHeight: 1.7 }}>
                                    {selectedCompanyProfile.description || 'No company description available yet.'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="dp-kicker" style={{ marginBottom: 8 }}>Recent roles</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {selectedCompanyJobs.length === 0 ? (
                                  <div className="dp-empty">No roles posted yet.</div>
                                ) : selectedCompanyJobs.slice(0, 3).map((job) => (
                                  <div key={job.id} className="dp-row">
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                      <div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{job.title}</p>
                                        <p style={{ fontSize: 13, color: C.inkMid, marginTop: 3 }}>{job.location || 'Remote'}</p>
                                      </div>
                                      <span className={`dp-badge ${job.status === 'active' ? 'dp-badge-green' : 'dp-badge-amber'}`}>{job.status}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}
