import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Search, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { getUsers, createUser, toggleUser } from '@/api/admin'
import { useAuthStore } from '@/store/authStore'
import { PROFILS, can } from '@/utils/permissions'
import dayjs from 'dayjs'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const PROFIL_COLOR = {
  CHEF_PROJET:   '#C75A24',
  SIFOR_SENIOR:  '#41A6C7',
  SIFOR_JUNIOR:  '#7dd3fc',
  CE:            '#43D793',
  CR:            '#34d399',
  CET:           '#9ca3af',
  AGENT_GNSS:    '#a3a3a3',
  RAF:           '#a855f7',
}

/* Modale de création utilisateur */
function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm]     = useState({ username: '', first_name: '', last_name: '', email: '', profil: 'CET', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await onCreate(form)
      onClose()
    } catch (err) {
      setError("Erreur lors de la création. Vérifiez les champs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-[16px] font-bold mb-4" style={{ color: C.navy }}>Nouvel utilisateur</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-[12px]"
               style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Prénom</label>
              <input required value={form.first_name} onChange={e => setF('first_name', e.target.value)}
                     className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                     style={{ borderColor: '#e5e7eb' }} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Nom</label>
              <input required value={form.last_name} onChange={e => setF('last_name', e.target.value)}
                     className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                     style={{ borderColor: '#e5e7eb' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Identifiant</label>
            <input required value={form.username} onChange={e => setF('username', e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                   style={{ borderColor: '#e5e7eb' }} />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Email</label>
            <input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
                   className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none"
                   style={{ borderColor: '#e5e7eb' }} />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Profil</label>
            <select value={form.profil} onChange={e => setF('profil', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none bg-white"
                    style={{ borderColor: '#e5e7eb' }}>
              {Object.entries(PROFILS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11.5px] font-medium mb-1" style={{ color: '#374151' }}>Mot de passe</label>
            <div className="relative">
              <input required type={showPwd ? 'text' : 'password'}
                     minLength={8}
                     value={form.password} onChange={e => setF('password', e.target.value)}
                     className="w-full px-3 pr-10 py-2 rounded-lg border text-[13px] outline-none"
                     style={{ borderColor: '#e5e7eb' }} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e5e7eb', color: C.gray }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-85"
                    style={{ backgroundColor: C.orange, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Création…' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user: me }         = useAuthStore()
  const [users, setUsers]    = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState({ profil: '', search: '', actif: '' })

  const canManage = can(me, ['CHEF_PROJET', 'SIFOR_SENIOR'])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.profil) params.profil = filters.profil
      if (filters.search) params.search = filters.search
      if (filters.actif)  params.actif  = filters.actif
      const res = await getUsers(params)
      setUsers(res.data.results ?? res.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    await createUser(form)
    load()
  }

  const handleToggle = async (u) => {
    await toggleUser(u.id, !u.is_active)
    load()
  }

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const total  = users.length
  const actifs = users.filter(u => u.is_active).length

  return (
    <div className="space-y-5">
      {showCreate && canManage && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Administration</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            {total} utilisateur{total > 1 ? 's' : ''} · {actifs} actif{actifs > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  style={{ color: C.gray }}>
            <RefreshCw size={14} />
          </button>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold hover:opacity-85"
              style={{ backgroundColor: C.orange }}>
              <Plus size={14} />
              Nouvel utilisateur
            </button>
          )}
        </div>
      </div>

      {/* Stats par profil */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PROFILS).map(([k, label]) => {
          const count = users.filter(u => u.profil === k).length
          if (count === 0) return null
          const color = PROFIL_COLOR[k] ?? C.gray
          return (
            <div key={k}
                 className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-[12px] cursor-pointer hover:shadow-sm transition-shadow"
                 style={{ border: '1px solid #f0f0f0' }}
                 onClick={() => setF('profil', filters.profil === k ? '' : k)}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span style={{ color: '#444' }}>{label}</span>
              <span className="font-bold" style={{ color: C.navy }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3"
           style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#c0c4cc' }} />
          <input value={filters.search} onChange={e => setF('search', e.target.value)}
                 placeholder="Identifiant, nom…"
                 className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] outline-none"
                 style={{ borderColor: '#e5e7eb' }} />
        </div>
        <select value={filters.profil} onChange={e => setF('profil', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.profil ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les profils</option>
          {Object.entries(PROFILS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.actif} onChange={e => setF('actif', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.actif ? '#1f2937' : '#9ca3af' }}>
          <option value="">Actif / Inactif</option>
          <option value="1">Actifs uniquement</option>
          <option value="0">Inactifs uniquement</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden"
           style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="grid text-[11px] font-bold uppercase tracking-wide px-5 py-3"
             style={{
               gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 0.7fr',
               backgroundColor: '#f8f9fb',
               color: C.gray,
               borderBottom: '1px solid #f0f0f0',
             }}>
          <span>Nom complet</span>
          <span>Identifiant</span>
          <span>Profil</span>
          <span>Statut</span>
          <span>Créé le</span>
          {canManage && <span>Action</span>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin"
                 style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: C.gray }}>Aucun utilisateur</p>
          </div>
        ) : users.map((u, idx) => {
          const profilColor = PROFIL_COLOR[u.profil] ?? C.gray
          const isMe = u.id === me?.id
          return (
            <div key={u.id}
                 className="grid items-center px-5 py-3"
                 style={{
                   gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 0.7fr',
                   borderBottom: idx < users.length - 1 ? '1px solid #f5f5f5' : 'none',
                   opacity: u.is_active ? 1 : 0.55,
                 }}>
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>
                  {u.nom_complet}
                  {isMe && (
                    <span className="ml-2 text-[9.5px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      Vous
                    </span>
                  )}
                </p>
                {u.email && <p className="text-[11px]" style={{ color: C.gray }}>{u.email}</p>}
              </div>
              <span className="font-mono text-[12px]" style={{ color: '#555' }}>{u.username}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: profilColor }} />
                <span className="text-[11.5px]" style={{ color: '#444' }}>
                  {PROFILS[u.profil] ?? u.profil}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {u.is_active
                  ? <CheckCircle2 size={14} style={{ color: C.green }} />
                  : <XCircle size={14} style={{ color: '#ef4444' }} />
                }
                <span className="text-[11.5px]" style={{ color: u.is_active ? C.green : '#ef4444' }}>
                  {u.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <span className="text-[11.5px]" style={{ color: C.gray }}>
                {u.date_joined ? dayjs(u.date_joined).format('DD/MM/YY') : '—'}
              </span>
              {canManage && (
                <button
                  disabled={isMe}
                  onClick={() => handleToggle(u)}
                  className="text-[11px] px-2 py-1 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: u.is_active ? '#fee2e2' : '#dcfce7',
                    color: u.is_active ? '#b91c1c' : '#15803d',
                  }}>
                  {u.is_active ? 'Désactiver' : 'Activer'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
