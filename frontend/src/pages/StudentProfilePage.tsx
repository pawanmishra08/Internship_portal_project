import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSkills } from '../api/skills'
import { getStudentProfile, updateStudentProfile } from '../api/students'
import type { EducationPreference, ProjectEntry, Skill, StudentProfile, StudentProfilePayload } from '../types/api'

const degreeOptions = ['bachelor', 'master', 'phd', 'diploma', 'other']
const workModeOptions = ['remote', 'hybrid', 'on-site', 'flexible']

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function StudentProfilePage() {
  const { status, user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [degreePreferences, setDegreePreferences] = useState<EducationPreference[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [skillQuery, setSkillQuery] = useState('')
  const [form, setForm] = useState<StudentProfilePayload>({
    bio: '',
    phone: '',
    location: '',
    university: '',
    degree: '',
    field_of_study: '',
    target_role: '',
    preferred_work_mode: '',
    graduation_year: null,
    gpa: null,
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    available_from: null,
    is_available: true,
    skill_ids: [],
  })
  const [resumeInputKey, setResumeInputKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const skillsByCategory = useMemo(() => {
    const normalizedQuery = skillQuery.trim().toLowerCase()
    const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
      const category = skill.category?.trim() || 'General'
      if (normalizedQuery) {
        const matchesName = skill.name.toLowerCase().includes(normalizedQuery)
        const matchesCategory = category.toLowerCase().includes(normalizedQuery)
        if (!matchesName && !matchesCategory) {
          return acc
        }
      }

      if (!acc[category]) {
        acc[category] = []
      }

      acc[category].push(skill)
      return acc
    }, {})

    return Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right))
  }, [skillQuery, skills])

  const selectedSkillNames = useMemo(
    () => skills.filter((skill) => selectedSkills.includes(skill.id)).map((skill) => skill.name),
    [selectedSkills, skills],
  )

  const profileCompletion = useMemo(() => {
    const checks = [
      profile?.bio || form.bio,
      profile?.phone || form.phone,
      profile?.location || form.location,
      profile?.university || form.university,
      profile?.degree || form.degree,
      profile?.field_of_study || form.field_of_study,
      profile?.target_role || form.target_role,
      profile?.preferred_work_mode || form.preferred_work_mode,
      profile?.graduation_year ?? form.graduation_year,
      profile?.gpa ?? form.gpa,
      profile?.resume_url || resumeFile,
      selectedSkills.length > 0,
      degreePreferences.length > 0,
      projects.length > 0,
      form.linkedin_url,
      form.github_url,
      form.portfolio_url,
      form.available_from,
    ]

    const filled = checks.filter(Boolean).length
    const total = checks.length

    return {
      filled,
      total,
      percent: Math.round((filled / total) * 100),
    }
  }, [degreePreferences.length, form, profile, projects.length, resumeFile, selectedSkills.length])

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'student') {
      return
    }

    async function loadProfile() {
      setLoading(true)
      setError(null)
      try {
        const [studentProfile, skillOptions] = await Promise.all([
          getStudentProfile(),
          getSkills(),
        ])

        setProfile(studentProfile)
        setSelectedSkills(studentProfile.skills.map((skill) => skill.id))
        setDegreePreferences(studentProfile.degree_preferences ?? [])
        setProjects(studentProfile.projects ?? [])
        setForm({
          bio: studentProfile.bio ?? '',
          phone: studentProfile.phone ?? '',
          location: studentProfile.location ?? '',
          university: studentProfile.university ?? '',
          degree: studentProfile.degree ?? '',
          field_of_study: studentProfile.field_of_study ?? '',
          target_role: studentProfile.target_role ?? '',
          preferred_work_mode: studentProfile.preferred_work_mode ?? '',
          graduation_year: studentProfile.graduation_year ?? null,
          gpa: studentProfile.gpa ?? null,
          linkedin_url: studentProfile.linkedin_url ?? '',
          github_url: studentProfile.github_url ?? '',
          portfolio_url: studentProfile.portfolio_url ?? '',
          available_from: studentProfile.available_from ?? null,
          is_available: studentProfile.is_available,
          skill_ids: studentProfile.skills.map((skill) => skill.id),
        })
        setResumeFile(null)
        setResumeInputKey((current) => current + 1)
        setSkills(skillOptions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [status, user?.role])

  if (status === 'loading') {
    return (
      <div className="page-shell flex items-center justify-center">
        <p style={{ color: '#888780' }}>Restoring session…</p>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/auth" replace />
  }

  if (user?.role !== 'student') {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSaving(true)

    try {
      const basePayload: StudentProfilePayload = {
        ...form,
        skill_ids: selectedSkills,
        degree_preferences: degreePreferences,
        projects,
      }

      const payload = resumeFile
        ? (() => {
            const formData = new FormData()

            Object.entries(basePayload).forEach(([key, value]) => {
              if (value === undefined || value === null || value === '') {
                return
              }

              if (Array.isArray(value)) {
                if (key === 'skill_ids') {
                  value.forEach((item) => formData.append(key, String(item)))
                  return
                }

                formData.append(key, JSON.stringify(value))
                return
              }

              formData.append(key, String(value))
            })

            formData.append('resume', resumeFile)
            return formData
          })()
        : basePayload

      const updatedProfile = await updateStudentProfile(payload)
      console.debug('Updated profile response:', updatedProfile)
      setProfile(updatedProfile)
      setResumeFile(null)
      setResumeInputKey((current) => current + 1)
      setSuccessMessage('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof StudentProfilePayload>(key: K, value: StudentProfilePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleSkill(skillId: number) {
    setSelectedSkills((current) => {
      const next = current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId]
      setForm((cur) => ({ ...cur, skill_ids: next }))
      return next
    })
  }

  function toggleCategorySkills(categorySkills: Skill[]) {
    const categoryIds = categorySkills.map((skill) => skill.id)
    const allSelected = categoryIds.every((id) => selectedSkills.includes(id))
    const next = allSelected
      ? selectedSkills.filter((id) => !categoryIds.includes(id))
      : Array.from(new Set([...selectedSkills, ...categoryIds]))

    setSelectedSkills(next)
    setForm((current) => ({ ...current, skill_ids: next }))
  }

  function clearAllSkills() {
    setSelectedSkills([])
    setForm((current) => ({ ...current, skill_ids: [] }))
  }

  function addDegreePreference(level: 'bachelor' | 'master') {
    setDegreePreferences((current) => [
      ...current,
      {
        id: createEntryId(),
        level,
        institution: '',
        field_of_study: '',
        graduation_year: null,
        gpa: null,
      },
    ])
  }

  function updateDegreePreference(id: string, key: keyof EducationPreference, value: string | number | null) {
    setDegreePreferences((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)))
  }

  function removeDegreePreference(id: string) {
    setDegreePreferences((current) => current.filter((entry) => entry.id !== id))
  }

  function addProject() {
    setProjects((current) => [
      ...current,
      {
        id: createEntryId(),
        title: '',
        description: '',
        technologies: '',
        link: '',
        year: '',
      },
    ])
  }

  function updateProject(id: string, key: keyof ProjectEntry, value: string) {
    setProjects((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)))
  }

  function removeProject(id: string) {
    setProjects((current) => current.filter((entry) => entry.id !== id))
  }

  return (
    <div className="page-shell">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="page-kicker">Profile</p>
          <h1 className="page-title">Student profile</h1>
          <p className="page-subtitle">Update your availability, experience, and profile details for companies to discover.</p>
        </div>

        {error && <div className="rounded-xl p-4 mb-6" style={{ color: '#a32d2d', background: '#fcebeb', border: '0.5px solid #f09595' }}>{error}</div>}
        {successMessage && <div className="rounded-xl p-4 mb-6" style={{ color: '#1f7a52', background: '#e8f4ed', border: '0.5px solid #9ccfb4' }}>{successMessage}</div>}

        {loading ? (
          <div className="card p-10 text-center" style={{ color: '#888780' }}>Loading profile…</div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="card space-y-6">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Profile basics</h2>
                  <p className="mt-1 text-sm" style={{ color: '#888780' }}>Keep your academic and contact details current.</p>
                </div>

                <div id="profile-basics" className="grid gap-6 sm:grid-cols-2 scroll-mt-24">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full name</label>
                    <input disabled value={profile?.full_name || ''} className="input-field bg-slate-100 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input disabled value={profile?.email || ''} className="input-field bg-slate-100 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
                  <textarea
                    value={form.bio ?? ''}
                    onChange={(event) => setField('bio', event.target.value)}
                    className="input-field min-h-[120px]"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">University</label>
                    <input value={form.university ?? ''} onChange={(event) => setField('university', event.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Field of study</label>
                    <input value={form.field_of_study ?? ''} onChange={(event) => setField('field_of_study', event.target.value)} className="input-field" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Target role</label>
                    <input
                      value={form.target_role ?? ''}
                      onChange={(event) => setField('target_role', event.target.value)}
                      className="input-field"
                      placeholder="e.g. Frontend Intern, Data Analyst"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred work mode</label>
                    <select
                      value={form.preferred_work_mode ?? ''}
                      onChange={(event) => setField('preferred_work_mode', event.target.value)}
                      className="input-field"
                    >
                      <option value="">Select preference</option>
                      {workModeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Degree</label>
                    <select value={form.degree ?? ''} onChange={(event) => setField('degree', event.target.value)} className="input-field">
                      <option value="">Select degree</option>
                      {degreeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Graduation year</label>
                    <input type="number" min={1930} max={2100} value={form.graduation_year ?? ''} onChange={(event) => setField('graduation_year', event.target.value ? Number(event.target.value) : null)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">GPA</label>
                    <input type="number" step="0.01" min={0} max={4} value={form.gpa ?? ''} onChange={(event) => setField('gpa', event.target.value ? Number(event.target.value) : null)} className="input-field" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input value={form.phone ?? ''} onChange={(event) => setField('phone', event.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <input value={form.location ?? ''} onChange={(event) => setField('location', event.target.value)} className="input-field" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn</label>
                    <input value={form.linkedin_url ?? ''} onChange={(event) => setField('linkedin_url', event.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">GitHub</label>
                    <input value={form.github_url ?? ''} onChange={(event) => setField('github_url', event.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio</label>
                    <input value={form.portfolio_url ?? ''} onChange={(event) => setField('portfolio_url', event.target.value)} className="input-field" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Available from</label>
                    <input type="date" value={form.available_from ?? ''} onChange={(event) => setField('available_from', event.target.value || null)} className="input-field" />
                  </div>
                  <div className="flex items-center gap-3 rounded-md border px-4 py-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <input
                      id="available"
                      type="checkbox"
                      checked={form.is_available ?? true}
                      onChange={(event) => setField('is_available', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    <label htmlFor="available" className="text-sm font-semibold text-slate-700">Available for opportunities</label>
                  </div>
                </div>

                <div id="education" className="rounded-2xl border p-5 space-y-4 scroll-mt-24" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: '#1a1a18' }}>Education preferences</h3>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>Add Bachelor or Master details one at a time.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-outline px-3 py-2 text-[11px]" onClick={() => addDegreePreference('bachelor')}>
                        Add bachelor
                      </button>
                      <button type="button" className="btn-outline px-3 py-2 text-[11px]" onClick={() => addDegreePreference('master')}>
                        Add master
                      </button>
                    </div>
                  </div>

                  {degreePreferences.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm" style={{ color: '#888780', borderColor: 'var(--color-border)' }}>
                      No education preferences added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {degreePreferences.map((entry, index) => (
                        <div key={entry.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: '#fdfdfc' }}>
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Entry {index + 1}</p>
                              <h4 className="mt-1 text-sm font-semibold capitalize" style={{ color: '#1a1a18' }}>{entry.level}</h4>
                            </div>
                            <button type="button" className="btn-outline px-3 py-2 text-[11px]" onClick={() => removeDegreePreference(entry.id)}>
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Institution</label>
                              <input
                                value={entry.institution}
                                onChange={(event) => updateDegreePreference(entry.id, 'institution', event.target.value)}
                                className="input-field"
                                placeholder="e.g. University of Lagos"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Field of study</label>
                              <input
                                value={entry.field_of_study}
                                onChange={(event) => updateDegreePreference(entry.id, 'field_of_study', event.target.value)}
                                className="input-field"
                                placeholder="e.g. Computer Science"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3 mt-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Graduation year</label>
                              <input
                                type="number"
                                min={1930}
                                max={2100}
                                value={entry.graduation_year ?? ''}
                                onChange={(event) => updateDegreePreference(entry.id, 'graduation_year', event.target.value ? Number(event.target.value) : null)}
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">GPA</label>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={4}
                                value={entry.gpa ?? ''}
                                onChange={(event) => updateDegreePreference(entry.id, 'gpa', event.target.value ? Number(event.target.value) : null)}
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
                              <input value={entry.level} disabled className="input-field bg-slate-100 text-slate-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div id="projects" className="rounded-2xl border p-5 space-y-4 scroll-mt-24" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: '#1a1a18' }}>Projects</h3>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>Showcase projects you have built or shipped.</p>
                    </div>
                    <button type="button" className="btn-outline px-3 py-2 text-[11px]" onClick={addProject}>
                      Add project
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm" style={{ color: '#888780', borderColor: 'var(--color-border)' }}>
                      No projects added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project, index) => (
                        <div key={project.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: '#fdfdfc' }}>
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Project {index + 1}</p>
                              <h4 className="mt-1 text-sm font-semibold" style={{ color: '#1a1a18' }}>{project.title || 'Untitled project'}</h4>
                            </div>
                            <button type="button" className="btn-outline px-3 py-2 text-[11px]" onClick={() => removeProject(project.id)}>
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                              <input value={project.title} onChange={(event) => updateProject(project.id, 'title', event.target.value)} className="input-field" placeholder="e.g. Student Internship Tracker" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                              <input value={project.year} onChange={(event) => updateProject(project.id, 'year', event.target.value)} className="input-field" placeholder="e.g. 2026" />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                            <textarea value={project.description} onChange={(event) => updateProject(project.id, 'description', event.target.value)} className="input-field min-h-[96px]" placeholder="What did you build and why did it matter?" />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 mt-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Technologies</label>
                              <input value={project.technologies} onChange={(event) => updateProject(project.id, 'technologies', event.target.value)} className="input-field" placeholder="React, Django, PostgreSQL" />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">Link</label>
                              <input value={project.link} onChange={(event) => updateProject(project.id, 'link', event.target.value)} className="input-field" placeholder="https://github.com/..." />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-6 lg:sticky lg:top-6 self-start">
                <section className="card space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Career preferences</h2>
                    <p className="mt-1 text-sm" style={{ color: '#888780' }}>These are the fields recruiters use to understand your fit quickly.</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                      <div className="text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Target role</div>
                      <div className="mt-1 font-medium" style={{ color: '#1a1a18' }}>{form.target_role || 'Not set'}</div>
                    </div>
                    <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                      <div className="text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Preferred work mode</div>
                      <div className="mt-1 font-medium" style={{ color: '#1a1a18' }}>{form.preferred_work_mode || 'Not set'}</div>
                    </div>
                  </div>
                </section>

                <section className="card space-y-4">
                  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                    <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Quick navigation</div>
                    <div className="mt-3 grid gap-2">
                      {[
                        ['profile-basics', 'Profile basics'],
                        ['education', 'Education'],
                        ['projects', 'Projects'],
                        ['skills', 'Skills'],
                        ['resume', 'Resume'],
                      ].map(([id, label]) => (
                        <a
                          key={id}
                          href={`#${id}`}
                          className="rounded-xl border px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                          style={{ borderColor: 'var(--color-border)', color: '#1a1a18' }}
                        >
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Profile completion</h2>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>A quick snapshot of how complete your profile is.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl" style={{ fontFamily: 'DM Serif Display, serif', color: '#1a1a18' }}>{profileCompletion.percent}%</div>
                      <div className="text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>
                        {profileCompletion.filled}/{profileCompletion.total} items
                      </div>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full" style={{ background: '#e8e8e4' }}>
                    <div className="h-full rounded-full" style={{ width: `${profileCompletion.percent}%`, background: '#1a1a18' }} />
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedSkills.length > 0 ? (
                      <span className="badge-success">Skills added</span>
                    ) : (
                      <span className="badge-warning">Add skills</span>
                    )}
                    {profile?.resume_url || resumeFile ? (
                      <span className="badge-success">Resume ready</span>
                    ) : (
                      <span className="badge-warning">Upload resume</span>
                    )}
                  </div>
                </section>

                <section id="resume" className="card space-y-4 scroll-mt-24">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Resume</h2>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>Upload a current CV so companies can review it with your profile.</p>
                    </div>
                    {profile?.resume_url && (
                      <a href={profile.resume_url} target="_blank" rel="noreferrer" className="btn-outline px-3 py-2 text-[11px]">
                        View current
                      </a>
                    )}
                  </div>

                  <label className="block rounded-xl border border-dashed px-4 py-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                    <span className="block text-sm font-semibold" style={{ color: '#1a1a18' }}>Replace resume</span>
                    <span className="block mt-1 text-sm" style={{ color: '#888780' }}>PDF, DOC, or DOCX. Leave blank to keep the current file.</span>
                    <input
                      key={resumeInputKey}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
                      className="mt-4 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
                    />
                  </label>

                  <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                    <div className="text-xs uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Selected file</div>
                    <div className="mt-1 text-sm" style={{ color: '#1a1a18' }}>{resumeFile ? resumeFile.name : 'No new file selected'}</div>
                  </div>
                </section>

                <section id="skills" className="card space-y-4 scroll-mt-24">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Skills</h2>
                      <p className="mt-1 text-sm" style={{ color: '#888780' }}>Pick what you know best. You can filter by name or category.</p>
                    </div>
                    <span className="badge-primary text-xs">{selectedSkills.length} selected</span>
                  </div>

                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkillNames.map((skillName) => (
                        <span key={skillName} className="badge-primary text-xs">{skillName}</span>
                      ))}
                      <button type="button" className="btn-outline px-3 py-1.5 text-[11px]" onClick={clearAllSkills}>
                        Clear all
                      </button>
                    </div>
                  )}

                  <input
                    value={skillQuery}
                    onChange={(event) => setSkillQuery(event.target.value)}
                    placeholder="Search skills or categories"
                    className="input-field"
                  />

                  <div className="space-y-4 max-h-[520px] overflow-auto pr-1">
                    {skillsByCategory.length > 0 ? (
                      skillsByCategory.map(([category, categorySkills]) => {
                        const allSelected = categorySkills.every((skill) => selectedSkills.includes(skill.id))

                        return (
                          <section key={category} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold" style={{ color: '#1a1a18' }}>{category}</h3>
                                <p className="text-xs mt-1" style={{ color: '#888780' }}>{categorySkills.length} skill{categorySkills.length === 1 ? '' : 's'}</p>
                              </div>
                              <button
                                type="button"
                                className="btn-outline px-3 py-2 text-[11px]"
                                onClick={() => toggleCategorySkills(categorySkills)}
                              >
                                {allSelected ? 'Clear category' : 'Select category'}
                              </button>
                            </div>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {categorySkills.map((skill) => {
                                const selected = selectedSkills.includes(skill.id)

                                return (
                                  <label
                                    key={skill.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition ${selected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleSkill(skill.id)}
                                      className="mt-1 h-4 w-4 rounded border-slate-300"
                                    />
                                    <div>
                                      <div className="text-sm font-medium">{skill.name}</div>
                                      {skill.category && <div className={`text-xs mt-0.5 ${selected ? 'text-white/70' : 'text-slate-500'}`}>{skill.category}</div>}
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          </section>
                        )
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed p-6 text-sm text-center" style={{ color: '#888780', borderColor: 'var(--color-border)' }}>
                        No skills match your search.
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 py-3"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
