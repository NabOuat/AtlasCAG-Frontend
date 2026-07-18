import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, FileCheck, AlertTriangle, MapPin,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ChevronRight, RefreshCw,
} from 'lucide-react'
import { getDashboard } from '@/api/stats'
import dayjs from 'dayjs'

/* ── Constantes de couleurs ──────────────────────────────────── */
const C = {
  orange:  '#C75A24',
  teal:    '#41A6C7',
  green:   '#43D793',
  navy:    '#1a2536',
  red:     '#ef4444',
  yellow:  '#f59e0b',
  gray:    '#6b7280',
}

/* ── Badge statut dossier ────────────────────────────────────── */
const STATUT_STYLE = {
  EN_COURS: { bg: '#fef9c3', text: '#b45309', label: 'En cours' },
  VALIDE:   { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  REJETE:   { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
  ARCHIVE:  { bg: '#f3f4f6', text: '#6b7280', label: 'Archivé' },
  ANNULE:   { bg: '#fce7f3', text: '#9d174d', label: 'Annulé' },
}

const TYPE_STYLE = {
  DTV:               { bg: '#e0f2fe', text: '#0369a1', label: 'DTV' },
  CF:                { bg: '#dcfce7', text: '#15803d', label: 'CF' },
  CONTRACTUALISATION: { bg: '#fef3c7', text: '#92400e', label: 'Contrat' },
}

/* ── Badge gravité anomalie ──────────────────────────────────── */
const GRAVITE_STYLE = {
  BLOQUANTE: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  MAJEURE:   { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  MINEURE:   { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
}

/* ── KPI Card ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3"
         style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11.5px] font-medium uppercase tracking-wide" style={{ color: C.gray }}>
            {label}
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: C.navy }}>
            {value ?? '—'}
          </p>
          {sub && <p className="text-[12px] mt-0.5" style={{ color: C.gray }}>{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ backgroundColor: `${accent}18` }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid #f5f5f5' }}>
          <TrendingUp size={11} style={{ color: C.green }} />
          <span className="text-[11px]" style={{ color: C.gray }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

/* ── Barre de progression DTV ────────────────────────────────── */
function DtvBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11.5px] w-24 flex-shrink-0" style={{ color: '#555' }}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] w-14 text-right font-medium" style={{ color: '#555' }}>
        {count} / {total}
      </span>
    </div>
  )
}

/* ── Zone stat row ───────────────────────────────────────────── */
function ZoneRow({ z, index }) {
  const pct = z.dossiers > 0 ? Math.round((z.valides / z.dossiers) * 100) : 0
  const bg  = [C.orange, C.teal, C.green][index % 3]
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #f5f5f5' }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bg }} />
      <span className="font-medium text-[12.5px] flex-1 truncate" style={{ color: C.navy }}>{z.zone}</span>
      <div className="flex items-center gap-4 text-[12px]" style={{ color: C.gray }}>
        <span title="Dossiers total" className="w-14 text-right">{z.dossiers} doss.</span>
        <span title="Contrats" className="w-14 text-right">{z.contrats} cont.</span>
        <div className="flex items-center gap-1.5 w-20">
          <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C.green }} />
          </div>
          <span className="text-[10px] w-7 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const navigate            = useNavigate()

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch {
      setError('Impossible de charger le tableau de bord.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
           style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
      <p className="text-[13px]" style={{ color: C.gray }}>Chargement…</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <AlertTriangle size={28} style={{ color: C.red }} />
      <p className="text-[13px]" style={{ color: C.red }}>{error}</p>
      <button onClick={load} className="text-[12px] underline" style={{ color: C.orange }}>Réessayer</button>
    </div>
  )

  const { kpis, recents = [], anomalies = [], par_zone = [] } = data ?? {}

  return (
    <div className="space-y-6">

      {/* ── En-tête ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Tableau de bord</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            Régions Cavally & Worodougou · {dayjs().format('dddd D MMMM YYYY')}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] hover:bg-gray-100 transition-colors"
          style={{ color: C.gray }}
        >
          <RefreshCw size={13} />
          Actualiser
        </button>
      </div>

      {/* ── KPICards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Dossiers en cours"
          value={kpis?.dossiers?.en_cours}
          sub={`${kpis?.dossiers?.total ?? 0} dossiers au total`}
          icon={FolderOpen}
          accent={C.orange}
          trend={`${kpis?.dossiers?.valides ?? 0} validés · ${kpis?.dossiers?.rejetes ?? 0} rejetés`}
        />
        <KpiCard
          label="Contrats signés"
          value={kpis?.contrats?.signes}
          sub={`${kpis?.contrats?.total ?? 0} contrats total`}
          icon={FileCheck}
          accent={C.teal}
          trend={`${kpis?.contrats?.total - kpis?.contrats?.signes ?? 0} en brouillon`}
        />
        <KpiCard
          label="Anomalies actives"
          value={kpis?.anomalies?.non_corr}
          sub={`dont ${kpis?.anomalies?.bloquantes ?? 0} bloquantes`}
          icon={AlertTriangle}
          accent={kpis?.anomalies?.bloquantes > 0 ? C.red : C.yellow}
        />
        <KpiCard
          label="Villages DTV"
          value={kpis?.villages?.valides}
          sub={`sur ${kpis?.villages?.total ?? 0} villages`}
          icon={MapPin}
          accent={C.green}
          trend={`${kpis?.villages?.delimites ?? 0} délimités · ${kpis?.villages?.approuves ?? 0} approuvés`}
        />
      </div>

      {/* ── Ligne 2 : DTV Progress + Par zone ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* DTV Progression */}
        <div className="bg-white rounded-2xl p-5"
             style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold" style={{ color: C.navy }}>Avancement DTV</h2>
            <button
              onClick={() => navigate('/villages')}
              className="flex items-center gap-1 text-[11.5px] hover:underline"
              style={{ color: C.orange }}
            >
              Voir tout <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            <DtvBar label="Validés"      count={kpis?.villages?.valides   ?? 0} total={kpis?.villages?.total ?? 1} color={C.green} />
            <DtvBar label="Approuvés"    count={kpis?.villages?.approuves ?? 0} total={kpis?.villages?.total ?? 1} color={C.teal} />
            <DtvBar label="Délimités"    count={kpis?.villages?.delimites ?? 0} total={kpis?.villages?.total ?? 1} color={C.orange} />
            <DtvBar label="Pub. ouverte" count={kpis?.villages?.pub       ?? 0} total={kpis?.villages?.total ?? 1} color={C.yellow} />
          </div>
        </div>

        {/* Par zone */}
        <div className="bg-white rounded-2xl p-5"
             style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold" style={{ color: C.navy }}>Activité par zone</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: '#f0f2f5', color: C.gray }}>
              {par_zone.length} zones
            </span>
          </div>
          <div>
            {par_zone.length === 0 ? (
              <p className="text-[12px] text-center py-6" style={{ color: C.gray }}>Aucune zone enregistrée</p>
            ) : (
              par_zone.map((z, i) => <ZoneRow key={z.zone} z={z} index={i} />)
            )}
          </div>
        </div>
      </div>

      {/* ── Ligne 3 : Dossiers récents + Anomalies ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Dossiers récents */}
        <div className="bg-white rounded-2xl p-5"
             style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold" style={{ color: C.navy }}>Dossiers récents</h2>
            <button
              onClick={() => navigate('/dossiers')}
              className="flex items-center gap-1 text-[11.5px] hover:underline"
              style={{ color: C.orange }}
            >
              Voir tout <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-0">
            {recents.length === 0 ? (
              <p className="text-[12px] text-center py-6" style={{ color: C.gray }}>Aucun dossier</p>
            ) : recents.map((d) => {
              const s = STATUT_STYLE[d.statut] ?? STATUT_STYLE.EN_COURS
              const t = TYPE_STYLE[d.type_dossier] ?? TYPE_STYLE.DTV
              return (
                <div key={d.id}
                     className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                     style={{ borderBottom: '1px solid #f5f5f5' }}
                     onClick={() => navigate(`/dossiers/${d.id}`)}>
                  <div>
                    <p className="text-[12.5px] font-semibold" style={{ color: C.navy }}>{d.numero}</p>
                    <p className="text-[11px]" style={{ color: C.gray }}>{d.village} · {d.zone}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: t.bg, color: t.text }}>
                      {t.label}
                    </span>
                    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Anomalies non corrigées */}
        <div className="bg-white rounded-2xl p-5"
             style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold" style={{ color: C.navy }}>
              Anomalies à traiter
              {kpis?.anomalies?.bloquantes > 0 && (
                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  {kpis.anomalies.bloquantes} bloquante{kpis.anomalies.bloquantes > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <button
              onClick={() => navigate('/controle')}
              className="flex items-center gap-1 text-[11.5px] hover:underline"
              style={{ color: C.orange }}
            >
              Voir tout <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-0">
            {anomalies.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle2 size={28} style={{ color: C.green }} />
                <p className="text-[12px]" style={{ color: C.gray }}>Aucune anomalie active</p>
              </div>
            ) : anomalies.map((a) => {
              const g = GRAVITE_STYLE[a.gravite] ?? GRAVITE_STYLE.MINEURE
              return (
                <div key={a.id}
                     className="flex items-start gap-2.5 py-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                     style={{ borderBottom: '1px solid #f5f5f5' }}
                     onClick={() => navigate('/controle')}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: g.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: C.navy }}>
                      {a.description}
                    </p>
                    <p className="text-[11px]" style={{ color: C.gray }}>
                      {a.dossier} · {a.village}
                    </p>
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: g.bg, color: g.text }}>
                    {a.gravite}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
