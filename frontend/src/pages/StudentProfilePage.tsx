import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSkills } from '../api/skills'
import { getStudentProfile, updateStudentProfile } from '../api/students'
import type { Skill, StudentProfile, StudentProfilePayload } from '../types/api'

const degreeOptions = ['bachelor', 'master', 'phd', 'diploma', 'other']

export default function StudentProfilePage() {
  const { status, user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [form, setForm] = useState<StudentProfilePayload>({
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
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        setForm({
          bio: studentProfile.bio ?? '',
          phone: studentProfile.phone ?? '',
          location: studentProfile.location ?? '',
          university: studentProfile.university ?? '',
          degree: studentProfile.degree ?? '',
          field_of_study: studentProfile.field_of_study ?? '',
          graduation_year: studentProfile.graduation_year ?? null,
          gpa: studentProfile.gpa ?? null,
          linkedin_url: studentProfile.linkedin_url ?? '',
          github_url: studentProfile.github_url ?? '',
          portfolio_url: studentProfile.portfolio_url ?? '',
          available_from: studentProfile.available_from ?? null,
          is_available: studentProfile.is_available,
          skill_ids: studentProfile.skills.map((skill) => skill.id),
        })
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Restoring session…</p>
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
      const payload: StudentProfilePayload = {
        ...form,
        skill_ids: selectedSkills,
      }

      const updatedProfile = await updateStudentProfile(payload)
      setProfile(updatedProfile)
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
    setSelectedSkills((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Profile</p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">Student profile</h1>
          <p className="text-slate-600 mt-2">Update your availability, experience, and profile details for companies to discover.</p>
        </div>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">{error}</div>}
        {successMessage && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 mb-6">{successMessage}</div>}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading profile…</div>
        ) : (
          <form className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full name</label>
                <input
                  disabled
                  value={profile?.full_name || ''}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  disabled
                  value={profile?.email || ''}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
              <textarea
                value={form.bio ?? ''}
                onChange={(event) => setField('bio', event.target.value)}
                className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">University</label>
                <input
                  value={form.university ?? ''}
                  onChange={(event) => setField('university', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Field of study</label>
                <input
                  value={form.field_of_study ?? ''}
                  onChange={(event) => setField('field_of_study', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Degree</label>
                <select
                  value={form.degree ?? ''}
                  onChange={(event) => setField('degree', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                >
                  <option value="">Select degree</option>
                  {degreeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Graduation year</label>
                <input
                  type="number"
                  min={1930}
                  max={2100}
                  value={form.graduation_year ?? ''}
                  onChange={(event) => setField('graduation_year', event.target.value ? Number(event.target.value) : null)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">GPA</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={4}
                  value={form.gpa ?? ''}
                  onChange={(event) => setField('gpa', event.target.value ? Number(event.target.value) : null)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input
                  value={form.phone ?? ''}
                  onChange={(event) => setField('phone', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                <input
                  value={form.location ?? ''}
                  onChange={(event) => setField('location', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">LinkedIn</label>
                <input
                  value={form.linkedin_url ?? ''}
                  onChange={(event) => setField('linkedin_url', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">GitHub</label>
                <input
                  value={form.github_url ?? ''}
                  onChange={(event) => setField('github_url', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Portfolio</label>
                <input
                  value={form.portfolio_url ?? ''}
                  onChange={(event) => setField('portfolio_url', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Available from</label>
                <input
                  type="date"
                  value={form.available_from ?? ''}
                  onChange={(event) => setField('available_from', event.target.value || null)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                />
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
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

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Skills</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedSkills.includes(skill.id)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
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
