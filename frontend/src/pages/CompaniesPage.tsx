import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getCompanies, getOwnCompanyProfile } from '../api/companies'
import { createJob, getJob, getJobs, updateJob } from '../api/jobs'
import { updateCompanyProfile } from '../api/companies'
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

// ─── Shared design tokens ────────────────────────────────────────────────────
const C = {
  ink: '#18181b',
  inkMid: '#52525b',
  inkSoft: '#a1a1aa',
  surface: '#ffffff',
  surfaceAlt: '#f4f4f5',
  border: '#e4e4e7',
  borderHover: '#18181b',
  accent: '#18181b',
  accentText: '#ffffff',
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  error: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Instrument+Sans:wght@300;400;500;600&display=swap');

  .cp-root { font-family: 'Instrument Sans', sans-serif; background: #f4f4f5; min-height: 100vh; }
  .cp-serif { font-family: 'Playfair Display', Georgia, serif; }

  .cp-field {
    width: 100%; padding: 10px 14px; font-family: 'Instrument Sans', sans-serif;
    font-size: 14px; background: #ffffff; border: 1px solid #e4e4e7;
    border-radius: 8px; color: #18181b; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    appearance: none;
  }
  .cp-field:focus { border-color: #18181b; box-shadow: 0 0 0 3px rgba(24,24,27,0.06); }
  .cp-field::placeholder { color: #a1a1aa; }

  .cp-card {
    background: #ffffff; border: 1px solid #e4e4e7;
    border-radius: 16px; overflow: hidden;
  }
  .cp-card-inner { padding: 28px; }

  .cp-label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #a1a1aa; margin-bottom: 6px;
  }
  .cp-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 400; color: #18181b; margin: 0;
  }
  .cp-kicker {
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: #a1a1aa;
  }
  .cp-btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; background: #18181b; color: #ffffff;
    font-family: 'Instrument Sans', sans-serif; font-size: 13px;
    font-weight: 600; letter-spacing: 0.04em; border: none;
    border-radius: 8px; cursor: pointer; transition: opacity 0.15s;
    white-space: nowrap;
  }
  .cp-btn-primary:hover { opacity: 0.82; }
  .cp-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .cp-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 18px; background: transparent; color: #18181b;
    font-family: 'Instrument Sans', sans-serif; font-size: 13px;
    font-weight: 500; border: 1px solid #e4e4e7;
    border-radius: 8px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .cp-btn-ghost:hover { border-color: #18181b; background: #f4f4f5; }
  .cp-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

  .cp-badge {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
  }
  .cp-badge-neutral { background: #f4f4f5; color: #52525b; }
  .cp-badge-green { background: #f0fdf4; color: #16a34a; }
  .cp-badge-amber { background: #fffbeb; color: #d97706; }

  .cp-stat-box {
    background: #f4f4f5; border-radius: 10px; padding: 16px 18px;
  }

  .cp-job-row {
    background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px;
    padding: 20px 24px; transition: box-shadow 0.15s, transform 0.15s;
  }
  .cp-job-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }

  .cp-company-card {
    background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px;
    padding: 24px; transition: box-shadow 0.15s, transform 0.15s;
  }
  .cp-company-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); transform: translateY(-2px); }

  .cp-divider { height: 1px; background: #e4e4e7; margin: 0; }

  .cp-nav-link {
    display: block; padding: 10px 14px; border-radius: 8px; font-size: 13px;
    font-weight: 500; color: #52525b; text-decoration: none;
    transition: background 0.12s, color 0.12s;
  }
  .cp-nav-link:hover { background: #f4f4f5; color: #18181b; }

  .cp-header-band {
    background: #18181b; color: #fff; padding: 40px 48px 36px;
  }

  .cp-search-wrap { position: relative; }
  .cp-search-wrap input { padding-left: 36px !important; }
  .cp-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    width: 16px; height: 16px; color: #a1a1aa; pointer-events: none;
  }
`

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select industry' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'media', label: 'Media' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
]

const SIZE_OPTIONS = [
  { value: '', label: 'Select company size' },
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '500+', label: '500+' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="cp-label">{label}</label>
      {children}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="cp-stat-box">
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{value}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    tagline: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    location: '',
    linkedin_url: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [jobForm, setJobForm] = useState<JobFormPayload>(initialJobForm)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentJobTitle = useMemo(() => (isEditing ? 'Edit role' : 'Create new role'), [isEditing])

  const companyStats = useMemo(() => [
    { label: 'Open roles', value: jobs.length.toString() },
    { label: 'Company mode', value: user?.role === 'company' ? 'Active' : 'Browse' },
    { label: 'Profile status', value: companyProfile?.company_name ? 'Complete' : 'Draft' },
  ], [companyProfile?.company_name, jobs.length, user?.role])

  const verifiedCompanies = useMemo(() => companies.filter((c) => c.is_verified), [companies])

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return companies
    return companies.filter((c) =>
      [c.company_name, c.industry ?? '', c.location ?? ''].join(' ').toLowerCase().includes(q)
    )
  }, [companies, searchQuery])

  useEffect(() => {
    async function loadCompanies() {
      setError(null); setLoading(true); setSuccessMessage(null)
      try {
        if (user?.role === 'company') {
          const [profile, jobsData] = await Promise.all([getOwnCompanyProfile(), getJobs()])
          setCompanyProfile(profile)
          setProfileForm({
            company_name: profile.company_name ?? '',
            tagline: profile.tagline ?? '',
            description: profile.description ?? '',
            industry: profile.industry ?? '',
            size: profile.size ?? '',
            website: profile.website ?? '',
            location: profile.location ?? '',
            linkedin_url: profile.linkedin_url ?? '',
          })
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
    setError(null); setSaving(true)
    try {
      const job = await getJob(jobId)
      setSelectedJobId(jobId); setIsEditing(true)
      setJobForm({
        title: job.title, description: job.description,
        requirements: job.requirements || '', responsibilities: job.responsibilities || '',
        location: job.location || '', type: job.type || 'full_time',
        status: job.status || 'active', stipend_min: job.stipend_min ?? null,
        stipend_max: job.stipend_max ?? null, duration_months: job.duration_months ?? null,
        openings: job.openings ?? 1, deadline: job.deadline || null, skill_ids: [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load job')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setSelectedJobId(null); setIsEditing(false)
    setJobForm(initialJobForm); setSuccessMessage(null)
  }

  function setFormValue<K extends keyof JobFormPayload>(key: K, value: JobFormPayload[K]) {
    setJobForm((cur) => ({ ...cur, [key]: value }))
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccessMessage(null); setProfileSaving(true)
    try {
      const updated = await updateCompanyProfile(profileForm)
      setCompanyProfile(updated)
      setSuccessMessage('Company profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save company profile')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccessMessage(null); setSaving(true)
    try {
      const payload = { ...jobForm }
      const response: JobDetail = isEditing && selectedJobId
        ? await updateJob(selectedJobId, payload)
        : await createJob(payload)
      const updatedJobs = isEditing
        ? jobs.map((j) => (j.id === response.id ? response : j))
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>

      <div className="cp-root">
        {/* ── Page Header ── */}
        <div className="cp-header-band">
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <p className="cp-kicker" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
                  {user?.role === 'company' ? 'Employer workspace' : 'Company directory'}
                </p>
                <h1 className="cp-serif" style={{ fontSize: 36, fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1.15 }}>
                  {user?.role === 'company'
                    ? (companyProfile?.company_name || 'Employer dashboard')
                    : 'Verified employers'}
                </h1>
                <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 300, maxWidth: 480 }}>
                  {user?.role === 'company'
                    ? 'Manage your profile, open roles, and job board from one focused workspace.'
                    : 'Browse employer profiles, compare industries, and discover where you want to intern.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {companyStats.map((s) => (
                  <div key={s.label} style={{ borderLeft: '1px solid rgba(255,255,255,0.18)', paddingLeft: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 64px' }}>

          {/* Alerts */}
          {error && (
            <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: 10, padding: '12px 18px', color: C.error, fontSize: 14, marginBottom: 24 }}>
              {error}
            </div>
          )}
          {successMessage && (
            <div style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: 10, padding: '12px 18px', color: C.success, fontSize: 14, marginBottom: 24 }}>
              {successMessage}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: C.inkSoft, fontSize: 14 }}>
              Loading…
            </div>

          ) : user?.role === 'company' ? (
            /* ══ COMPANY VIEW ══ */
            <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>

              {/* Left sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

                {/* Profile summary card */}
                <div className="cp-card">
                  <div className="cp-card-inner">
                    <p className="cp-kicker" style={{ marginBottom: 8 }}>Company summary</p>
                    <h2 className="cp-serif cp-section-title" style={{ fontSize: 22 }}>{companyProfile?.company_name || 'Your company'}</h2>
                    {companyProfile?.tagline && (
                      <p style={{ marginTop: 6, fontSize: 13, color: C.inkMid, fontStyle: 'italic' }}>{companyProfile.tagline}</p>
                    )}
                    <p style={{ marginTop: 10, fontSize: 13, color: C.inkMid, lineHeight: 1.65 }}>
                      {companyProfile?.description || 'Keep your company profile updated so students can trust your listings.'}
                    </p>
                    <div className="cp-divider" style={{ margin: '18px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <StatBox label="Industry" value={companyProfile?.industry || 'Not set'} />
                      <StatBox label="Location" value={companyProfile?.location || 'Not set'} />
                    </div>
                  </div>
                </div>

                {/* Quick nav */}
                <div className="cp-card">
                  <div className="cp-card-inner">
                    <p className="cp-kicker" style={{ marginBottom: 12 }}>Navigation</p>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[['Company profile', '#company-profile'], ['Role editor', '#job-form'], ['Role board', '#job-board']].map(([label, href]) => (
                        <a key={href} href={href} className="cp-nav-link">{label}</a>
                      ))}
                    </nav>
                    <div className="cp-divider" style={{ margin: '16px 0' }} />
                    <p style={{ fontSize: 12, color: C.inkMid, lineHeight: 1.7 }}>
                      Clear job copy and a complete profile produce the best student matches.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right main area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Profile editor ── */}
                <div id="company-profile" className="cp-card">
                  <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="cp-kicker" style={{ marginBottom: 4 }}>Company profile editor</p>
                      <h2 className="cp-serif cp-section-title" style={{ fontSize: 22 }}>Update your details</h2>
                    </div>
                    <span className="cp-badge cp-badge-neutral">Profile</span>
                  </div>

                  <form onSubmit={handleProfileSubmit}>
                    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <FieldGroup label="Company name">
                        <input value={profileForm.company_name} onChange={(e) => setProfileForm((c) => ({ ...c, company_name: e.target.value }))} className="cp-field" required />
                      </FieldGroup>
                      <FieldGroup label="Tagline">
                        <input value={profileForm.tagline} onChange={(e) => setProfileForm((c) => ({ ...c, tagline: e.target.value }))} className="cp-field" placeholder="Short employer pitch" />
                      </FieldGroup>
                      <FieldGroup label="Description">
                        <textarea value={profileForm.description} onChange={(e) => setProfileForm((c) => ({ ...c, description: e.target.value }))} className="cp-field" rows={4} placeholder="Tell students about your mission, culture, and what you're building." style={{ resize: 'vertical' }} />
                      </FieldGroup>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Industry">
                          <select value={profileForm.industry} onChange={(e) => setProfileForm((c) => ({ ...c, industry: e.target.value }))} className="cp-field">
                            {INDUSTRY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </FieldGroup>
                        <FieldGroup label="Company size">
                          <select value={profileForm.size} onChange={(e) => setProfileForm((c) => ({ ...c, size: e.target.value }))} className="cp-field">
                            {SIZE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </FieldGroup>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Website">
                          <input value={profileForm.website} onChange={(e) => setProfileForm((c) => ({ ...c, website: e.target.value }))} className="cp-field" />
                        </FieldGroup>
                        <FieldGroup label="LinkedIn URL">
                          <input value={profileForm.linkedin_url} onChange={(e) => setProfileForm((c) => ({ ...c, linkedin_url: e.target.value }))} className="cp-field" />
                        </FieldGroup>
                      </div>
                      <FieldGroup label="Location">
                        <input value={profileForm.location} onChange={(e) => setProfileForm((c) => ({ ...c, location: e.target.value }))} className="cp-field" />
                      </FieldGroup>
                    </div>
                    <div style={{ padding: '16px 28px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <p style={{ fontSize: 13, color: C.inkSoft }}>These fields appear on your company card and help students decide whether to apply.</p>
                      <button type="submit" disabled={profileSaving} className="cp-btn-primary">
                        {profileSaving ? 'Saving…' : 'Save profile'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Job form ── */}
                <div id="job-form" className="cp-card">
                  <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="cp-kicker" style={{ marginBottom: 4 }}>{currentJobTitle}</p>
                      <h2 className="cp-serif cp-section-title" style={{ fontSize: 22 }}>{isEditing ? 'Edit job posting' : 'Create job posting'}</h2>
                    </div>
                    <button type="button" onClick={resetForm} className="cp-btn-ghost">New job</button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Job title">
                          <input value={jobForm.title} onChange={(e) => setFormValue('title', e.target.value)} required className="cp-field" placeholder="Frontend Engineer Intern" />
                        </FieldGroup>
                        <FieldGroup label="Location">
                          <input value={jobForm.location} onChange={(e) => setFormValue('location', e.target.value)} className="cp-field" placeholder="Remote, Bangalore, Hybrid…" />
                        </FieldGroup>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Type">
                          <select value={jobForm.type} onChange={(e) => setFormValue('type', e.target.value)} className="cp-field">
                            <option value="full_time">Full time</option>
                            <option value="part_time">Part time</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="on_site">On site</option>
                          </select>
                        </FieldGroup>
                        <FieldGroup label="Status">
                          <select value={jobForm.status} onChange={(e) => setFormValue('status', e.target.value)} className="cp-field">
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="paused">Paused</option>
                            <option value="closed">Closed</option>
                          </select>
                        </FieldGroup>
                      </div>

                      <FieldGroup label="Description">
                        <textarea value={jobForm.description} onChange={(e) => setFormValue('description', e.target.value)} required className="cp-field" rows={5} placeholder="Describe the scope, expectations, and what students will learn." style={{ resize: 'vertical' }} />
                      </FieldGroup>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Stipend min">
                          <input type="number" min={0} value={jobForm.stipend_min ?? ''} onChange={(e) => setFormValue('stipend_min', e.target.value ? Number(e.target.value) : null)} className="cp-field" />
                        </FieldGroup>
                        <FieldGroup label="Stipend max">
                          <input type="number" min={0} value={jobForm.stipend_max ?? ''} onChange={(e) => setFormValue('stipend_max', e.target.value ? Number(e.target.value) : null)} className="cp-field" />
                        </FieldGroup>
                        <FieldGroup label="Duration (months)">
                          <input type="number" min={0} value={jobForm.duration_months ?? ''} onChange={(e) => setFormValue('duration_months', e.target.value ? Number(e.target.value) : null)} className="cp-field" />
                        </FieldGroup>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Openings">
                          <input type="number" min={1} value={jobForm.openings ?? ''} onChange={(e) => setFormValue('openings', Number(e.target.value) || 1)} className="cp-field" />
                        </FieldGroup>
                        <FieldGroup label="Deadline">
                          <input type="date" value={jobForm.deadline ?? ''} onChange={(e) => setFormValue('deadline', e.target.value || null)} className="cp-field" />
                        </FieldGroup>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <FieldGroup label="Responsibilities">
                          <textarea value={jobForm.responsibilities} onChange={(e) => setFormValue('responsibilities', e.target.value)} className="cp-field" rows={5} placeholder="List the core responsibilities." style={{ resize: 'vertical' }} />
                        </FieldGroup>
                        <FieldGroup label="Requirements">
                          <textarea value={jobForm.requirements} onChange={(e) => setFormValue('requirements', e.target.value)} className="cp-field" rows={5} placeholder="List must-have skills or experience." style={{ resize: 'vertical' }} />
                        </FieldGroup>
                      </div>
                    </div>

                    <div style={{ padding: '16px 28px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <p style={{ fontSize: 13, color: C.inkSoft }}>Clear job fields produce better matches and reduce back-and-forth with students.</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={resetForm} disabled={saving} className="cp-btn-ghost">Reset</button>
                        <button type="submit" disabled={saving} className="cp-btn-primary">
                          {saving ? 'Saving…' : isEditing ? 'Update job' : 'Create job'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* ── Job board ── */}
                <div id="job-board">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p className="cp-kicker" style={{ marginBottom: 4 }}>Job board</p>
                      <h2 className="cp-serif cp-section-title">Your open roles</h2>
                    </div>
                    <span className="cp-badge cp-badge-neutral">{jobs.length} roles</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {jobs.length === 0 ? (
                      <div style={{ background: C.surfaceAlt, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '40px 28px', textAlign: 'center', color: C.inkSoft, fontSize: 14 }}>
                        No job postings yet — create the first one above.
                      </div>
                    ) : jobs.map((job) => (
                      <div key={job.id} className="cp-job-row">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>{job.title}</p>
                            <p style={{ marginTop: 4, fontSize: 13, color: C.inkMid }}>
                              {job.location || 'Remote'} · {job.type.replace('_', ' ')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="cp-badge cp-badge-neutral">{job.status}</span>
                            <button type="button" onClick={() => void handleSelectJob(job.id)} className="cp-btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>
                              Edit
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                          {[
                            job.stipend_min || job.stipend_max ? `₹${job.stipend_min ?? 0}–${job.stipend_max ?? 0} stipend` : 'Stipend TBD',
                            job.duration_months ? `${job.duration_months} months` : 'Duration TBD',
                            job.deadline ? `Deadline ${job.deadline}` : 'No deadline',
                          ].map((tag) => (
                            <span key={tag} style={{ fontSize: 12, color: C.inkMid, background: C.surfaceAlt, borderRadius: 6, padding: '3px 10px' }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : companies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: C.inkSoft, fontSize: 14 }}>
              No employers are available right now.
            </div>

          ) : (
            /* ══ STUDENT / BROWSE VIEW ══ */
            <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>

              {/* Sidebar */}
              <div className="cp-card" style={{ position: 'sticky', top: 24 }}>
                <div className="cp-card-inner">
                  <p className="cp-kicker" style={{ marginBottom: 6 }}>Browse</p>
                  <h2 className="cp-serif cp-section-title" style={{ fontSize: 20 }}>Employers</h2>
                  <p style={{ marginTop: 8, fontSize: 13, color: C.inkMid, lineHeight: 1.65 }}>
                    Search by name, industry, or city.
                  </p>

                  <div className="cp-search-wrap" style={{ marginTop: 18 }}>
                    <svg className="cp-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="8.5" cy="8.5" r="5.5" /><path d="M15 15l-3-3" strokeLinecap="round" />
                    </svg>
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Company, industry, city…" className="cp-field" />
                  </div>

                  <div className="cp-divider" style={{ margin: '20px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <StatBox label="Total companies" value={companies.length.toString()} />
                    <StatBox label="Verified" value={verifiedCompanies.length.toString()} />
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <p className="cp-kicker" style={{ marginBottom: 4 }}>Directory</p>
                    <h2 className="cp-serif cp-section-title">Browse employers</h2>
                  </div>
                  <span className="cp-badge cp-badge-neutral">{filteredCompanies.length} shown</span>
                </div>

                {filteredCompanies.length === 0 ? (
                  <div style={{ background: C.surfaceAlt, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '48px 28px', textAlign: 'center', color: C.inkSoft, fontSize: 14 }}>
                    No companies match your search.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                    {filteredCompanies.map((company) => (
                      <div key={company.id} className="cp-company-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 17, fontWeight: 600, color: C.ink, margin: 0 }}>{company.company_name}</h3>
                            <p style={{ marginTop: 5, fontSize: 13, color: C.inkMid }}>
                              {company.industry || 'Industry not set'} · {company.location || 'Location not set'}
                            </p>
                          </div>
                          <span className={`cp-badge ${company.is_verified ? 'cp-badge-green' : 'cp-badge-amber'}`}>
                            {company.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        <div style={{ marginTop: 16, background: C.surfaceAlt, borderRadius: 10, padding: '14px 16px' }}>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6 }}>Profile</p>
                          <p style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.6 }}>
                            {company.is_verified
                              ? 'Verified employer listed for student browsing.'
                              : 'Profile pending verification for student visibility.'}
                          </p>
                        </div>

                        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 12, background: C.surfaceAlt, color: C.inkMid, borderRadius: 6, padding: '4px 10px' }}>
                            {company.industry || 'General'}
                          </span>
                          <span style={{ fontSize: 12, background: C.surfaceAlt, color: C.inkMid, borderRadius: 6, padding: '4px 10px' }}>
                            {company.location || 'Location not set'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
