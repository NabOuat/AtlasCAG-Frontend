import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FileCheck, RefreshCw, Search, X, Upload, CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react'
import { useZone } from '@/layouts/ZoneLayout'
import { getSuiviCF, importAdsFile, getVagues } from '@/api/dossiers'
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

const STATUT_CF = {
  LEVE:            { bg: '#fef3c7', text: '#92400e', label: 'Relevé terrain' },
  PROV:            { bg: '#e0f2fe', text: '#0369a1', label: 'Provisoire' },
  EN_PUBLICITE:    { bg: '#fce7f3', text: '#9d174d', label: 'En publicité' },
  APRES_PUBLICITE: { bg: '#ede9fe', text: '#6d28d9', label: 'Après publicité' },
  DEF:             { bg: '#ffedd5', text: '#c2410c', label: 'Définitif' },
  APPROUVE:        { bg: '#d1fae5', text: '#065f46', label: 'Approuvé' },
  VALIDE:          { bg: '#dcfce7', text: '#15803d', label: 'Validé' },
  REJETE:          { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté' },
}

function Badge({ map, value }) {
  if (!value) return <span className="text-[11px]" style={{ color: '#c0c4cc' }}>—</span>
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

export default function SuiviCF() {
  const zoneLabel = useZone() // 'CAVALLY' | 'WORODOUGOU'

  const [zoneId,   setZoneId]   = useState(null)
  const [vagues,   setVagues]   = useState([])
  const [dossiers, setDossiers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [filters, setFilters] = useState({ statut: '', statut_cf: '', vague_envoi: '', search: '' })

  // Résout l'ID numérique de la zone (référentiel) à partir du libellé de ZoneLayout.
  useEffect(() => {
    getZones().then(res => {
      const zones = res.data.results ?? res.data
      const match = zones.find(z => (z.nom || '').toUpperCase() === (zoneLabel || '').toUpperCase())
      setZoneId(match?.id ?? null)
    }).catch(() => setZoneId(null))
  }, [zoneLabel])

  const load = useCallback(async () => {
    if (!zoneId) return
    setLoading(true)
    setError(null)
    try {
      const [dosRes, vagRes] = await Promise.all([
        getSuiviCF({
          zone: zoneId,
          statut: filters.statut || undefined,
          statut_cf: filters.statut_cf || undefined,
          vague_envoi: filters.vague_envoi || undefined,
          search: filters.search || undefined,
        }),
        getVagues({ zone: zoneId, type_dossier: 'CF' }),
      ])
      setDossiers(dosRes.data.results ?? dosRes.data)
      setVagues(vagRes.data.results ?? vagRes.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? e.message)
    } finally {
      setLoading(false)
    }
  }, [zoneId, filters])

  useEffect(() => { load() }, [load])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const hasFilters = Object.values(filters).some(Boolean)
  const clearFilters = () => setFilters({ statut: '', statut_cf: '', vague_envoi: '', search: '' })

  const countByStatutCf = (code) => dossiers.filter(d => d.statut_cf === code).length

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#C75A2418' }}>
            <FileCheck size={18} style={{ color: C.orange }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: C.navy }}>Suivi CF</h1>
            <p className="text-[11.5px]" style={{ color: C.gray }}>
              Suivi administratif des dossiers CF — zone {zoneLabel?.toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  style={{ color: C.gray }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowImport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold transition-opacity hover:opacity-85"
                  style={{ backgroundColor: C.orange }}>
            <Upload size={14} />
            Importer fichier ADS
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total"        value={dossiers.length}              accent={C.navy} />
        <StatCard label="En publicité" value={countByStatutCf('EN_PUBLICITE')} accent="#9d174d" />
        <StatCard label="Approuvés"    value={countByStatutCf('APPROUVE')}   accent={C.teal} />
        <StatCard label="Validés"      value={countByStatutCf('VALIDE')}     accent={C.green} />
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl p-3 flex flex-wrap items-end gap-3" style={{ border: '1px solid #f0f0f0' }}>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#c0c4cc' }} />
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Numéro, village, demandeur…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border text-[12.5px] outline-none"
            style={{ borderColor: '#e5e7eb', color: '#1f2937' }}
          />
        </div>

        <select value={filters.statut} onChange={e => setFilter('statut', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.statut ? '#1f2937' : '#9ca3af' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select value={filters.statut_cf} onChange={e => setFilter('statut_cf', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.statut_cf ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les étapes CF</option>
          {Object.entries(STATUT_CF).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <select value={filters.vague_envoi} onChange={e => setFilter('vague_envoi', e.target.value)}
                className="px-3 py-2 rounded-lg border text-[12.5px] outline-none bg-white"
                style={{ borderColor: '#e5e7eb', color: filters.vague_envoi ? '#1f2937' : '#9ca3af' }}>
          <option value="">Toutes les vagues</option>
          {vagues.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters}
                  className="flex items-center gap-1 text-[12px] px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: '#ef4444' }}>
            <X size={12} /> Effacer
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-3 text-[11.5px] flex gap-2 items-start"
             style={{ backgroundColor: '#fff1f0', border: '1px solid #fca5a5', color: '#991b1b' }}>
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="grid text-[11px] font-bold uppercase tracking-wide px-5 py-3"
             style={{
               gridTemplateColumns: '1.4fr 1.1fr 0.9fr 1fr 1fr 1fr 0.9fr 0.8fr',
               backgroundColor: '#f8f9fb', color: C.gray, borderBottom: '1px solid #f0f0f0',
             }}>
          <span>Numéro</span>
          <span>Village</span>
          <span>Statut</span>
          <span>Étape CF</span>
          <span>Vague</span>
          <span>N° demande</span>
          <span>Superficie (ha)</span>
          <span>Créé le</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
          </div>
        ) : dossiers.length === 0 ? (
          <div className="text-center py-16">
            <FileCheck size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            <p className="text-[13px]" style={{ color: C.gray }}>Aucun dossier CF pour ces critères.</p>
          </div>
        ) : dossiers.map((d, idx) => (
          <div key={d.id}
               className="grid items-center px-5 py-3 hover:bg-gray-50 transition-colors"
               style={{
                 gridTemplateColumns: '1.4fr 1.1fr 0.9fr 1fr 1fr 1fr 0.9fr 0.8fr',
                 borderBottom: idx < dossiers.length - 1 ? '1px solid #f5f5f5' : 'none',
               }}>
            <span className="text-[12.5px] font-semibold" style={{ color: C.navy }}>{d.numero_dossier}</span>
            <span className="text-[12.5px]" style={{ color: '#444' }}>{d.village_nom}</span>
            <Badge map={STATUT} value={d.statut} />
            <Badge map={STATUT_CF} value={d.statut_cf} />
            <span className="text-[12px]" style={{ color: C.gray }}>{d.vague_envoi_nom ?? '—'}</span>
            <span className="text-[12px]" style={{ color: C.gray }}>{d.num_demand || '—'}</span>
            <span className="text-[12.5px]" style={{ color: '#374151' }}>
              {d.superficie_parcelle != null ? Number(d.superficie_parcelle).toLocaleString('fr-CI', { maximumFractionDigits: 2 }) : '—'}
            </span>
            <span className="text-[11.5px]" style={{ color: C.gray }}>{dayjs(d.cree_le).format('DD/MM/YY')}</span>
          </div>
        ))}
      </div>

      {showImport && (
        <ImportADSModal
          zoneId={zoneId}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); load() }}
        />
      )}
    </div>
  )
}

function ImportADSModal({ zoneId, onClose, onSuccess }) {
  const fileRef = useRef(null)
  const [file, setFile]       = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [result, setResult]   = useState(null)

  const pickFile = (f) => { if (f) setFile(f) }
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const fd = new FormData()
      fd.append('fichier', file)
      fd.append('zone', zoneId)
      const res = await importAdsFile(fd)
      setResult(res.data)
    } catch (e) {
      const msg = e?.response?.data
      setError(typeof msg === 'object' ? (msg.detail ?? Object.values(msg).flat().join(' ')) : 'Erreur lors de l\'envoi.')
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
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 48px rgba(15,23,42,0.2)', overflow: 'hidden' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${C.orange}10` }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Importer un fichier ADS</p>
            <p style={{ fontSize: 12, color: C.gray }}>Excel (.xlsx) ou CSV — création/mise à jour en masse de dossiers CF</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray, cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!result && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? C.orange : file ? C.green : '#e2e8f0'}`,
                  borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? `${C.orange}08` : file ? '#f0fdf4' : '#fafafa',
                }}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <CheckCircle2 size={20} color={C.green} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{file.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.gray }}>
                      Glisser-déposer ou <span style={{ color: C.orange }}>parcourir</span>
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>.xlsx, .csv</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }}
                  onChange={e => pickFile(e.target.files?.[0])} />
              </div>

              {error && (
                <div className="text-[11.5px] flex gap-2 items-start" style={{ color: '#991b1b' }}>
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading || !file}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-[13px] font-semibold disabled:opacity-50"
                      style={{ backgroundColor: C.orange }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {loading ? 'Import en cours…' : 'Importer'}
              </button>
            </>
          )}

          {result && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Créés"  value={result.created} accent={C.green} />
                <StatCard label="MAJ"    value={result.updated} accent={C.teal} />
                <StatCard label="Erreurs" value={result.errors.length} accent="#ef4444" />
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-lg" style={{ border: '1px solid #fca5a5' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-[11.5px] px-3 py-2" style={{ borderBottom: '1px solid #fee2e2', color: '#991b1b' }}>
                      Ligne {e.row}{e.numero_dossier ? ` (${e.numero_dossier})` : ''} — {e.message}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={onSuccess}
                      className="py-2.5 rounded-lg text-white text-[13px] font-semibold"
                      style={{ backgroundColor: C.navy }}>
                Fermer et rafraîchir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
