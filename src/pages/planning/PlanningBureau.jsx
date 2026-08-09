import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Building2, Plus, RefreshCw, X, Upload,
  Loader2, CheckCircle2, AlertTriangle, Download, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown,
} from 'lucide-react'
import { useZone } from '@/layouts/ZoneLayout'
import { useAuthStore } from '@/store/authStore'
import { can } from '@/utils/permissions'
import { C, S, TYPE_TRAITEMENT_STYLE } from '@/utils/theme'
import { getZones, getRegions, getDepartements } from '@/api/referentiel'
import { getVagues } from '@/api/dossiers'
import {
  getRapportsBureau, createRapportBureau, getDashboardBureau, exportRapportsBureau,
} from '@/api/planningBureau'

const PAGE_SIZES = [25, 50, 100]
const PROFILS_AUTORISES = ['SIFOR_JUNIOR', 'SIFOR_SENIOR']

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function TypeBadge({ value }) {
  const s = TYPE_TRAITEMENT_STYLE[value] ?? { bg: '#f3f4f6', text: '#6b7280', label: value }
  return (
    <span style={{
      background: s.bg, color: s.text, padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function PeriodeCard({ titre, data }) {
  const zip = data?.ZIP_SHAPE ?? { nb_agents: 0, nb_parcelles: 0, superficie_totale: 0 }
  const pdf = data?.PDF ?? { nb_agents: 0, nb_parcelles: 0, superficie_totale: 0 }
  const moyenneZip = zip.nb_agents ? (zip.superficie_totale / zip.nb_agents).toFixed(1) : '0.0'
  const moyennePdf = pdf.nb_agents ? (pdf.superficie_totale / pdf.nb_agents).toFixed(1) : '0.0'

  return (
    <div style={{
      background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
      padding: 16, flex: 1, minWidth: 300, boxShadow: S.shadowLight,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{titre}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: TYPE_TRAITEMENT_STYLE.ZIP_SHAPE.text,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_TRAITEMENT_STYLE.ZIP_SHAPE.text }}>ZIP / Shape</span>
          </div>
          <p style={{ fontSize: 11.5, color: C.muted, lineHeight: '19px' }}>
            {zip.nb_agents} agent{zip.nb_agents > 1 ? 's' : ''} · {zip.nb_parcelles} parcelle{zip.nb_parcelles > 1 ? 's' : ''}<br />
            {zip.superficie_totale.toLocaleString('fr-CI')} ha · moy. {moyenneZip} ha/agent
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: TYPE_TRAITEMENT_STYLE.PDF.text,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_TRAITEMENT_STYLE.PDF.text }}>Édition PDF</span>
          </div>
          <p style={{ fontSize: 11.5, color: C.muted, lineHeight: '19px' }}>
            {pdf.nb_agents} agent{pdf.nb_agents > 1 ? 's' : ''} · {pdf.nb_parcelles} PDF<br />
            {pdf.superficie_totale.toLocaleString('fr-CI')} ha · moy. {moyennePdf} ha/agent
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Filtre texte réutilisable ──────────────────────────────────── */
function FilterSelect({ label, value, onChange, options, width = 150 }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none"
              style={{ borderColor: C.border, color: C.text, backgroundColor: '#fff', width }}>
        <option value="">Tous</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function PlanningBureau() {
  const zoneLabel = useZone() // 'CAVALLY' | 'WORODOUGOU'
  const { user } = useAuthStore()
  const peutCreer = can(user, PROFILS_AUTORISES)

  const [zoneId, setZoneId] = useState(null)
  const [regions, setRegions] = useState([])
  const [departements, setDepartements] = useState([])
  const [vagues, setVagues] = useState([])

  const [typeTraitement, setTypeTraitement] = useState('')
  const [regionFiltre, setRegionFiltre] = useState('')
  const [departementFiltre, setDepartementFiltre] = useState('')
  const [vagueFiltre, setVagueFiltre] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [ordering, setOrdering] = useState('-date')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const [data, setData] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Résolution de l'id de zone à partir du contexte de route
  useEffect(() => {
    getZones().then(res => {
      const list = res.data.results ?? res.data
      const z = list.find(z => z.nom.toUpperCase() === zoneLabel)
      setZoneId(z ? z.id : null)
    }).catch(() => {})
    getRegions().then(res => setRegions(res.data.results ?? res.data)).catch(() => {})
    getDepartements().then(res => setDepartements(res.data.results ?? res.data)).catch(() => {})
  }, [zoneLabel])

  useEffect(() => {
    if (zoneId == null) return
    getVagues({ zone: zoneId }).then(res => setVagues(res.data.results ?? res.data)).catch(() => {})
  }, [zoneId])

  const filtres = {
    zone: zoneId ?? undefined,
    type_traitement: typeTraitement || undefined,
    region: regionFiltre || undefined,
    departement: departementFiltre || undefined,
    vague: vagueFiltre || undefined,
    date_debut: dateDebut || undefined,
    date_fin: dateFin || undefined,
  }

  const load = useCallback(async () => {
    if (zoneId == null) return
    setLoading(true); setError(null)
    try {
      const [rRes, dRes] = await Promise.all([
        getRapportsBureau({ ...filtres, ordering, page, page_size: pageSize }),
        getDashboardBureau(filtres),
      ])
      setData(rRes.data)
      setDashboard(dRes.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId, typeTraitement, regionFiltre, departementFiltre, vagueFiltre, dateDebut, dateFin, ordering, page, pageSize])

  useEffect(() => { load() }, [load])

  const toggleSort = (champ) => {
    setOrdering(o => (o === champ ? `-${champ}` : champ))
    setPage(1)
  }

  const handleExport = async () => {
    try {
      const res = await exportRapportsBureau(filtres)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'rapports_bureau.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const departementsFiltres = regionFiltre
    ? departements.filter(d => String(d.region) === regionFiltre)
    : departements

  const rows = data?.results ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const SortIcon = ({ champ }) => {
    if (ordering === champ) return <ChevronUp size={11} />
    if (ordering === `-${champ}`) return <ChevronDown size={11} />
    return null
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.teal}18` }}>
            <Building2 size={18} style={{ color: C.teal }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: C.text }}>Planning Bureau</h1>
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              Suivi quotidien des traitements ZIP/Shape et éditions PDF
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {peutCreer && (
            <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
                    style={{ backgroundColor: C.teal, color: '#fff' }}>
              <Plus size={13} /> Nouveau rapport
            </button>
          )}
          <button onClick={load} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" style={{ color: C.muted }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tableau de bord */}
      <div className="flex flex-wrap gap-3 mb-4 flex-shrink-0">
        <PeriodeCard titre="Aujourd'hui" data={dashboard?.aujourd_hui} />
        <PeriodeCard titre="Cette semaine" data={dashboard?.cette_semaine} />
        <PeriodeCard titre="Ce mois" data={dashboard?.ce_mois} />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-3 mb-3 flex-shrink-0" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex flex-wrap gap-2 items-end">
          <FilterSelect label="Type" value={typeTraitement} onChange={v => { setTypeTraitement(v); setPage(1) }}
            options={[{ value: 'ZIP_SHAPE', label: 'ZIP / Shape' }, { value: 'PDF', label: 'Édition PDF' }]} />
          <FilterSelect label="Région" value={regionFiltre}
            onChange={v => { setRegionFiltre(v); setDepartementFiltre(''); setPage(1) }}
            options={regions.map(r => ({ value: String(r.id), label: r.nom }))} />
          <FilterSelect label="Département" value={departementFiltre}
            onChange={v => { setDepartementFiltre(v); setPage(1) }}
            options={departementsFiltres.map(d => ({ value: String(d.id), label: d.nom }))} />
          <FilterSelect label="Vague" value={vagueFiltre} onChange={v => { setVagueFiltre(v); setPage(1) }}
            options={vagues.map(v => ({ value: String(v.id), label: v.nom }))} />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>Du</label>
            <input type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setPage(1) }}
                   className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none"
                   style={{ borderColor: C.border, color: C.text }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>Au</label>
            <input type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setPage(1) }}
                   className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none"
                   style={{ borderColor: C.border, color: C.text }} />
          </div>

          {(typeTraitement || regionFiltre || departementFiltre || vagueFiltre || dateDebut || dateFin) && (
            <button onClick={() => { setTypeTraitement(''); setRegionFiltre(''); setDepartementFiltre(''); setVagueFiltre(''); setDateDebut(''); setDateFin(''); setPage(1) }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] hover:bg-gray-100" style={{ color: C.muted }}>
              <X size={12} /> Effacer
            </button>
          )}

          <button onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold ml-auto"
                  style={{ backgroundColor: `${C.teal}12`, color: C.teal }}>
            <Download size={12} /> Exporter Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 mb-3 flex-shrink-0 text-[11.5px] flex gap-2 items-start"
             style={{ backgroundColor: '#fff1f0', border: '1px solid #fca5a5', color: '#991b1b' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="flex-1 min-h-0 bg-white rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex-1 overflow-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                {[
                  { key: 'date', label: 'Date', sort: true },
                  { key: 'agent_nom', label: 'Agent' },
                  { key: 'type_traitement', label: 'Type' },
                  { key: 'vague_nom', label: 'Vague' },
                  { key: 'nb_parcelles', label: 'Nb parcelles', sort: true },
                  { key: 'superficie_totale', label: 'Superficie (ha)', sort: true },
                  { key: 'region_nom', label: 'Région' },
                  { key: 'departement_nom', label: 'Département' },
                  { key: 'zone_nom', label: 'Zone' },
                ].map(col => (
                  <th key={col.key}
                      onClick={col.sort ? () => toggleSort(col.key) : undefined}
                      style={{
                        padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted,
                        borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
                        cursor: col.sort ? 'pointer' : 'default',
                      }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      {col.label} {col.sort && <SortIcon champ={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: C.light }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    Chargement…
                  </div>
                </td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: C.light, fontSize: 13 }}>
                  Aucun rapport pour ces critères.
                </td></tr>
              )}
              {!loading && rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.agent_nom ?? '—'}</td>
                  <td style={{ padding: '6px 12px' }}><TypeBadge value={r.type_traitement} /></td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.vague_nom ?? '—'}</td>
                  <td style={{ padding: '6px 12px' }}>{r.nb_parcelles}</td>
                  <td style={{ padding: '6px 12px' }}>{r.superficie_totale?.toLocaleString('fr-CI')}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.region_nom ?? '—'}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.departement_nom ?? '—'}</td>
                  <td style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}>{r.zone_nom ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
             style={{ borderTop: `1px solid ${C.border}`, backgroundColor: '#fafafa' }}>
          <div className="flex items-center gap-2 text-[11.5px]" style={{ color: C.muted }}>
            <span>Lignes / page :</span>
            {PAGE_SIZES.map(ps => (
              <button key={ps} onClick={() => { setPageSize(ps); setPage(1) }}
                      className="px-2 py-0.5 rounded"
                      style={{ fontWeight: pageSize === ps ? 700 : 400, backgroundColor: pageSize === ps ? C.navy : 'transparent', color: pageSize === ps ? '#fff' : C.muted }}>
                {ps}
              </button>
            ))}
          </div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>
            {total > 0 && (
              <span>{((page - 1) * pageSize + 1)}–{Math.min(page * pageSize, total)} / {total}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30" style={{ color: '#374151' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11.5px] font-medium px-2" style={{ color: '#374151' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30" style={{ color: '#374151' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <NouveauRapportModal
          zoneId={zoneId} zoneLabel={zoneLabel}
          regions={regions} departements={departements} vagues={vagues}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

/* ── Modale « Nouveau rapport » ─────────────────────────────────── */
function NouveauRapportModal({ zoneId, zoneLabel, regions, departements, vagues, onClose, onCreated }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    region: '', departement: '', vague: '', type_traitement: 'ZIP_SHAPE', observations: '',
  })
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resultat, setResultat] = useState(null)
  const fileRef = useRef(null)

  const departementsFiltres = form.region
    ? departements.filter(d => String(d.region) === form.region)
    : departements

  const pickFile = (f) => {
    if (!f) return
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setError('Le fichier doit être un classeur Excel (.xlsx ou .xls).')
      return
    }
    setError(null)
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!form.date) { setError('La date est requise.'); return }
    if (!form.region) { setError('La région est requise.'); return }
    if (!form.departement) { setError('Le département est requis.'); return }
    if (!file) { setError('Veuillez sélectionner le fichier Excel.'); return }

    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('date', form.date)
      fd.append('zone', zoneId)
      fd.append('region', form.region)
      fd.append('departement', form.departement)
      if (form.vague) fd.append('vague', form.vague)
      fd.append('type_traitement', form.type_traitement)
      fd.append('fichier', file)
      if (form.observations) fd.append('observations', form.observations)
      const res = await createRapportBureau(fd)
      setResultat(res.data)
    } catch (e) {
      const msg = e?.response?.data
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : "Erreur lors de l'envoi.")
    } finally {
      setLoading(false)
    }
  }

  const accent = TYPE_TRAITEMENT_STYLE[form.type_traitement]?.text ?? C.teal

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: C.card, borderRadius: 16, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(15,23,42,0.2)',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${accent}12`, position: 'sticky', top: 0,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Nouveau rapport journalier</p>
            <p style={{ fontSize: 11.5, color: C.muted }}>Zone {zoneLabel === 'CAVALLY' ? 'Cavally' : 'Worodougou'}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!resultat && (
            <>
              {/* Type de traitement */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>
                  Type de traitement
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(TYPE_TRAITEMENT_STYLE).map(([key, s]) => (
                    <button key={key} onClick={() => setForm(v => ({ ...v, type_traitement: key }))}
                            style={{
                              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                              border: `1.5px solid ${form.type_traitement === key ? s.text : C.border}`,
                              background: form.type_traitement === key ? `${s.text}10` : '#fff',
                              color: form.type_traitement === key ? s.text : C.muted,
                              fontSize: 12.5, fontWeight: 600,
                            }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))}
                         style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>Vague</label>
                  <select value={form.vague} onChange={e => setForm(v => ({ ...v, vague: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
                    <option value="">—</option>
                    {vagues.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>Région *</label>
                  <select value={form.region} onChange={e => setForm(v => ({ ...v, region: e.target.value, departement: '' }))}
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
                    <option value="">Choisir…</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>Département *</label>
                  <select value={form.departement} onChange={e => setForm(v => ({ ...v, departement: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}>
                    <option value="">Choisir…</option>
                    {departementsFiltres.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>
                  Fichier Excel du traitement *
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]) }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? accent : C.border}`, borderRadius: 12,
                    padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? `${accent}08` : '#fafafa',
                  }}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                         onChange={e => pickFile(e.target.files[0])} />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color={C.success} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} style={{ color: C.light, margin: '0 auto 6px' }} />
                      <p style={{ fontSize: 12, color: C.muted }}>Glissez-déposez le fichier ici, ou cliquez pour parcourir</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>
                  Observations
                </label>
                <textarea value={form.observations} onChange={e => setForm(v => ({ ...v, observations: e.target.value }))}
                          rows={2}
                          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#991b1b' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </>
          )}

          {resultat && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, background: `${C.success}12` }}>
                <CheckCircle2 size={20} color={C.success} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Rapport enregistré</p>
                  <p style={{ fontSize: 11.5, color: C.muted }}>
                    {resultat.nb_parcelles} {form.type_traitement === 'PDF' ? 'PDF' : 'parcelle(s)'} · {resultat.superficie_totale.toLocaleString('fr-CI')} ha
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onCreated} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Fermer et rafraîchir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
