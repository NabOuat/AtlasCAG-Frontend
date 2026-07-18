import { useEffect, useState, useCallback } from 'react'
import { FileText, Plus, Download, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react'
import { getRapports, createRapport } from '@/api/rapports'
import { getZones } from '@/api/referentiel'
import { useAuthStore } from '@/store/authStore'
import dayjs from 'dayjs'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const TYPE_RAPPORT = {
  MENSUEL:     { bg: '#e0f2fe', text: '#0369a1', label: 'Mensuel',     icon: '📋' },
  TRIMESTRIEL: { bg: '#fef9c3', text: '#b45309', label: 'Trimestriel', icon: '📊' },
  ANNUEL:      { bg: '#dcfce7', text: '#15803d', label: 'Annuel',      icon: '📈' },
}

const STATUT_RAPPORT = {
  BROUILLON: { bg: '#f3f4f6', text: '#6b7280', label: 'Brouillon' },
  FINALISE:  { bg: '#fef9c3', text: '#b45309', label: 'Finalisé' },
  ENVOYE:    { bg: '#dcfce7', text: '#15803d', label: 'Envoyé' },
}

function Badge({ map, value }) {
  const s = map[value] ?? { bg: '#f3f4f6', text: '#6b7280', label: value }
  return (
    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

/* Modale de création */
function CreateModal({ zones, onClose, onCreate }) {
  const [form, setForm] = useState({ zone: '', type_rapport: 'MENSUEL', periode: dayjs().format('YYYY-MM') })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.zone) return
    setLoading(true)
    try {
      await onCreate(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-[16px] font-bold mb-4" style={{ color: C.navy }}>Nouveau rapport</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: '#374151' }}>Zone</label>
            <select required value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none bg-white"
                    style={{ borderColor: '#e5e7eb' }}>
              <option value="">Sélectionner une zone…</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: '#374151' }}>Type</label>
            <select value={form.type_rapport} onChange={e => setForm(f => ({ ...f, type_rapport: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none bg-white"
                    style={{ borderColor: '#e5e7eb' }}>
              {Object.entries(TYPE_RAPPORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: '#374151' }}>Période (YYYY-MM)</label>
            <input type="month" value={form.periode}
                   onChange={e => setForm(f => ({ ...f, periode: e.target.value }))}
                   className="w-full px-3 py-2 rounded-xl border text-[13px] outline-none"
                   style={{ borderColor: '#e5e7eb' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e5e7eb', color: C.gray }}>
              Annuler
            </button>
            <button type="submit" disabled={loading || !form.zone}
                    className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-opacity"
                    style={{ backgroundColor: C.orange, opacity: (loading || !form.zone) ? 0.65 : 1 }}>
              {loading ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RapportPage() {
  const { user }             = useAuthStore()
  const [rapports, setRapports] = useState([])
  const [zones, setZones]    = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState({ zone: '', type_rapport: '', statut: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.zone)         params.zone         = filters.zone
      if (filters.type_rapport) params.type_rapport = filters.type_rapport
      if (filters.statut)       params.statut       = filters.statut

      const [rRes, zRes] = await Promise.all([
        getRapports(params),
        zones.length ? Promise.resolve({ data: zones }) : getZones(),
      ])
      setRapports(rRes.data.results ?? rRes.data)
      if (!zones.length) setZones(zRes.data.results ?? zRes.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    await createRapport(form)
    load()
  }

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-5">
      {showCreate && <CreateModal zones={zones} onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Rapports</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            {rapports.length} rapport{rapports.length > 1 ? 's' : ''} — Mensuel, Trimestriel, Annuel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  style={{ color: C.gray }}>
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold hover:opacity-85"
            style={{ backgroundColor: C.orange }}>
            <Plus size={14} />
            Nouveau rapport
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3"
           style={{ border: '1px solid #f0f0f0' }}>
        <select value={filters.zone} onChange={e => setF('zone', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.zone ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>
        <select value={filters.type_rapport} onChange={e => setF('type_rapport', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.type_rapport ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_RAPPORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filters.statut} onChange={e => setF('statut', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.statut ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_RAPPORT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Grille rapports */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 rounded-full animate-spin"
               style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
        </div>
      ) : rapports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center"
             style={{ border: '1px solid #f0f0f0' }}>
          <FileText size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <p className="text-[14px] font-medium" style={{ color: C.gray }}>Aucun rapport</p>
          <p className="text-[12px] mt-1" style={{ color: '#9ca3af' }}>
            Créez votre premier rapport mensuel ou trimestriel
          </p>
          <button onClick={() => setShowCreate(true)}
                  className="mt-4 px-5 py-2 rounded-xl text-white text-[12.5px] font-semibold hover:opacity-85"
                  style={{ backgroundColor: C.orange }}>
            Créer un rapport
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {rapports.map(r => {
            const t = TYPE_RAPPORT[r.type_rapport] ?? TYPE_RAPPORT.MENSUEL
            const s = STATUT_RAPPORT[r.statut]     ?? STATUT_RAPPORT.BROUILLON
            return (
              <div key={r.id} className="bg-white rounded-2xl p-5"
                   style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                       style={{ backgroundColor: t.bg }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[13.5px] font-bold" style={{ color: C.navy }}>
                        Rapport {t.label} — {r.periode}
                      </h3>
                      <Badge map={STATUT_RAPPORT} value={r.statut} />
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: C.gray }}>
                      {r.zone_nom} · {r.redige_par_nom ?? 'Non attribué'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: '#9ca3af' }}>
                      <Calendar size={10} />
                      Créé le {dayjs(r.cree_le).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  {r.fichier_url && (
                    <a href={r.fichier_url} target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
                       style={{ color: C.teal }}>
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
