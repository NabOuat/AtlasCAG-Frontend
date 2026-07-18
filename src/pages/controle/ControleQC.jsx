import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Shield, Search, FileText, X, ChevronRight, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, MapPin, Loader2,
  ExternalLink, Info, Database, Layers, Plus, Trash2,
} from 'lucide-react'
import { useZone } from '@/layouts/ZoneLayout'
import { getZones } from '@/api/referentiel'
import { getQcVillages, getQcDossiers, createControle } from '@/api/controle'
import { getCfDetail } from '@/api/geo'
import dayjs from 'dayjs'

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  navy:    '#1a2536',
  orange:  '#E06B2F',
  green:   '#2DA96A',
  red:     '#ef4444',
  blue:    '#3B82F6',
  gray:    '#6b7280',
  border:  '#e8eaed',
  bg:      '#f7f8fa',
  teal:    '#0d9488',
}

const STATUT_CF = {
  LEVE:            { label: 'Levé',           bg: '#fef3c7', color: '#b45309' },
  PROV:            { label: 'Provisoire',     bg: '#dbeafe', color: '#1d4ed8' },
  EN_PUBLICITE:    { label: 'En publicité',   bg: '#f3e8ff', color: '#7e22ce' },
  APRES_PUBLICITE: { label: 'Après pub.',     bg: '#ede9fe', color: '#6d28d9' },
  DEF:             { label: 'Définitif',      bg: '#dcfce7', color: '#15803d' },
  REJETE:          { label: 'Rejeté',         bg: '#fee2e2', color: '#b91c1c' },
}
const CTRL_STATUT = {
  VALIDE: { label: 'Validé',     bg: '#dcfce7', color: '#15803d' },
  REJETE: { label: 'Rejeté',     bg: '#fee2e2', color: '#b91c1c' },
  EN_COURS: { label: 'En cours', bg: '#fef9c3', color: '#b45309' },
}
const GRAVITE = {
  BLOQUANTE: { label: 'Bloquante', bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  MAJEURE:   { label: 'Majeure',   bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  MINEURE:   { label: 'Mineure',   bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af' },
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function pdfPath(url) {
  if (!url) return null
  try { return new URL(url).pathname }
  catch { return url }
}

function Badge({ map, value }) {
  const s = map?.[value]
  if (!s || !value) return null
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function KV({ label, value, highlight }) {
  if (value == null || value === '') return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginRight: 12, minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: highlight ? 700 : 600, color: highlight ? C.orange : C.navy, textAlign: 'right' }}>
        {typeof value === 'number' ? value.toLocaleString('fr-CI') : String(value)}
      </span>
    </div>
  )
}

const SKIP_FIELDS = new Set(['id', 'FID', 'Shape', 'SHAPE', 'SHAPE_1', '_source_table', '_schema', '_statut', '_exclude_from_bounds'])

const FIELD_LABELS = {
  NUM_DEMAND:'N° demande', NOM_DEMAND:'Demandeur', NOM_VILLAGE:'Village',
  NOM_REGION:'Région', NOM_DEPART:'Département', NOM_SSPREF:'Sous-préfecture',
  SUPERF:'Superficie (ha)', PERIM:'Périmètre (m)', NOM_PROJET:'Projet',
  NOM_OTA:'Opérateur', STATUT:'Statut', N_DEMCGE:'N° CGE',
  OCS:'Occupation du sol', SOUS_PREF:'Sous-préfecture', DEPARTMNT:'Département',
  Shape_Area:'Superficie (m²)', Shape_Leng:'Périmètre (m²)',
}

/* ── PDF Viewer ──────────────────────────────────────────────────── */
function PdfViewer({ url, nom }) {
  const path = pdfPath(url)
  if (!path) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.gray }}>
        <FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
        <p style={{ fontSize: 13 }}>Aucun fichier PDF</p>
      </div>
    )
  }
  return (
    <iframe
      src={path}
      title={nom ?? 'Plan PDF'}
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 0 }}
    />
  )
}

