import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ClipboardCheck, ChevronLeft, ChevronRight, RefreshCw, Search, AlertTriangle,
  X, Upload, FileSpreadsheet, Loader2, CheckCircle2,
} from 'lucide-react'
import { getSuiviCF, importAdsFile } from '@/api/dossiers'
import { getZones } from '@/api/referentiel'
import { C, STATUT_CF_STYLE, AVANCEMENT_CF_STYLE } from '@/utils/theme'

const PAGE_SIZES = [25, 50, 100, 200]

function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function StyleBadge({ value, styles }) {
  const s = styles[value] ?? { bg: '#f3f4f6', text: '#6b7280', label: value ?? '—' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '2px 8px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

const COLUMNS = [
  { key: 'numero_dossier',  label: 'N° Dossier',       width: 120 },
  { key: 'num_demand',      label: 'Code parcelle',    width: 130 },
  { key: 'region_nom',      label: 'Région',           width: 110 },
  { key: 'departement_nom', label: 'Département',      width: 120 },
  { key: 'sous_prefecture', label: 'Sous-préfecture',  width: 130 },
  { key: 'village_nom',     label: 'Village',          width: 120 },
  { key: 'nom_demandeur',   label: 'Demandeur',        width: 150 },
  { key: 'date_enquete',    label: 'Date enquête',     width: 100, date: true },
  { key: 'date_levee',      label: 'Date levée',       width: 100, date: true },
  { key: 'date_pvcl',       label: 'Date PVCL',        width: 100, date: true },
  { key: 'date_rdc',        label: 'Date RDC',         width: 100, date: true },
  { key: 'date_publicite',  label: 'Date publicité',   width: 100, date: true },
  { key: 'avancement_cf',   label: 'Avancement',       width: 130, badge: 'avancement' },
  { key: 'statut_cf',       label: 'Statut',           width: 120, badge: 'statut' },
]

export default function SuiviCF() {
  const [zones,     setZones]     = useState([])
  const [zone,      setZone]      = useState('')
  const [statutCf,  setStatutCf]  = useState('')
  const [sousPref,  setSousPref]  = useState('')
  const [village,   setVillage]   = useState('')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [pageSize,  setPageSize]  = useState(25)
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    getZones().then(res => setZones(res.data.results ?? res.data)).catch(() => {})
  }, [])

  const load = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSuiviCF({
        zone:      params.zone      || undefined,
        statut_cf: params.statutCf  || undefined,
        sous_pref: params.sousPref  || undefined,
        village:   params.village   || undefined,
        search:    params.search    || undefined,
        page:      params.page,
        page_size: params.pageSize,
      })
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load({ zone, statutCf, sousPref, village, search, page, pageSize })
  }, [zone, statutCf, sousPref, village, search, page, pageSize, load])

  const handleSearch = () => { setPage(1); load({ zone, statutCf, sousPref, village, search, page: 1, pageSize }) }
  const clearFilters = () => { setZone(''); setStatutCf(''); setSousPref(''); setVillage(''); setSearch(''); setPage(1) }
  const reload = () => load({ zone, statutCf, sousPref, village, search, page, pageSize })

  const rows       = data?.results ?? []
  const total      = data?.count   ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ backgroundColor: `${C.primary}18` }}>
            <ClipboardCheck size={18} style={{ color: C.primary }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: C.text }}>Suivi CF</h1>
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              Avancement des dossiers CF — PVCL, RDC, Publicité
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
                  style={{ backgroundColor: C.primary, color: '#fff' }}>
            <Upload size={13} /> Charger un fichier ADS
          </button>
          <button onClick={reload}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
                  style={{ color: C.muted }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-xl p-3 mb-3 flex-shrink-0" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex flex-wrap gap-2 items-end">

          {/* Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>Zone</label>
            <div className="flex gap-1">
              <button onClick={() => { setZone(''); setPage(1) }}
                      className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
                      style={{ backgroundColor: zone === '' ? C.navy : '#f3f4f6', color: zone === '' ? '#fff' : '#374151' }}>
                Toutes
              </button>
              {zones.map(z => (
                <button key={z.id} onClick={() => { setZone(String(z.id)); setPage(1) }}
                        className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
                        style={{ backgroundColor: zone === String(z.id) ? C.navy : '#f3f4f6', color: zone === String(z.id) ? '#fff' : '#374151' }}>
                  {z.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>Statut</label>
            <select value={statutCf} onChange={e => { setStatutCf(e.target.value); setPage(1) }}
                    className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none"
                    style={{ borderColor: C.border, color: C.text, backgroundColor: '#fff' }}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_CF_STYLE).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>

          <FilterInput label="Sous-préf."  value={sousPref} onChange={setSousPref} onSearch={handleSearch} />
          <FilterInput label="Village"     value={village}  onChange={setVillage}  onSearch={handleSearch} />
          <FilterInput label="Recherche" value={search} onChange={setSearch} onSearch={handleSearch}
                       placeholder="N° dossier, code, demandeur…" width={180} />

          <button onClick={handleSearch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
                  style={{ backgroundColor: C.navy, color: '#fff' }}>
            <Search size={12} /> Filtrer
          </button>

          {(zone || statutCf || sousPref || village || search) && (
            <button onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] transition-all hover:bg-gray-100"
                    style={{ color: C.muted }}>
              <X size={12} /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
             style={{ backgroundColor: `${C.navy}15`, color: C.navy, border: `1px solid ${C.navy}33` }}>
          {total.toLocaleString('fr-CI')} dossier{total > 1 ? 's' : ''}
        </div>
      </div>

      {/* Erreur */}
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
                {COLUMNS.map(col => (
                  <th key={col.key}
                      style={{
                        padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.05em', color: C.muted,
                        borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', minWidth: col.width,
                      }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '40px 20px', color: C.light }}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Chargement…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '40px 20px', color: C.light, fontSize: 13 }}>
                    Aucun dossier CF pour ces critères.
                  </td>
                </tr>
              )}
              {!loading && rows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  {COLUMNS.map(col => (
                    <td key={col.key} style={{ padding: '6px 12px', color: '#374151', whiteSpace: 'nowrap' }}>
                      {col.badge === 'avancement'
                        ? <StyleBadge value={row.avancement_cf} styles={AVANCEMENT_CF_STYLE} />
                        : col.badge === 'statut'
                          ? <StyleBadge value={row.statut_cf} styles={STATUT_CF_STYLE} />
                          : col.date
                            ? fmtDate(row[col.key])
                            : row[col.key] ?? '—'
                      }
                    </td>
                  ))}
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
                      style={{
                        fontWeight: pageSize === ps ? 700 : 400,
                        backgroundColor: pageSize === ps ? C.navy : 'transparent',
                        color: pageSize === ps ? '#fff' : C.muted,
                      }}>
                {ps}
              </button>
            ))}
          </div>
          <div className="text-[11.5px]" style={{ color: C.muted }}>
            {total > 0 && (
              <span>
                {((page - 1) * pageSize + 1).toLocaleString('fr-CI')}–
                {Math.min(page * pageSize, total).toLocaleString('fr-CI')}
                {' '}/ {total.toLocaleString('fr-CI')}
              </span>
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

      {showImport && (
        <ImportAdsModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); reload() }}
        />
      )}
    </div>
  )
}

