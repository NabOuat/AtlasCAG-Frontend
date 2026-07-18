import { useEffect, useState, useCallback } from 'react'
import { FileText, ChevronLeft, ChevronRight, RefreshCw, Search, AlertTriangle, X } from 'lucide-react'
import { getCfParcelles } from '@/api/geo'

const ZONES = [
  { key: 'cavally',    label: 'Cavally' },
  { key: 'worodougou', label: 'Worodougou' },
]

const STATUTS = [
  { key: '',                 label: 'Tous les statuts' },
  { key: 'LEVE',            label: 'Levé',             color: '#F59E0B' },
  { key: 'PROV',            label: 'Provisoire',        color: '#38BDF8' },
  { key: 'DEF',             label: 'Définitif',         color: '#E06B2F' },
  { key: 'EXISTANT',        label: 'Existant',          color: '#9B59B6' },
  { key: 'EN_PUBLICITE',    label: 'En publicité',      color: '#EC4899' },
  { key: 'APRES_PUBLICITE', label: 'Après publicité',   color: '#A78BFA' },
  { key: 'REJETE',          label: 'Rejeté',            color: '#EF4444' },
]

const STATUT_COLOR = Object.fromEntries(STATUTS.filter(s => s.color).map(s => [s.key, s.color]))

const COLUMNS = [
  { key: 'NUM_DEMAND', label: 'N° Demande',       width: 120 },
  { key: 'NOM_REGION', label: 'Région',            width: 120 },
  { key: 'NOM_DEPART', label: 'Département',       width: 130 },
  { key: 'NOM_SSPREF', label: 'Sous-préfecture',   width: 140 },
  { key: 'NOM_VILLAGE',label: 'Village',           width: 120 },
  { key: 'NOM_DEMAND', label: 'Demandeur',         width: 150 },
  { key: 'SUPERF',     label: 'Superficie (ha)',   width: 110, numeric: true },
  { key: 'PERIM',      label: 'Périmètre (m)',     width: 110, numeric: true },
  { key: 'NOM_PROJET', label: 'Projet',            width: 120 },
  { key: 'NOM_OTA',    label: 'Opérateur (OTA)',   width: 140 },
  { key: '_statut',    label: 'Statut',            width: 130 },
  { key: 'N_DEMCGE',   label: 'N° CGE',            width: 90  },
]

const PAGE_SIZES = [50, 100, 200]

