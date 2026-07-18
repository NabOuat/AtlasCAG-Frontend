import { useEffect, useState, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Plus, Clock } from 'lucide-react'
import { getPlanning } from '@/api/terrain'
import { getZones } from '@/api/referentiel'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)
dayjs.locale('fr')

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const TYPE_ACT = {
  LEVE:     { bg: '#e0f2fe', text: '#0369a1', label: 'Levé GNSS' },
  ENQUETE:  { bg: '#dcfce7', text: '#15803d', label: 'Enquête' },
  CONTRAT:  { bg: '#fef9c3', text: '#b45309', label: 'Contrat' },
  REUNION:  { bg: '#fce7f3', text: '#9d174d', label: 'Réunion' },
  AUTRE:    { bg: '#f3f4f6', text: '#6b7280', label: 'Autre' },
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function ActivityPill({ act }) {
  const t = TYPE_ACT[act.type_activite] ?? TYPE_ACT.AUTRE
  return (
    <div className="rounded-lg p-2 mb-1 cursor-default"
         style={{ backgroundColor: t.bg, borderLeft: `2px solid ${t.text}` }}>
      <p className="text-[10.5px] font-semibold truncate" style={{ color: t.text }}>{t.label}</p>
      {act.village_nom && (
        <p className="text-[10px] truncate mt-0.5" style={{ color: t.text, opacity: 0.75 }}>{act.village_nom}</p>
      )}
      {(act.heure_debut || act.heure_fin) && (
        <p className="text-[9.5px] mt-0.5 flex items-center gap-1" style={{ color: t.text, opacity: 0.65 }}>
          <Clock size={8} />
          {act.heure_debut?.slice(0, 5)}{act.heure_fin ? `–${act.heure_fin.slice(0, 5)}` : ''}
        </p>
      )}
      {act.asf_nom && (
        <p className="text-[9.5px] mt-0.5 italic truncate" style={{ color: t.text, opacity: 0.55 }}>
          {act.asf_nom}
        </p>
      )}
    </div>
  )
}

export default function PlanningPage() {
  const [activities, setActivities] = useState([])
  const [zones, setZones]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [weekStart, setWeekStart]   = useState(() => dayjs().startOf('isoWeek'))
  const [filters, setFilters]       = useState({ zone: '' })

  const weekEnd = weekStart.add(6, 'day')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        date_debut: weekStart.format('YYYY-MM-DD'),
        date_fin:   weekEnd.format('YYYY-MM-DD'),
      }
      if (filters.zone) params.zone = filters.zone

      const [aRes, zRes] = await Promise.all([
        getPlanning(params),
        zones.length ? Promise.resolve({ data: zones }) : getZones(),
      ])
      setActivities(aRes.data.results ?? aRes.data)
      if (!zones.length) setZones(zRes.data.results ?? zRes.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [weekStart, filters])

  useEffect(() => { load() }, [load])

  /* Groupe les activités par jour de la semaine (0=lun, 6=dim) */
  const byDay = JOURS.map((_, i) => {
    const date = weekStart.add(i, 'day').format('YYYY-MM-DD')
    return activities.filter(a => a.date_activite === date)
  })

  const totalActs = activities.length
  const byType = Object.entries(TYPE_ACT).map(([k, v]) => ({
    ...v,
    count: activities.filter(a => a.type_activite === k).length,
  })).filter(t => t.count > 0)

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>Planning terrain</h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: C.gray }}>
            Activités des ASF · {totalActs} activité{totalActs > 1 ? 's' : ''} cette semaine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  style={{ color: C.gray }}>
            <RefreshCw size={14} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold hover:opacity-85"
            style={{ backgroundColor: C.orange }}>
            <Plus size={14} />
            Planifier
          </button>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between"
           style={{ border: '1px solid #f0f0f0' }}>
        <button
          onClick={() => setWeekStart(w => w.subtract(1, 'week'))}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          style={{ color: C.navy }}>
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <p className="text-[14px] font-bold" style={{ color: C.navy }}>
            Semaine du {weekStart.format('D MMMM')} au {weekEnd.format('D MMMM YYYY')}
          </p>
          <button onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}
                  className="text-[11px] mt-0.5 hover:underline" style={{ color: C.orange }}>
            Semaine courante
          </button>
        </div>

        <div className="flex items-center gap-3">
          {zones.length > 0 && (
            <select value={filters.zone} onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg border text-[12px] outline-none bg-white"
                    style={{ borderColor: '#e5e7eb', color: filters.zone ? '#1f2937' : '#9ca3af' }}>
              <option value="">Toutes zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}
            </select>
          )}
          <button
            onClick={() => setWeekStart(w => w.add(1, 'week'))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{ color: C.navy }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Légende par type */}
      {byType.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {byType.map(t => (
            <div key={t.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px]"
                 style={{ backgroundColor: t.bg }}>
              <span className="font-semibold" style={{ color: t.text }}>{t.count}×</span>
              <span style={{ color: t.text }}>{t.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendrier 7 jours */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 rounded-full animate-spin"
               style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {JOURS.map((jour, i) => {
            const date    = weekStart.add(i, 'day')
            const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
            const acts    = byDay[i]
            return (
              <div key={jour} className="bg-white rounded-xl overflow-hidden"
                   style={{
                     border: isToday ? `1.5px solid ${C.orange}` : '1px solid #f0f0f0',
                     minHeight: 120,
                   }}>
                {/* Header jour */}
                <div className="px-3 py-2 flex items-center justify-between"
                     style={{ backgroundColor: isToday ? `${C.orange}10` : '#f8f9fb', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isToday ? C.orange : C.gray }}>
                      {jour}
                    </p>
                    <p className="text-[14px] font-bold" style={{ color: isToday ? C.orange : C.navy }}>
                      {date.format('D')}
                    </p>
                  </div>
                  {acts.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: isToday ? C.orange : C.teal, color: '#fff' }}>
                      {acts.length}
                    </span>
                  )}
                </div>

                {/* Activités */}
                <div className="p-2">
                  {acts.length === 0 ? (
                    <p className="text-[10px] text-center py-3" style={{ color: '#d1d5db' }}>—</p>
                  ) : acts.map(a => <ActivityPill key={a.id} act={a} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