function FilterInput({ label, value, onChange, onSearch, placeholder, width = 110 }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.light }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
        placeholder={placeholder ?? label}
        className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none focus:ring-1"
        style={{ borderColor: C.border, color: C.text, width, backgroundColor: '#fff' }}
      />
    </div>
  )
}

/* ── Modale d'import ADS ────────────────────────────────────────── */
function ImportAdsModal({ onClose, onImported }) {
  const [file,    setFile]    = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [rapport, setRapport] = useState(null)
  const fileRef = useRef(null)

  const pickFile = (f) => {
    if (!f) return
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setError('Le fichier doit être un classeur Excel (.xlsx ou .xls).')
      return
    }
    setError(null)
    setFile(f)
  }

  const handleImport = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier.'); return }
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('fichier', file)
      const res = await importAdsFile(fd)
      setRapport(res.data)
    } catch (e) {
      const msg = e?.response?.data?.detail ?? e?.message
      setError(typeof msg === 'string' ? msg : "Erreur lors de l'import.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: C.card, borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 48px rgba(15,23,42,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${C.primary}12`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={18} color={C.primary} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Charger un fichier ADS</p>
              <p style={{ fontSize: 11.5, color: C.muted }}>Export DigiFor — met à jour le suivi des dossiers CF existants</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!rapport && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? C.primary : C.border}`,
                  borderRadius: 12, padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? `${C.primary}08` : '#fafafa',
                }}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                       onChange={e => pickFile(e.target.files[0])} />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color={C.success} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload size={22} style={{ color: C.light, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12.5, color: C.muted }}>
                      Glissez-déposez le fichier ADS ici, ou cliquez pour parcourir
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#991b1b' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{
                  padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: '#fff', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Annuler
                </button>
                <button onClick={handleImport} disabled={loading || !file} style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: loading || !file ? 'not-allowed' : 'pointer',
                  opacity: loading || !file ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Importer
                </button>
              </div>
            </>
          )}

          {rapport && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 14, borderRadius: 10, background: `${C.success}12`,
              }}>
                <CheckCircle2 size={20} color={C.success} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    {rapport.crees ?? 0} dossier{(rapport.crees ?? 0) > 1 ? 's' : ''} créé{(rapport.crees ?? 0) > 1 ? 's' : ''}
                    {' · '}
                    {rapport.mis_a_jour} mis à jour
                  </p>
                  <p style={{ fontSize: 11.5, color: C.muted }}>
                    sur {rapport.total_lignes} ligne{rapport.total_lignes > 1 ? 's' : ''} lues
                  </p>
                </div>
              </div>

              {rapport.non_trouves?.length > 0 && (
                <div style={{ padding: 12, borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>
                    {rapport.non_trouves.length} identifiant{rapport.non_trouves.length > 1 ? 's' : ''} non trouvé{rapport.non_trouves.length > 1 ? 's' : ''}
                  </p>
                  <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 11.5, color: '#78350f', lineHeight: '18px' }}>
                    {rapport.non_trouves.join(', ')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onImported} style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
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
