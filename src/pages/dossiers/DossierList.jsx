import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Search, Filter, ChevronRight, RefreshCw, X } from 'lucide-react'
import { getDossiers, getDossierStats } from '@/api/dossiers'
import { getZones } from '@/api/referentiel'
import dayjs from 'dayjs'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const STATUT = {
  EN_COURS: { bg: '#fef9c3', text: '#b45309', label: 'En cours' },
  VALIDE:   { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  REJETE:   { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
  ARCHIVE:  { bg: '#f3f4f6', text: '#6b7280', label: 'Archivé' },
  ANNULE:   { bg: '#fce7f3', text: '#9d174d', label: 'Annulé' },
}

const TYPE = {
  DTV:                { bg: '#e0f2fe', text: '#0369a1', label: 'DTV' },
  CF:                 { bg: '#dcfce7', text: '#15803d', label: 'CF' },
  CONTRACTUALISATION: { bg: '#fef3c7', text: '#92400e', label: 'Contrat' },
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

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3"
         style={{ border: '1px solid #f0f0f0' }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
      <div>
        <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: C.gray }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: C.navy }}>{value}</p>
      </div>
    </div>
  )
}

export default function DossierList() {
  const navigate = useNavigate()
  const [dossiers, setDossiers] = useState([])
  const [stats, setStats]       = useState(null)
  const [zones, setZones]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ zone: '', statut: '', type_dossier: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.zone)         params.zone         = filters.zone
      if (filters.statut)       params.statut       = filters.statut
      if (filters.type_dossier) params.type_dossier = filters.type_dossier
      if (filters.search)       params.search       = filters.search

      const [dosRes, stRes, zRes] = await Promise.all([
        getDossiers(params),
        getDossierStats(params),
        zones.length ? Promise.resolve({ data: zones }) : getZones(),
      ])
      setDossiers(dosRes.data.results ?? dosRes.data)
      setStats(stRes.data)
      if (!zones.length) setZones(zRes.data.results ?? zRes.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ zone: '', statut: '', type_dossier: '', search: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Dossiers fonciers</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''} {hasFilters ? 'filtrés' : 'au total'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  style={{ color: C.gray }}>
            <RefreshCw size={14} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold transition-opacity hover:opacity-85"
            style={{ backgroundColor: C.orange }}>
            <Plus size={14} />
            Nouveau dossier
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <StatCard label="Total"    value={stats.total}    accent={C.navy} />
          <StatCard label="En cours" value={stats.en_cours} accent={C.teal} />
          <StatCard label="Validés"  value={stats.valide}   accent={C.green} />
          <StatCard label="Rejetés"  value={stats.rejete}   accent="#ef4444" />
          <StatCard label="DTV"      value={stats.par_type?.DTV ?? 0} accent={C.orange} />
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3"
           style={{ border: '1px solid #f0f0f0' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#c0c4cc' }} />
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] outline-none"
            style={{ borderColor: '#e5e7eb', color: '#1f2937' }}
          />
        </div>

        {/* Zone */}
        <select value={filters.zone} onChange={e => setFilter('zone', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.zone ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>

        {/* Statut */}
        <select value={filters.statut} onChange={e => setFilter('statut', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.statut ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Type */}
        <select value={filters.type_dossier} onChange={e => setFilter('type_dossier', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.type_dossier ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters}
                  className="flex items-center gap-1 text-[12px] px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: '#ef4444' }}>
            <X size={12} />
            Effacer
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden"
           style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div className="grid text-[11px] font-bold uppercase tracking-wide px-5 py-3"
             style={{
               gridTemplateColumns: '1.8fr 1fr 1.2fr 1fr 0.8fr 0.8fr 0.5fr',
               backgroundColor: '#f8f9fb',
               color: C.gray,
               borderBottom: '1px solid #f0f0f0',
             }}>
          <span>Numéro</span>
          <span>Village</span>
          <span>Zone</span>
          <span>Type</span>
          <span>Statut</span>
          <span>Créé le</span>
          <span />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin"
                 style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
          </div>
        ) : dossiers.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: C.gray }}>Aucun dossier trouvé</p>
          </div>
        ) : dossiers.map((d, idx) => (
          <div
            key={d.id}
            className="grid items-center px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{
              gridTemplateColumns: '1.8fr 1fr 1.2fr 1fr 0.8fr 0.8fr 0.5fr',
              borderBottom: idx < dossiers.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}
            onClick={() => navigate(`/dossiers/${d.id}`)}
          >
            <div>
              <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>{d.numero_dossier}</p>
              {d.cree_par_nom && (
                <p className="text-[11px]" style={{ color: C.gray }}>{d.cree_par_nom}</p>
              )}
            </div>
            <span className="text-[12.5px]" style={{ color: '#444' }}>{d.village_nom}</span>
            <span className="text-[12px]" style={{ color: C.gray }}>{d.zone_nom}</span>
            <Badge map={TYPE}   value={d.type_dossier} />
            <Badge map={STATUT} value={d.statut} />
            <span className="text-[11.5px]" style={{ color: C.gray }}>
              {dayjs(d.cree_le).format('DD/MM/YY')}
            </span>
            <ChevronRight size={14} style={{ color: '#d1d5db' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