function StatutBadge({ statut }) {
  const color = STATUT_COLOR[statut] ?? '#6b7280'
  const labels = {
    LEVE:            'Levé',
    PROV:            'Provisoire',
    DEF:             'Définitif',
    EXISTANT:        'Existant',
    EN_PUBLICITE:    'En publicité',
    APRES_PUBLICITE: 'Après publicité',
    REJETE:          'Rejeté',
  }
  return (
    <span style={{
      background: color + '20',
      color,
      border: `1px solid ${color}55`,
      padding: '2px 8px',
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {labels[statut] ?? statut}
    </span>
  )
}

export default function CfParcelles() {
  const [zone,      setZone]      = useState('cavally')
  const [statut,    setStatut]    = useState('')
  const [region,    setRegion]    = useState('')
  const [dept,      setDept]      = useState('')
  const [sousPref,  setSousPref]  = useState('')
  const [village,   setVillage]   = useState('')
  const [page,      setPage]      = useState(1)
  const [pageSize,  setPageSize]  = useState(100)
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  const load = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCfParcelles(params.zone, {
        statut:      params.statut      || undefined,
        region:      params.region      || undefined,
        departement: params.dept        || undefined,
        sous_pref:   params.sousPref    || undefined,
        village:     params.village     || undefined,
        page:        params.page,
        page_size:   params.pageSize,
      })
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load({ zone, statut, region, dept, sousPref, village, page, pageSize })
  }, [zone, statut, region, dept, sousPref, village, page, pageSize, load])

  const handleZoneChange = (z) => { setZone(z); setPage(1) }
  const handleStatutChange = (s) => { setStatut(s); setPage(1) }
  const handleSearch = () => { setPage(1); load({ zone, statut, region, dept, sousPref, village, page: 1, pageSize }) }
  const clearFilters = () => { setRegion(''); setDept(''); setSousPref(''); setVillage(''); setStatut(''); setPage(1) }

  const rows        = data?.results ?? []
  const total       = data?.total   ?? 0
  const totalPages  = Math.max(1, Math.ceil(total / pageSize))
  const totByStatut = data?.totals_by_statut ?? {}

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ backgroundColor: '#E06B2F18' }}>
            <FileText size={18} style={{ color: '#E06B2F' }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: '#1a2536' }}>Certificats Fonciers</h1>
            <p className="text-[11.5px]" style={{ color: '#6b7280' }}>
              Table attributaire — toutes les parcelles CF par stade
            </p>
          </div>
        </div>
        <button onClick={() => load({ zone, statut, region, dept, sousPref, village, page, pageSize })}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
                style={{ color: '#6b7280' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-xl p-3 mb-3 flex-shrink-0"
           style={{ border: '1px solid #f0f0f0' }}>
        <div className="flex flex-wrap gap-2 items-end">

          {/* Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Zone</label>
            <div className="flex gap-1">
              {ZONES.map(z => (
                <button key={z.key} onClick={() => handleZoneChange(z.key)}
                        className="px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all"
                        style={{
                          backgroundColor: zone === z.key ? '#1a2536' : '#f3f4f6',
                          color: zone === z.key ? '#fff' : '#374151',
                        }}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Statut</label>
            <select value={statut} onChange={e => handleStatutChange(e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none"
                    style={{ borderColor: '#e5e7eb', color: '#374151', backgroundColor: '#fff' }}>
              {STATUTS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Région */}
          <FilterInput label="Région"       value={region}   onChange={setRegion}   onSearch={handleSearch} />
          <FilterInput label="Département"  value={dept}     onChange={setDept}     onSearch={handleSearch} />
          <FilterInput label="Sous-préf."   value={sousPref} onChange={setSousPref} onSearch={handleSearch} />
          <FilterInput label="Village"      value={village}  onChange={setVillage}  onSearch={handleSearch} />

          <button onClick={handleSearch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all"
                  style={{ backgroundColor: '#1a2536', color: '#fff' }}>
            <Search size={12} /> Filtrer
          </button>

          {(region || dept || sousPref || village || statut) && (
            <button onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11.5px] transition-all hover:bg-gray-100"
                    style={{ color: '#6b7280' }}>
              <X size={12} /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Résumé par statut */}
      {Object.keys(totByStatut).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
          {Object.entries(totByStatut).map(([s, n]) => (
            <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                 style={{ backgroundColor: (STATUT_COLOR[s] ?? '#6b7280') + '15', color: STATUT_COLOR[s] ?? '#6b7280', border: `1px solid ${(STATUT_COLOR[s] ?? '#6b7280')}33` }}>
              <span>{n.toLocaleString('fr-CI')}</span>
              <span style={{ opacity: 0.7 }}>{s.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
               style={{ backgroundColor: '#1a253615', color: '#1a2536', border: '1px solid #1a253633' }}>
            {total.toLocaleString('fr-CI')} total
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-xl p-3 mb-3 flex-shrink-0 text-[11.5px] flex gap-2 items-start"
             style={{ backgroundColor: '#fff1f0', border: '1px solid #fca5a5', color: '#991b1b' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="flex-1 min-h-0 bg-white rounded-xl overflow-hidden flex flex-col"
           style={{ border: '1px solid #f0f0f0' }}>

        <div className="flex-1 overflow-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                {COLUMNS.map(col => (
                  <th key={col.key}
                      style={{
                        padding: '8px 12px',
                        textAlign: col.numeric ? 'right' : 'left',
                        fontWeight: 700,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb',
                        whiteSpace: 'nowrap',
                        minWidth: col.width,
                      }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Chargement…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 13 }}>
                    Aucune parcelle CF pour ces critères.
                  </td>
                </tr>
              )}
              {!loading && rows.map((row, i) => (
                <tr key={i}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  {COLUMNS.map(col => (
                    <td key={col.key}
                        style={{
                          padding: '6px 12px',
                          color: '#374151',
                          textAlign: col.numeric ? 'right' : 'left',
                          whiteSpace: 'nowrap',
                        }}>
                      {col.key === '_statut'
                        ? <StatutBadge statut={row._statut} />
                        : col.numeric && row[col.key] != null
                          ? (+row[col.key]).toLocaleString('fr-CI', { maximumFractionDigits: 4 })
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
             style={{ borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
          <div className="flex items-center gap-2 text-[11.5px]" style={{ color: '#6b7280' }}>
            <span>Lignes / page :</span>
            {PAGE_SIZES.map(ps => (
              <button key={ps} onClick={() => { setPageSize(ps); setPage(1) }}
                      className="px-2 py-0.5 rounded"
                      style={{
                        fontWeight: pageSize === ps ? 700 : 400,
                        backgroundColor: pageSize === ps ? '#1a2536' : 'transparent',
                        color: pageSize === ps ? '#fff' : '#6b7280',
                      }}>
                {ps}
              </button>
            ))}
          </div>
          <div className="text-[11.5px]" style={{ color: '#6b7280' }}>
            {total > 0 && (
              <span>
                {((page - 1) * pageSize + 1).toLocaleString('fr-CI')}–
                {Math.min(page * pageSize, total).toLocaleString('fr-CI')}
                {' '}/ {total.toLocaleString('fr-CI')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30"
                    style={{ color: '#374151' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11.5px] font-medium px-2" style={{ color: '#374151' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30"
                    style={{ color: '#374151' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterInput({ label, value, onChange, onSearch }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch()}
        placeholder={label}
        className="rounded-lg px-2 py-1.5 text-[11.5px] border outline-none focus:ring-1"
        style={{ borderColor: '#e5e7eb', color: '#374151', width: 110, backgroundColor: '#fff' }}
      />
    </div>
  )
}
