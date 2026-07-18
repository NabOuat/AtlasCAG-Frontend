import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, CheckCircle2, Search, ChevronDown, RefreshCw, Shield } from 'lucide-react'
import { getControles, getControleStats } from '@/api/controle'
import { getZones } from '@/api/referentiel'
import dayjs from 'dayjs'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const STATUT = {
  EN_ATTENTE: { bg: '#f3f4f6', text: '#6b7280', label: 'En attente' },
  EN_COURS:   { bg: '#fef9c3', text: '#b45309', label: 'En cours' },
  VALIDE:     { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  REJETE:     { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
}

const GRAVITE = {
  BLOQUANTE: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Bloquante' },
  MAJEURE:   { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Majeure' },
  MINEURE:   { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', label: 'Mineure' },
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

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-3" style={{ border: '1px solid #f0f0f0' }}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-[11px] uppercase tracking-wide font-medium" style={{ color: C.gray }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: C.navy }}>{value}</p>
      </div>
    </div>
  )
}

/* Anomalie inline expandable */
function AnomalieTag({ a }) {
  const g = GRAVITE[a.gravite] ?? GRAVITE.MINEURE
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full mr-1 mb-1"
          style={{ backgroundColor: g.bg, color: g.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: g.dot }} />
      {a.description.length > 35 ? a.description.slice(0, 35) + '…' : a.description}
      {a.corrigee && <CheckCircle2 size={10} style={{ color: C.green }} />}
    </span>
  )
}

/* Ligne expandable */
function ControleRow({ c, idx, last }) {
  const [open, setOpen] = useState(false)
  const s = STATUT[c.statut] ?? STATUT.EN_ATTENTE

  return (
    <>
      <div
        className="grid items-center px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{
          gridTemplateColumns: '1.6fr 1fr 1.2fr 0.8fr 0.6fr 0.7fr 0.5fr',
          borderBottom: '1px solid #f5f5f5',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>{c.dossier_numero}</p>
          {c.controleur_nom && (
            <p className="text-[11px]" style={{ color: C.gray }}>{c.controleur_nom}</p>
          )}
        </div>
        <span className="text-[12px]" style={{ color: '#444' }}>{c.village_nom}</span>
        <span className="text-[12px]" style={{ color: C.gray }}>{c.zone_nom}</span>
        <Badge map={STATUT} value={c.statut} />
        <span className="text-[12px] font-semibold" style={{ color: c.nb_anomalies > 0 ? '#ef4444' : C.gray }}>
          {c.nb_anomalies} anom.
        </span>
        <span className="text-[11.5px]" style={{ color: C.gray }}>
          {c.date_controle ? dayjs(c.date_controle).format('DD/MM/YY') : '—'}
        </span>
        <ChevronDown size={14} style={{ color: '#d1d5db', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </div>

      {/* Anomalies expandées */}
      {open && c.anomalies?.length > 0 && (
        <div className="px-5 py-3 flex flex-wrap" style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
          {c.anomalies.map(a => <AnomalieTag key={a.id} a={a} />)}
        </div>
      )}
    </>
  )
}

export default function ControleList() {
  const [controles, setControles] = useState([])
  const [stats, setStats]         = useState(null)
  const [zones, setZones]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ zone: '', statut: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.zone)   params.zone   = filters.zone
      if (filters.statut) params.statut = filters.statut

      const [cRes, sRes, zRes] = await Promise.all([
        getControles(params),
        getControleStats(params),
        zones.length ? Promise.resolve({ data: zones }) : getZones(),
      ])
      let list = cRes.data.results ?? cRes.data
      if (filters.search) {
        const q = filters.search.toLowerCase()
        list = list.filter(c =>
          c.dossier_numero?.toLowerCase().includes(q) ||
          c.village_nom?.toLowerCase().includes(q)
        )
      }
      setControles(list)
      setStats(sRes.data)
      if (!zones.length) setZones(zRes.data.results ?? zRes.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Contrôle qualité</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            {controles.length} contrôle{controles.length > 1 ? 's' : ''} · Cliquer pour voir les anomalies
          </p>
        </div>
        <button onClick={load}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                style={{ color: C.gray }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <StatCard label="Total"        value={stats.total}      color={C.navy} />
          <StatCard label="Validés"      value={stats.valide}     color={C.green} />
          <StatCard label="Rejetés"      value={stats.rejete}     color="#ef4444" />
          <StatCard label="En attente"   value={stats.en_attente} color={C.gray} />
          <StatCard label="Anomalies act." value={stats.anomalies?.non_corr ?? 0}
                    color={stats.anomalies?.bloquante > 0 ? '#ef4444' : '#f59e0b'} />
        </div>
      )}

      {/* Mini stats anomalies */}
      {stats?.anomalies && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Bloquantes', value: stats.anomalies.bloquante, color: '#ef4444' },
            { label: 'Majeures',   value: stats.anomalies.majeure,   color: '#f59e0b' },
            { label: 'Mineures',   value: stats.anomalies.mineure,   color: '#9ca3af' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 bg-white rounded-lg px-4 py-2"
                 style={{ border: '1px solid #f0f0f0' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[12px]" style={{ color: C.gray }}>{label}</span>
              <span className="text-[13px] font-bold" style={{ color: C.navy }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3"
           style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#c0c4cc' }} />
          <input value={filters.search} onChange={e => setF('search', e.target.value)}
                 placeholder="N° dossier, village…"
                 className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] outline-none"
                 style={{ borderColor: '#e5e7eb' }} />
        </div>
        <select value={filters.zone} onChange={e => setF('zone', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.zone ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>
        <select value={filters.statut} onChange={e => setF('statut', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.statut ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden"
           style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="grid text-[11px] font-bold uppercase tracking-wide px-5 py-3"
             style={{
               gridTemplateColumns: '1.6fr 1fr 1.2fr 0.8fr 0.6fr 0.7fr 0.5fr',
               backgroundColor: '#f8f9fb',
               color: C.gray,
               borderBottom: '1px solid #f0f0f0',
             }}>
          <span>Dossier</span>
          <span>Village</span>
          <span>Zone</span>
          <span>Statut</span>
          <span>Anomalies</span>
          <span>Date contrôle</span>
          <span />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin"
                 style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
          </div>
        ) : controles.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: C.gray }}>Aucun contrôle trouvé</p>
          </div>
        ) : controles.map((c, idx) => (
          <ControleRow key={c.id} c={c} idx={idx} last={idx === controles.length - 1} />
        ))}
      </div>
    </div>
  )
}