/* ── Anomalie row ────────────────────────────────────────────────── */
function AnomalieRow({ anomalie, onRemove }) {
  const g = GRAVITE[anomalie.gravite] ?? GRAVITE.MINEURE
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.dot, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 11.5, color: C.navy }}>{anomalie.description}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, backgroundColor: g.bg, color: g.color, flexShrink: 0 }}>
        {g.label}
      </span>
      <button onClick={onRemove} style={{ color: '#d1d5db', cursor: 'pointer', lineHeight: 1 }}>
        <Trash2 size={12} />
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MODAL DE CONTRÔLE
════════════════════════════════════════════════════════════════════ */
function ControleModal({ dossier, zone, onClose, onSaved }) {
  const [plan,        setPlan]        = useState(dossier.plans[0] ?? null)
  const [shpData,     setShpData]     = useState(null)
  const [shpLoading,  setShpLoading]  = useState(false)
  const [shpError,    setShpError]    = useState(null)
  const [anomalies,   setAnomalies]   = useState([])
  const [newAnomTxt,  setNewAnomTxt]  = useState('')
  const [newAnomGrav, setNewAnomGrav] = useState('MAJEURE')
  const [obs,         setObs]         = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveErr,     setSaveErr]     = useState(null)

  // Charger données shapefile dès l'ouverture
  useEffect(() => {
    if (!dossier.num_demand || !zone) return
    setShpLoading(true)
    setShpError(null)
    getCfDetail(zone.toLowerCase(), dossier.num_demand)
      .then(r => setShpData(r.data))
      .catch(e => setShpError(e?.response?.data?.detail ?? 'Erreur chargement shapefile'))
      .finally(() => setShpLoading(false))
  }, [dossier.num_demand, zone])

  const addAnomalie = () => {
    const t = newAnomTxt.trim()
    if (!t) return
    setAnomalies(a => [...a, { description: t, gravite: newAnomGrav, id: Date.now() }])
    setNewAnomTxt('')
  }

  const saveControle = async (statut) => {
    setSaving(true)
    setSaveErr(null)
    try {
      await createControle({
        dossier:      dossier.id,
        statut,
        observations: obs,
        anomalies:    anomalies.map(({ description, gravite }) => ({ description, gravite })),
      })
      onSaved?.()
      onClose()
    } catch (e) {
      setSaveErr(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? 'Erreur sauvegarde')
      setSaving(false)
    }
  }

  const shpRecord = shpData?.records?.[0] ?? null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      backdropFilter: 'blur(3px)',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 1400, height: '90vh',
        backgroundColor: '#fff', borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid ' + C.border,
          backgroundColor: C.navy, color: '#fff', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={17} color={C.orange} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 800 }}>
                Contrôle qualité — {dossier.numero_dossier}
              </p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                {dossier.village_nom} · {dossier.zone_nom}
              </p>
            </div>
            {dossier.statut_cf && <Badge map={STATUT_CF} value={dossier.statut_cf} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sélecteur plan si plusieurs */}
            {dossier.plans.length > 1 && (
              <select value={plan?.id ?? ''} onChange={e => setPlan(dossier.plans.find(p => p.id === +e.target.value))}
                      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {dossier.plans.map(p => <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.nom}</option>)}
              </select>
            )}
            <button onClick={onClose}
                    style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* ─ PDF ─ */}
          <div style={{ flex: '0 0 55%', borderRight: '1px solid ' + C.border, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, backgroundColor: '#fafafa' }}>
              <FileText size={12} color={C.orange} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>Plan PDF</span>
              {plan && (
                <a href={pdfPath(plan.fichier_url)} target="_blank" rel="noreferrer"
                   style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: C.blue, textDecoration: 'none' }}>
                  <ExternalLink size={10} /> Ouvrir
                </a>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <PdfViewer url={plan?.fichier_url} nom={plan?.nom} />
            </div>
          </div>

          {/* ─ Données + saisie ─ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>

            {/* DIGIFOR */}
            <div style={{ padding: 16, borderBottom: '1px solid ' + C.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Database size={12} color={C.teal} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.teal }}>DIGIFOR</span>
                <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>Données terrain / saisie</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {[
                  { label: 'N° dossier',     value: dossier.numero_dossier,      highlight: true },
                  { label: 'N° demande',      value: dossier.num_demand,          highlight: true },
                  { label: 'Demandeur',       value: dossier.nom_demandeur },
                  { label: 'N° CGE',          value: dossier.n_demcge },
                  { label: 'Superficie (ha)', value: dossier.superficie_parcelle != null ? (+dossier.superficie_parcelle).toFixed(4) : null },
                  { label: 'Périmètre (m)',   value: dossier.perimetre_parcelle  != null ? (+dossier.perimetre_parcelle).toFixed(2)  : null },
                  { label: 'Opérateur',       value: dossier.nom_ota },
                  { label: 'Occupation sol',  value: dossier.ocs },
                  { label: 'Boucle',          value: dossier.boucle },
                  { label: 'CD SP VIL',       value: dossier.cd_sp_vil },
                  { label: 'Classe précision',value: dossier.clas_preci },
                  { label: 'Point rattach.',  value: dossier.point_ratt },
                ].map(({ label, value, highlight }) => (
                  value ? (
                    <KV key={label} label={label} value={value} highlight={highlight} />
                  ) : null
                ))}
              </div>
            </div>

            {/* Shapefile */}
            <div style={{ padding: 16, borderBottom: '1px solid ' + C.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Layers size={12} color={C.orange} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.orange }}>Shapefile _Prov</span>
                {shpRecord && <Badge map={{ [shpRecord._statut]: { label: shpRecord._statut, bg: '#fef3c7', color: '#b45309' } }} value={shpRecord._statut} />}
                {!shpLoading && shpData && (
                  <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
                    {shpData.records?.length ?? 0} enregistrement{(shpData.records?.length ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {shpLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: C.gray, fontSize: 12 }}>
                  <Loader2 size={14} className="animate-spin" />Chargement données shapefile…
                </div>
              )}
              {shpError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: '#fff1f0', borderRadius: 8, fontSize: 11.5, color: '#b91c1c' }}>
                  <AlertTriangle size={12} />{shpError}
                </div>
              )}
              {!shpLoading && !shpError && !shpRecord && dossier.num_demand && (
                <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  Aucune donnée shapefile trouvée pour ce N° demande.
                </p>
              )}
              {!dossier.num_demand && (
                <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  N° demande non renseigné dans DIGIFOR — impossible de chercher dans le shapefile.
                </p>
              )}
              {shpRecord && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  {Object.entries(shpRecord)
                    .filter(([k, v]) => !SKIP_FIELDS.has(k) && v != null && v !== '')
                    .map(([k, v]) => {
                      const label = FIELD_LABELS[k] ?? k
                      const val   = k === 'SUPERF' ? (+v).toFixed(4) + ' ha' : k === 'PERIM' ? (+v).toFixed(2) + ' m' : String(v)
                      return <KV key={k} label={label} value={val} />
                    })}
                </div>
              )}
            </div>

            {/* Saisie anomalies */}
            <div style={{ padding: 16, borderBottom: '1px solid ' + C.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertTriangle size={12} color={C.red} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b91c1c' }}>Anomalies</span>
                {anomalies.length > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 99, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                    {anomalies.length}
                  </span>
                )}
              </div>

              {/* Liste */}
              {anomalies.map((a, i) => (
                <AnomalieRow key={a.id} anomalie={a} onRemove={() => setAnomalies(prev => prev.filter((_, j) => j !== i))} />
              ))}

              {/* Ajout */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <input value={newAnomTxt} onChange={e => setNewAnomTxt(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && addAnomalie()}
                       placeholder="Décrire l'anomalie…"
                       style={{ flex: 1, fontSize: 11.5, padding: '6px 10px', borderRadius: 8, border: '1px solid ' + C.border, outline: 'none' }} />
                <select value={newAnomGrav} onChange={e => setNewAnomGrav(e.target.value)}
                        style={{ fontSize: 11, padding: '6px 8px', borderRadius: 8, border: '1px solid ' + C.border, outline: 'none' }}>
                  <option value="BLOQUANTE">Bloquante</option>
                  <option value="MAJEURE">Majeure</option>
                  <option value="MINEURE">Mineure</option>
                </select>
                <button onClick={addAnomalie}
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Observations */}
            <div style={{ padding: 16, borderBottom: '1px solid ' + C.border }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.gray, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observations</p>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
                        placeholder="Observations générales sur ce dossier…"
                        style={{ width: '100%', fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid ' + C.border, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, backgroundColor: '#fafafa' }}>
              {saveErr && (
                <p style={{ flex: 1, fontSize: 11, color: '#b91c1c' }}>{saveErr}</p>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => saveControle('EN_COURS')} disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: '#f3f4f6', color: C.navy, cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid ' + C.border }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Info size={13} />}
                En cours
              </button>
              <button onClick={() => saveControle('REJETE')} disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c', cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid #fca5a5' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Rejeter
              </button>
              <button onClick={() => saveControle('VALIDE')} disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid #86efac' }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Valider
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════════ */
export default function ControleQC() {
  const zoneCtx = useZone()  // 'CAVALLY' | 'WORODOUGOU'

  const [zoneId,      setZoneId]      = useState(null)
  const [villages,    setVillages]    = useState([])
  const [villLoading, setVillLoading] = useState(false)
  const [selVillage,  setSelVillage]  = useState(null)
  const [dossiers,    setDossiers]    = useState([])
  const [dossLoading, setDossLoading] = useState(false)
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(null)  // dossier object

  // Résoudre l'ID de zone depuis le nom
  useEffect(() => {
    getZones().then(r => {
      const list = r.data.results ?? r.data
      const z    = list.find(z => z.nom.toLowerCase().includes(zoneCtx?.toLowerCase() ?? ''))
      setZoneId(z?.id ?? null)
    }).catch(() => {})
  }, [zoneCtx])

  // Charger villages
  const loadVillages = useCallback(() => {
    if (!zoneId) return
    setVillLoading(true)
    getQcVillages({ zone: zoneId })
      .then(r => setVillages(r.data.results ?? []))
      .catch(() => setVillages([]))
      .finally(() => setVillLoading(false))
  }, [zoneId])

  useEffect(() => { loadVillages() }, [loadVillages])

  // Charger dossiers du village sélectionné
  useEffect(() => {
    if (!selVillage) { setDossiers([]); return }
    setDossLoading(true)
    getQcDossiers({ village: selVillage.id })
      .then(r => setDossiers(r.data.results ?? []))
      .catch(() => setDossiers([]))
      .finally(() => setDossLoading(false))
  }, [selVillage])

  // Villages filtrés par recherche
  const villagesFiltered = villages.filter(v =>
    v.nom.toLowerCase().includes(search.toLowerCase()) ||
    v.sous_prefecture.toLowerCase().includes(search.toLowerCase())
  )

  // Grouper villages par sous-préfecture
  const bySpref = villagesFiltered.reduce((acc, v) => {
    const sp = v.sous_prefecture || 'Autres'
    if (!acc[sp]) acc[sp] = []
    acc[sp].push(v)
    return acc
  }, {})

  const zoneLabel = zoneCtx === 'CAVALLY' ? 'Cavally' : zoneCtx === 'WORODOUGOU' ? 'Worodougou' : zoneCtx

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px - 48px)', minHeight: 500 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.orange + '18' }}>
            <Shield size={17} color={C.orange} />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: C.navy, lineHeight: 1.2 }}>Contrôle Qualité</h1>
            <p style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>
              Comparaison PDF · DIGIFOR · Shapefile — Zone {zoneLabel}
            </p>
          </div>
        </div>
        <button onClick={loadVillages}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + C.border, backgroundColor: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={13} color={C.gray} className={villLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>

        {/* ── Sidebar villages ── */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Barre recherche */}
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#c0c4cc', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Village, sous-préfecture…"
                   style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 9, border: '1px solid ' + C.border, fontSize: 12, outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }} />
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {villLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: C.gray, fontSize: 12 }}>
                <Loader2 size={14} className="animate-spin" />Chargement…
              </div>
            ) : villagesFiltered.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <MapPin size={24} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: C.gray }}>Aucun village avec des plans PDF</p>
              </div>
            ) : (
              Object.entries(bySpref).map(([sp, list]) => (
                <div key={sp}>
                  <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af', padding: '10px 8px 4px' }}>{sp}</p>
                  {list.map(v => {
                    const active = selVillage?.id === v.id
                    return (
                      <button key={v.id} onClick={() => setSelVillage(active ? null : v)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '7px 10px', borderRadius: 8, marginBottom: 2,
                                backgroundColor: active ? C.navy : 'transparent',
                                border: active ? 'none' : '1px solid transparent',
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all .12s',
                              }}
                              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}>
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.navy, flex: 1, textAlign: 'left' }}>
                          {v.nom}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                                       backgroundColor: active ? 'rgba(255,255,255,0.2)' : C.orange + '18',
                                       color: active ? '#fff' : C.orange }}>
                          {v.nb_plans}
                        </span>
                        {active && <ChevronRight size={12} color="#fff" style={{ marginLeft: 4 }} />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Pied */}
          {villages.length > 0 && (
            <div style={{ padding: '8px 10px', borderRadius: 10, backgroundColor: '#fff', border: '1px solid ' + C.border, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: C.gray }}>Villages</span>
                <span style={{ fontWeight: 700, color: C.navy }}>{villages.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 3 }}>
                <span style={{ color: C.gray }}>Plans PDF</span>
                <span style={{ fontWeight: 700, color: C.orange }}>
                  {villages.reduce((s, v) => s + (v.nb_plans ?? 0), 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Contenu principal ── */}
        <div style={{ flex: 1, minWidth: 0, backgroundColor: '#fff', borderRadius: 14, border: '1px solid ' + C.border, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {!selVillage ? (
            // État vide
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: C.orange + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Shield size={28} color={C.orange} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.navy, marginBottom: 8 }}>Sélectionner un village</h2>
              <p style={{ fontSize: 12.5, color: C.gray, textAlign: 'center', maxWidth: 380, lineHeight: 1.6 }}>
                Choisissez un village dans la liste de gauche pour afficher ses dossiers CF et lancer le contrôle qualité.
                Chaque dossier contient un plan PDF à comparer avec les données DIGIFOR et le shapefile.
              </p>
              <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                {[
                  { icon: FileText, label: 'Plan PDF', color: C.orange },
                  { icon: Database, label: 'DIGIFOR',  color: C.teal },
                  { icon: Layers,   label: 'Shapefile', color: C.navy },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.gray }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* En-tête village */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + C.border, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, backgroundColor: '#fafafa' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.navy + '0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={14} color={C.navy} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{selVillage.nom}</p>
                  <p style={{ fontSize: 11, color: C.gray }}>{selVillage.sous_prefecture} · {selVillage.nb_plans} plan{selVillage.nb_plans > 1 ? 's' : ''} PDF</p>
                </div>
                <button onClick={() => setSelVillage(null)}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.gray, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, border: '1px solid ' + C.border, backgroundColor: '#fff' }}>
                  <X size={11} /> Fermer
                </button>
              </div>

              {/* Grille dossiers */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {dossLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40, color: C.gray, fontSize: 13 }}>
                    <Loader2 size={18} className="animate-spin" />Chargement des dossiers…
                  </div>
                ) : dossiers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <FileText size={32} style={{ color: '#d1d5db', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 13, color: C.gray }}>Aucun dossier CF avec plan PDF dans ce village</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {dossiers.map(d => (
                      <DossierCard key={d.id} dossier={d} onOpen={() => setModal(d)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de contrôle */}
      {modal && (
        <ControleModal
          dossier={modal}
          zone={zoneCtx}
          onClose={() => setModal(null)}
          onSaved={() => {
            // Recharger les dossiers pour mettre à jour les badges contrôle
            if (selVillage) {
              getQcDossiers({ village: selVillage.id })
                .then(r => setDossiers(r.data.results ?? []))
                .catch(() => {})
            }
          }}
        />
      )}
    </div>
  )
}

/* ── DossierCard ─────────────────────────────────────────────────── */
function DossierCard({ dossier, onOpen }) {
  const hasPlans = dossier.nb_plans > 0
  const ctrl     = dossier.controle_statut

  return (
    <div
      onClick={hasPlans ? onOpen : undefined}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        border: `1.5px solid ${ctrl === 'VALIDE' ? '#86efac' : ctrl === 'REJETE' ? '#fca5a5' : C.border}`,
        padding: 14,
        cursor: hasPlans ? 'pointer' : 'default',
        transition: 'all .15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (hasPlans) { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.boxShadow = '0 2px 12px rgba(224,107,47,0.12)' } }}
      onMouseLeave={e => {
        const c = dossier.controle_statut
        e.currentTarget.style.borderColor = c === 'VALIDE' ? '#86efac' : c === 'REJETE' ? '#fca5a5' : C.border
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Bande colorée selon statut contrôle */}
      {ctrl && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
          backgroundColor: ctrl === 'VALIDE' ? '#22c55e' : ctrl === 'REJETE' ? '#ef4444' : '#f59e0b',
        }} />
      )}

      <div style={{ paddingLeft: ctrl ? 6 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 800, color: C.navy }}>{dossier.numero_dossier}</p>
            {dossier.nom_demandeur && (
              <p style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{dossier.nom_demandeur}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {dossier.statut_cf && <Badge map={STATUT_CF} value={dossier.statut_cf} />}
            {ctrl && <Badge map={CTRL_STATUT} value={ctrl} />}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {dossier.num_demand && (
            <span style={{ fontSize: 10.5, color: C.gray, backgroundColor: C.bg, padding: '2px 7px', borderRadius: 6 }}>
              {dossier.num_demand}
            </span>
          )}
          {dossier.superficie_parcelle != null && (
            <span style={{ fontSize: 10.5, color: C.gray, backgroundColor: C.bg, padding: '2px 7px', borderRadius: 6 }}>
              {(+dossier.superficie_parcelle).toFixed(2)} ha
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <FileText size={11} color={hasPlans ? C.orange : '#d1d5db'} />
            <span style={{ fontSize: 11, color: hasPlans ? C.orange : '#d1d5db', fontWeight: 600 }}>
              {dossier.nb_plans} plan{dossier.nb_plans > 1 ? 's' : ''} PDF
            </span>
          </div>
          {hasPlans && (
            <span style={{ fontSize: 10.5, color: C.orange, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              Contrôler <ChevronRight size={10} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
