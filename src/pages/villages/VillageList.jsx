import { useEffect, useState, useCallback } from 'react'
import { MapPin, Search, RefreshCw, CheckCircle2, Clock, Circle } from 'lucide-react'
import { getVillages, getZones, getVillagesDTVStats } from '@/api/referentiel'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

/* Les 8 étapes DTV dans l'ordre */
const DTV_ETAPES = [
  { key: 'recueil_historique_fait', label: 'Recueil', short: 'REC' },
  { key: 'layons_identifies',       label: 'Layons',  short: 'LAY', numeric: true },
  { key: 'pv_constat_signes',       label: 'PV',      short: 'PV',  numeric: true },
  { key: 'delimite',                label: 'Délimité', short: 'DEL' },
  { key: 'publicite_ouverte',       label: 'Pub. ouv.', short: 'P.O' },
  { key: 'publicite_cloturee',      label: 'Pub. clôt.', short: 'P.C' },
  { key: 'approuve',                label: 'Approuvé', short: 'APP' },
  { key: 'valide',                  label: 'Validé',   short: 'VAL' },
]

const ETAPE_COLOR = {
  VALIDE:        { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  APPROUVE:      { bg: '#d1fae5', text: '#065f46', label: 'Approuvé' },
  PUB_CLOTUREE:  { bg: '#e0f2fe', text: '#0369a1', label: 'Pub. clôturée' },
  PUB_OUVERTE:   { bg: '#bfdbfe', text: '#1d4ed8', label: 'Pub. ouverte' },
  DELIMITE:      { bg: '#fef9c3', text: '#b45309', label: 'Délimité' },
  PV_SIGNES:     { bg: '#fef3c7', text: '#92400e', label: 'PV signés' },
  LAYONS:        { bg: '#ffedd5', text: '#c2410c', label: 'Layons' },
  RECUEIL:       { bg: '#f3f4f6', text: '#6b7280', label: 'Recueil' },
  NON_DEMARRE:   { bg: '#fee2e2', text: '#b91c1c', label: 'Non démarré' },
}

function EtapePill({ done, value, numeric }) {
  const active = numeric ? value > 0 : value
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0"
      style={{
        backgroundColor: active ? '#dcfce7' : '#f3f4f6',
        color:           active ? '#15803d' : '#9ca3af',
      }}
      title={active ? (numeric ? `${value}` : 'Fait') : 'Non fait'}
    >
      {active ? (numeric ? value : '✓') : '·'}
    </div>
  )
}

function ProgressBar({ progress }) {
  const pct = Math.round((progress / 8) * 100)
  const color = pct >= 100 ? C.green : pct >= 50 ? C.teal : pct >= 25 ? C.orange : '#e5e7eb'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10.5px] font-medium" style={{ color: '#555' }}>{progress}/8</span>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 text-center" style={{ border: '1px solid #f0f0f0' }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: C.gray }}>{label}</p>
    </div>
  )
}

export default function VillageList() {
  const [villages, setVillages] = useState([])
  const [dtv, setDtv]           = useState(null)
  const [zones, setZones]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ zone: '', search: '', etape: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.zone)  params.zone  = filters.zone
      if (filters.etape) params.etape = filters.etape

      const [vRes, dRes, zRes] = await Promise.all([
        getVillages(params),
        getVillagesDTVStats(filters.zone ? { zone: filters.zone } : {}),
        zones.length ? Promise.resolve({ data: zones }) : getZones(),
      ])
      let list = vRes.data.results ?? vRes.data
      if (filters.search) {
        const q = filters.search.toLowerCase()
        list = list.filter(v => v.nom.toLowerCase().includes(q) || v.sous_prefecture?.toLowerCase().includes(q))
      }
      setVillages(list)
      setDtv(dRes.data)
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
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Villages & DTV</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            Suivi de la délimitation territoriale des villages — {villages.length} village{villages.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={load}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                style={{ color: C.gray }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats DTV */}
      {dtv && (
        <div className="grid grid-cols-3 xl:grid-cols-7 gap-3">
          <StatCard label="Total"         value={dtv.total}        color={C.navy} />
          <StatCard label="Validés"       value={dtv.valide}       color={C.green} />
          <StatCard label="Approuvés"     value={dtv.approuve}     color={C.teal} />
          <StatCard label="Délimités"     value={dtv.delimite}     color={C.orange} />
          <StatCard label="Pub. ouverte"  value={dtv.pub_ouverte}  color="#6366f1" />
          <StatCard label="Pub. clôturée" value={dtv.pub_cloturee} color="#8b5cf6" />
          <StatCard label="Non démarrés"  value={dtv.non_demarre}  color="#ef4444" />
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3"
           style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#c0c4cc' }} />
          <input value={filters.search} onChange={e => setF('search', e.target.value)}
                 placeholder="Rechercher un village…"
                 className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] outline-none"
                 style={{ borderColor: '#e5e7eb' }} />
        </div>
        <select value={filters.zone} onChange={e => setF('zone', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.zone ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
        </select>
        <select value={filters.etape} onChange={e => setF('etape', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.etape ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les étapes</option>
          <option value="VALIDE">Validés</option>
          <option value="APPROUVE">Approuvés</option>
          <option value="DELIMITE">Délimités</option>
          <option value="NON_DEMARRE">Non démarrés</option>
        </select>
      </div>

      {/* En-tête étapes DTV */}
      <div className="bg-white rounded-xl overflow-hidden"
           style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider"
             style={{ backgroundColor: '#f8f9fb', borderBottom: '1px solid #f0f0f0', color: C.gray }}>
          <span style={{ flex: '0 0 200px' }}>Village</span>
          <span style={{ flex: '0 0 120px' }}>Sous-préf.</span>
          <span style={{ flex: '0 0 100px' }}>Zone</span>
          {DTV_ETAPES.map(e => (
            <span key={e.key} style={{ flex: '0 0 36px', textAlign: 'center' }} title={e.label}>{e.short}</span>
          ))}
          <span style={{ flex: '0 0 100px', textAlign: 'center' }}>Progression</span>
          <span style={{ flex: '1', textAlign: 'center' }}>Étape</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin"
                 style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
          </div>
        ) : villages.length === 0 ? (
          <div className="text-center py-16">
            <MapPin size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: C.gray }}>Aucun village trouvé</p>
          </div>
        ) : villages.map((v, idx) => {
          const etapeStyle = ETAPE_COLOR[v.dtv_etape] ?? ETAPE_COLOR.NON_DEMARRE
          return (
            <div key={v.id}
                 className="flex items-center px-5 py-2.5 hover:bg-gray-50 transition-colors"
                 style={{ borderBottom: idx < villages.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <span className="font-semibold text-[12.5px] truncate" style={{ flex: '0 0 200px', color: C.navy }}>
                {v.nom}
              </span>
              <span className="text-[12px] truncate" style={{ flex: '0 0 120px', color: C.gray }}>
                {v.sous_prefecture_nom || '—'}
              </span>
              <span className="text-[12px] truncate" style={{ flex: '0 0 100px', color: C.gray }}>
                {v.zone_nom}
              </span>
              {DTV_ETAPES.map(e => (
                <div key={e.key} style={{ flex: '0 0 36px', display: 'flex', justifyContent: 'center' }}>
                  <EtapePill done={v[e.key]} value={v[e.key]} numeric={e.numeric} />
                </div>
              ))}
              <div style={{ flex: '0 0 100px', display: 'flex', justifyContent: 'center' }}>
                <ProgressBar progress={v.dtv_progress ?? 0} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: etapeStyle.bg, color: etapeStyle.text }}>
                  {etapeStyle.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
