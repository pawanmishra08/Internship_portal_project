import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Skill } from '../types/api'
import { getAdminSkills, createSkill, updateSkill, deleteSkill } from '../api/skills'

export default function SkillsAdminPage() {
  const { user } = useAuth()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState<{ id?: number; name: string; category?: string }>({ name: '', category: '' })

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase()
    const sorted = [...skills].sort((left, right) => {
      const leftCategory = left.category?.toLowerCase() ?? ''
      const rightCategory = right.category?.toLowerCase() ?? ''

      if (leftCategory !== rightCategory) {
        return leftCategory.localeCompare(rightCategory)
      }

      return left.name.localeCompare(right.name)
    })

    if (!query) {
      return sorted
    }

    return sorted.filter((skill) => {
      const category = skill.category?.toLowerCase() ?? ''
      return skill.name.toLowerCase().includes(query) || category.includes(query)
    })
  }, [search, skills])

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getAdminSkills()
      setSkills(data)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function startEdit(s: Skill) {
    setForm({ id: s.id, name: s.name, category: s.category ?? '' })
  }

  function resetForm() {
    setForm({ name: '', category: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (form.id) {
        const updated = await updateSkill(form.id, { name: form.name, category: form.category })
        setSkills((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createSkill({ name: form.name, category: form.category })
        setSkills((prev) => [created, ...prev])
      }
      resetForm()
      setError(null)
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this skill?')) return
    try {
      await deleteSkill(id)
      setSkills((prev) => prev.filter((s) => s.id !== id))
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  if (!user || user.role !== 'admin') {
    return <div className="page-shell flex items-center justify-center p-6">You must be an admin to view this page.</div>
  }

  return (
    <div className="page-shell">
      <div className="page-container space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Admin</p>
            <h1 className="page-title">Skills</h1>
            <p className="page-subtitle">Create and maintain the skill catalog used by profile matching.</p>
          </div>
          <div className="badge-primary self-start sm:self-auto">{filteredSkills.length} visible / {skills.length} total</div>
        </div>

        {error && <div className="badge-error px-4 py-3">{error}</div>}

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <section className="card space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>{form.id ? 'Edit skill' : 'Add skill'}</h2>
              <p className="mt-1 text-sm" style={{ color: '#888780' }}>
                Keep names short and categories consistent so profiles stay easy to scan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Skill name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. React, SQL, Figma"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <input
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="e.g. Frontend, Data, Design"
                  className="input-field"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button type="submit" className="btn-primary">
                  {form.id ? 'Update skill' : 'Create skill'}
                </button>
                {form.id && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="card space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#1a1a18' }}>Skill library</h2>
                <p className="mt-1 text-sm" style={{ color: '#888780' }}>Search, edit, or remove existing skills.</p>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or category"
                className="input-field sm:max-w-xs"
              />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm" style={{ color: '#888780', borderColor: 'var(--color-border)' }}>
                Loading skills…
              </div>
            ) : filteredSkills.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr style={{ background: '#f7f7f5' }}>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>ID</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Name</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Category</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-[0.18em]" style={{ color: '#aaa9a2' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((skill, index) => (
                      <tr key={skill.id} className={index % 2 === 0 ? 'bg-white' : ''}>
                        <td className="px-4 py-3 text-sm" style={{ color: '#1a1a18' }}>{skill.id}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1a1a18' }}>{skill.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#888780' }}>{skill.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" className="btn-secondary px-3 py-2 text-[11px]" onClick={() => startEdit(skill)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-outline px-3 py-2 text-[11px]"
                              style={{ color: '#a32d2d', borderColor: '#f0b3b3' }}
                              onClick={() => handleDelete(skill.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm" style={{ color: '#888780', borderColor: 'var(--color-border)' }}>
                No skills match your search.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
