import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Shield, Search, FileText, X, ChevronRight, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, MapPin, Loader2,
  ExternalLink, Database, Layers, Plus, Trash2, Clock,
  User, Ruler, FileSearch,
} from 'lucide-react'
import { useZone } from '@/layouts/ZoneLayout'
import { getZones } from '@/api/referentiel'
import { getQcVillages, getQcDossiers, createControle } from '@/api/controle'
import { getCfDetail } from '@/api/geo'

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  navy:   '#1a2536',
  orange: '#E06B2F',
  green:  '#2DA96A',
  red:    '#ef4444',
  blue:   '#3B82F6',
  gray:   '#6b7280',
  border: '#e8eaed',
  bg:     '#f7f8fa',
  teal:   '#0d9488',
}

const STATUT_CF = {
  LEVE:            { label: 'Levé',         bg: '#fef3c7', color: '#b45309' },
  PROV:            { label: 'Provisoire',   bg: '#dbeafe', color: '#1d4ed8' },
  EN_PUBLICITE:    { label: 'En publicité', bg: '#f3e8ff', color: '#7e22ce' },
  APRES_PUBLICITE: { label: 'Après pub.',   bg: '#ede9fe', color: '#6d28d9' },
  DEF:             { label: 'Définitif',    bg: '#dcfce7', color: '#15803d' },
  REJETE:          { label: 'Rejeté',       bg: '#fee2e2', color: '#b91c1c' },
}
const CTRL_STATUT = {
  VALIDE:   { label: 'Validé',   bg: '#dcfce7', color: '#15803d' },
  REJETE:   { label: 'Rejeté',   bg: '#fee2e2', color: '#b91c1c' },
  EN_COURS: { label: 'En cours', bg: '#fef9c3', color: '#b45309' },
}
const GRAVITE_MAP = {
  BLOQUANTE: { label: 'Bloquante', bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  MAJEURE:   { label: 'Majeure',   bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  MINEURE:   { label: 'Mineure',   bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af' },
}

const FIELD_LABELS = {
  NUM_DEMAND:'N° demande', NOM_DEMAND:'Demandeur', NOM_VILLAGE:'Village',
  NOM_REGION:'Région', NOM_DEPART:'Département', NOM_SSPREF:'Sous-préfecture',
  SUPERF:'Superficie (ha)', PERIM:'Périmètre (m)', NOM_PROJET:'Projet',
  NOM_OTA:'Opérateur', STATUT:'Statut', N_DEMCGE:'N° CGE',
  OCS:'Occupation du sol', SOUS_PREF:'Sous-préfecture', DEPARTMNT:'Département',
  Shape_Area:'Superficie (m²)', Shape_Leng:'Périmètre (m)',
}
const SKIP = new Set(['id','FID','Shape','SHAPE','SHAPE_1','_source_table','_schema','_statut','_exclude_from_bounds'])

/* ── Utilitaires ─────────────────────────────────────────────────── */
function pdfPath(url) {
  if (!url) return null
  try { return new URL(url).pathname } catch { return url }
}

function Badge({ map, value }) {
  const s = map?.[value]
  if (!s || !value) return null
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

/* Ligne clé/valeur */
function KV({ label, value, accent }) {
  if (value == null || value === '') return null
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
      <span style={{ fontSize: 10.5, color: '#9ca3af', flexShrink: 0, minWidth: 105 }}>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: accent ?? C.navy, textAlign: 'right', wordBreak: 'break-word' }}>
        {String(value)}
      </span>
    </div>
  )
}

/* ── Panel titré ─────────────────────────────────────────────────── */
function PanelHeader({ icon: Icon, title, subtitle, color, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid ' + C.border, backgroundColor: '#fafafa', flexShrink: 0 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: color + '16' }}>
        <Icon size={13} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {subtitle && <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 6 }}>{subtitle}</span>}
      </div>
      {count != null && (
        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 99, backgroundColor: color + '14', color }}>{count}</span>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PANNEAU DIGIFOR — zone droite supérieure
════════════════════════════════════════════════════════════════════ */
function DigiforPanel({ dossier }) {
  const voisinsUniq = dossier.voisins ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader icon={Database} title="DIGIFOR" subtitle="données saisies terrain" color={C.teal} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {/* ── Demandeur ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <User size={10} color={C.teal} />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demandeur</span>
          </div>
          <div style={{ backgroundColor: C.teal + '0c', borderRadius: 8, padding: '8px 10px', border: '1px solid ' + C.teal + '25' }}>
            <KV label="N° dossier"   value={dossier.numero_dossier} accent={C.navy} />
            <KV label="N° demande"   value={dossier.num_demand}     accent={C.orange} />
            <KV label="Nom"          value={dossier.nom_demandeur}  accent={C.navy} />
            <KV label="N° CGE"       value={dossier.n_demcge} />
          </div>
        </div>

        {/* ── Superficie ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <Ruler size={10} color={C.orange} />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Superficie & Périmètre</span>
          </div>
          <div style={{ backgroundColor: C.orange + '0c', borderRadius: 8, padding: '8px 10px', border: '1px solid ' + C.orange + '25' }}>
            <KV label="Superficie (ha)"
                value={dossier.superficie_parcelle != null ? (+dossier.superficie_parcelle).toFixed(4) + ' ha' : null}
                accent={C.orange} />
            <KV label="Périmètre (m)"
                value={dossier.perimetre_parcelle  != null ? (+dossier.perimetre_parcelle).toFixed(2)  + ' m'  : null} />
          </div>
        </div>

        {/* ── Voisins ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <MapPin size={10} color="#7c3aed" />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Voisins ({voisinsUniq.length})</span>
          </div>
          {voisinsUniq.length === 0 ? (
            <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', padding: '6px 10px' }}>Aucun voisin enregistré dans DIGIFOR.</p>
          ) : (
            <div style={{ backgroundColor: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe', overflow: 'hidden' }}>
              {voisinsUniq.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 10px',
                  backgroundColor: i % 2 === 0 ? 'transparent' : '#faf9ff',
                  borderBottom: i < voisinsUniq.length - 1 ? '1px solid #ede9fe' : 'none',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', flexShrink: 0, minWidth: 28 }}>S{v.num_sommet || i + 1}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.navy, flex: 1 }}>{v.nom_vois || '—'}</span>
                  {v.typ_vois  && <span style={{ fontSize: 9.5, color: '#9ca3af' }}>{v.typ_vois}</span>}
                  {v.typ_nat   && <span style={{ fontSize: 9.5, color: '#9ca3af' }}>{v.typ_nat}</span>}
                  {v.num_tronc && <span style={{ fontSize: 9.5, color: C.blue, fontWeight: 600 }}>T{v.num_tronc}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Autres données ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <Database size={10} color={C.gray} />
            <span style={{ fontSize: 9.5, fontWeight: 800, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Autres informations</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <KV label="Opérateur"          value={dossier.nom_ota} />
            <KV label="Occupation sol"     value={dossier.ocs} />
            <KV label="Boucle"             value={dossier.boucle} />
            <KV label="CD SP VIL"          value={dossier.cd_sp_vil} />
            <KV label="Classe précision"   value={dossier.clas_preci} />
            <KV label="Point rattachement" value={dossier.point_ratt} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PANNEAU SHAPEFILE — zone droite inférieure
════════════════════════════════════════════════════════════════════ */
function ShapefilePanel({ dossier, shpData, shpLoading, shpError }) {
  const record = shpData?.records?.[0] ?? null

  /* Écart superficie */
  const shpSuperf = record?.SUPERF != null ? +record.SUPERF : null
  const digSuperf = dossier.superficie_parcelle != null ? +dossier.superficie_parcelle : null
  const diff      = shpSuperf != null && digSuperf != null ? Math.abs(shpSuperf - digSuperf) : null
  const hasEcart  = diff != null && diff > 0.001

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader
        icon={Layers}
        title="Shapefile _Prov"
        subtitle={record ? `table : ${record._source_table}` : 'données spatiales'}
        color={C.orange}
        count={shpData?.records?.length}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>

        {shpLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, color: C.gray, fontSize: 12 }}>
            <Loader2 size={14} className="animate-spin" /> Chargement données spatiales…
          </div>
        )}
        {shpError && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', backgroundColor: '#fff1f0', borderRadius: 8, fontSize: 11.5, color: '#b91c1c', alignItems: 'flex-start' }}>
            <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />{shpError}
          </div>
        )}
        {!shpLoading && !shpError && !record && (
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
              {dossier.num_demand
                ? `Aucune donnée shapefile trouvée pour N° demande : ${dossier.num_demand}`
                : 'N° demande non renseigné dans DIGIFOR — impossible de chercher dans le shapefile.'}
            </p>
          </div>
        )}

        {record && (
          <>
            {/* Alerte écart superficie */}
            {hasEcart && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, marginBottom: 10, fontSize: 11.5, color: '#ea580c' }}>
                <AlertTriangle size={13} />
                <strong>Écart superficie :</strong> DIGIFOR {digSuperf.toFixed(4)} ha · Shapefile {shpSuperf.toFixed(4)} ha · Écart {diff.toFixed(4)} ha
              </div>
            )}
            {!hasEcart && shpSuperf != null && digSuperf != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 10, fontSize: 11, color: '#15803d' }}>
                <CheckCircle2 size={12} /> Superficie cohérente entre DIGIFOR et shapefile
              </div>
            )}

            {/* Champs clés */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Ruler size={10} color={C.orange} />
                <span style={{ fontSize: 9.5, fontWeight: 800, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Champs clés</span>
              </div>
              <div style={{ backgroundColor: C.orange + '0c', borderRadius: 8, padding: '8px 10px', border: '1px solid ' + C.orange + '25' }}>
                {['NUM_DEMAND', 'NOM_DEMAND', 'SUPERF', 'PERIM'].map(k => record[k] != null && record[k] !== '' ? (
                  <KV key={k}
                      label={FIELD_LABELS[k] ?? k}
                      value={k === 'SUPERF' ? (+record[k]).toFixed(4) + ' ha' : k === 'PERIM' ? (+record[k]).toFixed(2) + ' m' : String(record[k])}
                      accent={k === 'SUPERF' || k === 'NOM_DEMAND' ? C.orange : undefined} />
                ) : null)}
              </div>
            </div>

            {/* Autres attributs */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Layers size={10} color={C.gray} />
                <span style={{ fontSize: 9.5, fontWeight: 800, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attributs shapefile</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                {Object.entries(record)
                  .filter(([k, v]) => !SKIP.has(k) && !['NUM_DEMAND','NOM_DEMAND','SUPERF','PERIM'].includes(k) && v != null && v !== '')
                  .map(([k, v]) => (
                    <KV key={k} label={FIELD_LABELS[k] ?? k}
                        value={k === 'Shape_Area' ? (+v).toFixed(2) : String(v)} />
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MODAL DE CONTRÔLE — 3 zones exactes selon le spec
   GAUCHE  : PDF (grand)
   DROITE HAUT    : DIGIFOR
   DROITE BAS     : Shapefile
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

  useEffect(() => {
    if (!dossier.num_demand || !zone) return
    setShpLoading(true); setShpError(null)
    getCfDetail(zone.toLowerCase(), dossier.num_demand)
      .then(r => setShpData(r.data))
      .catch(e => setShpError(e?.response?.data?.detail ?? 'Erreur chargement shapefile'))
      .finally(() => setShpLoading(false))
  }, [dossier.num_demand, zone])

  const addAnomalie = () => {
    const t = newAnomTxt.trim()
    if (!t) return
    setAnomalies(a => [...a, { id: Date.now(), description: t, gravite: newAnomGrav }])
    setNewAnomTxt('')
  }

  const saveControle = async (statut) => {
    setSaving(true); setSaveErr(null)
    try {
      await createControle({
        dossier:         dossier.id,
        statut,
        observations:    obs,
        anomalies_input: anomalies.map(({ description, gravite }) => ({ description, gravite })),
      })
      onSaved?.()
      onClose()
    } catch (e) {
      setSaveErr(e?.response?.data?.detail ?? JSON.stringify(e?.response?.data) ?? 'Erreur')
      setSaving(false)
    }
  }

  const path = pdfPath(plan?.fichier_url)

  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width:'100%', maxWidth:1500, height:'92vh', backgroundColor:'#fff', borderRadius:14, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.35)' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', backgroundColor:C.navy, color:'#fff', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Shield size={16} color={C.orange} />
            <div>
              <p style={{ fontSize:13, fontWeight:800 }}>Contrôle qualité — {dossier.numero_dossier}</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:1 }}>{dossier.village_nom} · {dossier.zone_nom}</p>
            </div>
            {dossier.statut_cf && <Badge map={STATUT_CF} value={dossier.statut_cf} />}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {dossier.plans.length > 1 && (
              <select value={plan?.id ?? ''} onChange={e => setPlan(dossier.plans.find(p => p.id === +e.target.value))}
                      style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', backgroundColor:'rgba(255,255,255,0.1)', color:'#fff' }}>
                {dossier.plans.map(p => <option key={p.id} value={p.id} style={{ color:'#000' }}>{p.nom}</option>)}
              </select>
            )}
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.1)', cursor:'pointer', border:'none' }}>
              <X size={15} color="#fff" />
            </button>
          </div>
        </div>

        {/* ════════ CORPS — 3 zones ════════ */}
        <div style={{ display:'flex', flex:1, minHeight:0 }}>

          {/* ══ ZONE 1 — GAUCHE : PDF + contrôles ══ */}
          <div style={{ flex:'0 0 52%', display:'flex', flexDirection:'column', borderRight:'2px solid '+C.border }}>

            {/* Label zone */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid '+C.border, backgroundColor:'#fafafa', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <FileText size={12} color={C.orange} />
                <span style={{ fontSize:11, fontWeight:700, color:C.navy }}>Plan PDF</span>
                {plan && <span style={{ fontSize:10.5, color:C.gray }}>— {plan.nom}</span>}
              </div>
              {path && (
                <a href={path} target="_blank" rel="noreferrer"
                   style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:C.blue, textDecoration:'none' }}>
                  <ExternalLink size={10} />Ouvrir dans un onglet
                </a>
              )}
            </div>

            {/* PDF viewer — occupe tout l'espace disponible */}
            <div style={{ flex:1, minHeight:0, backgroundColor:'#525659' }}>
              {path
                ? <iframe src={path} title={plan?.nom} style={{ width:'100%', height:'100%', border:'none' }} />
                : (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#aaa' }}>
                    <FileText size={40} style={{ opacity:.3, marginBottom:10 }} />
                    <p style={{ fontSize:13 }}>Aucun fichier PDF attaché</p>
                  </div>
                )
              }
            </div>

            {/* Contrôles (anomalies + validation) en pied de colonne gauche */}
            <div style={{ flexShrink:0, borderTop:'1px solid '+C.border, backgroundColor:'#fff' }}>

              {/* Anomalies */}
              <div style={{ padding:'10px 14px', borderBottom:'1px solid '+C.border }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
                  <AlertTriangle size={11} color={C.red} />
                  <span style={{ fontSize:10.5, fontWeight:800, color:'#b91c1c', textTransform:'uppercase', letterSpacing:'0.05em' }}>Anomalies relevées</span>
                  {anomalies.length > 0 && (
                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, backgroundColor:'#fee2e2', color:'#b91c1c' }}>{anomalies.length}</span>
                  )}
                </div>
                {anomalies.map((a, i) => {
                  const g = GRAVITE_MAP[a.gravite] ?? GRAVITE_MAP.MINEURE
                  return (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 0', borderBottom:'1px solid #f8f8f8' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', backgroundColor:g.dot, flexShrink:0 }} />
                      <span style={{ flex:1, fontSize:11.5, color:C.navy }}>{a.description}</span>
                      <span style={{ fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:99, backgroundColor:g.bg, color:g.color, flexShrink:0 }}>{g.label}</span>
                      <button onClick={() => setAnomalies(p => p.filter((_,j)=>j!==i))} style={{ color:'#d1d5db', cursor:'pointer', lineHeight:1, border:'none', background:'none' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )
                })}
                <div style={{ display:'flex', gap:6, marginTop:7 }}>
                  <input value={newAnomTxt} onChange={e=>setNewAnomTxt(e.target.value)}
                         onKeyDown={e=>e.key==='Enter'&&addAnomalie()}
                         placeholder="Décrire l'anomalie constatée…"
                         style={{ flex:1, fontSize:11.5, padding:'5px 9px', borderRadius:7, border:'1px solid '+C.border, outline:'none' }} />
                  <select value={newAnomGrav} onChange={e=>setNewAnomGrav(e.target.value)}
                          style={{ fontSize:11, padding:'5px 7px', borderRadius:7, border:'1px solid '+C.border, outline:'none' }}>
                    <option value="BLOQUANTE">Bloquante</option>
                    <option value="MAJEURE">Majeure</option>
                    <option value="MINEURE">Mineure</option>
                  </select>
                  <button onClick={addAnomalie} style={{ width:30, height:30, borderRadius:7, backgroundColor:C.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none', flexShrink:0 }}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Observations + actions */}
              <div style={{ padding:'8px 14px' }}>
                <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={2}
                          placeholder="Observations générales…"
                          style={{ width:'100%', fontSize:11.5, padding:'6px 9px', borderRadius:7, border:'1px solid '+C.border, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', marginBottom:8 }} />
                {saveErr && <p style={{ fontSize:11, color:'#b91c1c', marginBottom:6 }}>{saveErr}</p>}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>saveControle('EN_COURS')} disabled={saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px 0', borderRadius:8, fontSize:12, fontWeight:700, backgroundColor:'#f3f4f6', color:C.navy, cursor:saving?'not-allowed':'pointer', border:'1px solid '+C.border }}>
                    {saving?<Loader2 size={12} className="animate-spin"/>:<Clock size={12}/>} En cours
                  </button>
                  <button onClick={()=>saveControle('REJETE')} disabled={saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px 0', borderRadius:8, fontSize:12, fontWeight:700, backgroundColor:'#fee2e2', color:'#b91c1c', cursor:saving?'not-allowed':'pointer', border:'1px solid #fca5a5' }}>
                    {saving?<Loader2 size={12} className="animate-spin"/>:<XCircle size={12}/>} Rejeter
                  </button>
                  <button onClick={()=>saveControle('VALIDE')} disabled={saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px 0', borderRadius:8, fontSize:12, fontWeight:700, backgroundColor:'#dcfce7', color:'#15803d', cursor:saving?'not-allowed':'pointer', border:'1px solid #86efac' }}>
                    {saving?<Loader2 size={12} className="animate-spin"/>:<CheckCircle2 size={12}/>} Valider
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ══ ZONE 2+3 — DROITE : DIGIFOR (haut) + Shapefile (bas) ══ */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

            {/* Zone 2 : DIGIFOR — moitié haute */}
            <div style={{ flex:1, minHeight:0, borderBottom:'2px solid '+C.border }}>
              <DigiforPanel dossier={dossier} />
            </div>

            {/* Zone 3 : Shapefile — moitié basse */}
            <div style={{ flex:1, minHeight:0 }}>
              <ShapefilePanel
                dossier={dossier}
                shpData={shpData}
                shpLoading={shpLoading}
                shpError={shpError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ════════════════════════════════════════════════════════════════════
   CARTE PDF — liste des fichiers par village
════════════════════════════════════════════════════════════════════ */
function PdfCard({ dossier, plan, onOpen }) {
  const ctrl = dossier.controle_statut
  return (
    <div
      onClick={() => onOpen(dossier, plan)}
      style={{
        backgroundColor:'#fff', borderRadius:11, cursor:'pointer',
        border:`1.5px solid ${ctrl==='VALIDE'?'#86efac':ctrl==='REJETE'?'#fca5a5':C.border}`,
        padding:'12px 14px', transition:'all .14s', position:'relative', overflow:'hidden',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.orange; e.currentTarget.style.boxShadow='0 2px 12px rgba(224,107,47,0.14)' }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=ctrl==='VALIDE'?'#86efac':ctrl==='REJETE'?'#fca5a5':C.border; e.currentTarget.style.boxShadow='none' }}
    >
      {ctrl && (
        <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', backgroundColor:ctrl==='VALIDE'?'#22c55e':ctrl==='REJETE'?'#ef4444':'#f59e0b' }} />
      )}
      <div style={{ paddingLeft: ctrl ? 4 : 0 }}>
        {/* Icône + nom fichier */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:7 }}>
          <div style={{ width:32, height:32, borderRadius:8, backgroundColor:C.orange+'14', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={15} color={C.orange} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11.5, fontWeight:700, color:C.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plan.nom}</p>
            <p style={{ fontSize:10.5, color:C.gray, marginTop:1 }}>{dossier.numero_dossier}</p>
          </div>
        </div>

        {/* Métadonnées clés */}
        {dossier.nom_demandeur && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
            <User size={9} color={C.gray} />
            <span style={{ fontSize:11, color:'#555' }}>{dossier.nom_demandeur}</span>
          </div>
        )}
        {dossier.superficie_parcelle != null && (
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
            <Ruler size={9} color={C.gray} />
            <span style={{ fontSize:11, color:'#555' }}>{(+dossier.superficie_parcelle).toFixed(2)} ha</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {dossier.statut_cf && <Badge map={STATUT_CF} value={dossier.statut_cf} />}
            {ctrl && <Badge map={CTRL_STATUT} value={ctrl} />}
          </div>
          <span style={{ fontSize:10.5, fontWeight:700, color:C.orange, display:'flex', alignItems:'center', gap:3 }}>
            Ouvrir <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════════ */
export default function ControleQC() {
  const zoneCtx = useZone()

  const [zoneId,      setZoneId]      = useState(null)
  const [villages,    setVillages]    = useState([])
  const [villLoading, setVillLoading] = useState(false)
  const [selVillage,  setSelVillage]  = useState(null)
  const [dossiers,    setDossiers]    = useState([])
  const [dossLoading, setDossLoading] = useState(false)
  const [search,      setSearch]      = useState('')
  const [modal,       setModal]       = useState(null)   // { dossier, plan }

  /* Résoudre zone ID */
  useEffect(() => {
    getZones().then(r => {
      const list = r.data.results ?? r.data
      const z    = list.find(z => z.nom.toLowerCase().includes((zoneCtx ?? '').toLowerCase()))
      setZoneId(z?.id ?? null)
    }).catch(() => {})
  }, [zoneCtx])

  /* Charger villages */
  const loadVillages = useCallback(() => {
    if (!zoneId) return
    setVillLoading(true)
    getQcVillages({ zone: zoneId })
      .then(r => setVillages(r.data.results ?? []))
      .catch(() => setVillages([]))
      .finally(() => setVillLoading(false))
  }, [zoneId])

  useEffect(() => { loadVillages() }, [loadVillages])

  /* Charger dossiers du village */
  useEffect(() => {
    if (!selVillage) { setDossiers([]); return }
    setDossLoading(true)
    getQcDossiers({ village: selVillage.id })
      .then(r => setDossiers(r.data.results ?? []))
      .catch(() => setDossiers([]))
      .finally(() => setDossLoading(false))
  }, [selVillage])

  /* PDF cards aplaties (1 card = 1 PDF = 1 dossier) */
  const pdfCards = dossiers.flatMap(d => d.plans.map(p => ({ dossier: d, plan: p })))

  /* Villages filtrés + groupés par sous-préfecture */
  const filtered = villages.filter(v =>
    v.nom.toLowerCase().includes(search.toLowerCase()) ||
    v.sous_prefecture.toLowerCase().includes(search.toLowerCase())
  )
  const bySpref = filtered.reduce((acc, v) => {
    const sp = v.sous_prefecture || 'Autres'
    ;(acc[sp] = acc[sp] ?? []).push(v)
    return acc
  }, {})

  const zoneLabel = zoneCtx === 'CAVALLY' ? 'Cavally' : zoneCtx === 'WORODOUGOU' ? 'Worodougou' : zoneCtx

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 52px - 48px)', minHeight:500 }}>

      {/* Header page */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:C.orange+'18' }}>
            <Shield size={17} color={C.orange} />
          </div>
          <div>
            <h1 style={{ fontSize:17, fontWeight:800, color:C.navy, lineHeight:1.2 }}>Contrôle Qualité</h1>
            <p style={{ fontSize:11, color:C.gray, marginTop:1 }}>
              Comparaison PDF · DIGIFOR · Shapefile — Zone {zoneLabel}
            </p>
          </div>
        </div>
        <button onClick={loadVillages} style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid '+C.border, backgroundColor:'#fff', cursor:'pointer' }}>
          <RefreshCw size={13} color={C.gray} className={villLoading?'animate-spin':''} />
        </button>
      </div>

      {/* Corps */}
      <div style={{ display:'flex', gap:14, flex:1, minHeight:0 }}>

        {/* ── Sidebar : liste villages ── */}
        <div style={{ width:236, flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>

          <div style={{ position:'relative' }}>
            <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#c0c4cc', pointerEvents:'none' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)}
                   placeholder="Village, sous-préfecture…"
                   style={{ width:'100%', paddingLeft:28, paddingRight:10, paddingTop:7, paddingBottom:7, borderRadius:8, border:'1px solid '+C.border, fontSize:12, outline:'none', backgroundColor:'#fff', boxSizing:'border-box' }} />
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {villLoading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:24, color:C.gray, fontSize:12 }}>
                <Loader2 size={14} className="animate-spin" />Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:20, textAlign:'center' }}>
                <FileSearch size={24} style={{ color:'#d1d5db', margin:'0 auto 8px' }} />
                <p style={{ fontSize:12, color:C.gray }}>Aucun village avec plans PDF</p>
              </div>
            ) : (
              Object.entries(bySpref).map(([sp, list]) => (
                <div key={sp}>
                  <p style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#9ca3af', padding:'10px 6px 4px' }}>{sp}</p>
                  {list.map(v => {
                    const active = selVillage?.id === v.id
                    return (
                      <button key={v.id} onClick={() => setSelVillage(active ? null : v)}
                              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 9px', borderRadius:7, marginBottom:2, backgroundColor:active?C.navy:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}
                              onMouseEnter={e=>{ if(!active) e.currentTarget.style.backgroundColor='#f3f4f6' }}
                              onMouseLeave={e=>{ if(!active) e.currentTarget.style.backgroundColor='transparent' }}>
                        <span style={{ fontSize:12, fontWeight:active?700:500, color:active?'#fff':C.navy, flex:1 }}>{v.nom}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:99, backgroundColor:active?'rgba(255,255,255,0.2)':C.orange+'18', color:active?'#fff':C.orange, flexShrink:0 }}>
                          {v.nb_plans} PDF
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Résumé */}
          {villages.length > 0 && (
            <div style={{ padding:'8px 10px', borderRadius:9, backgroundColor:'#fff', border:'1px solid '+C.border, flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                <span style={{ color:C.gray }}>Villages</span>
                <span style={{ fontWeight:700, color:C.navy }}>{villages.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:C.gray }}>Plans PDF total</span>
                <span style={{ fontWeight:700, color:C.orange }}>
                  {villages.reduce((s,v)=>s+(v.nb_plans??0),0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Zone principale : PDF par village ── */}
        <div style={{ flex:1, minWidth:0, backgroundColor:'#fff', borderRadius:12, border:'1px solid '+C.border, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {!selVillage ? (
            /* État vide */
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:32 }}>
              <div style={{ width:60, height:60, borderRadius:16, backgroundColor:C.orange+'12', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <Shield size={26} color={C.orange} />
              </div>
              <h2 style={{ fontSize:15, fontWeight:800, color:C.navy, marginBottom:8 }}>Sélectionner un village</h2>
              <p style={{ fontSize:12.5, color:C.gray, textAlign:'center', maxWidth:360, lineHeight:1.7 }}>
                Choisissez un village dans la liste. Ses fichiers PDF seront affichés ici — cliquez sur un PDF pour ouvrir la fenêtre de contrôle à trois panneaux.
              </p>
              <div style={{ display:'flex', gap:24, marginTop:24 }}>
                {[
                  { icon:FileText,  label:'Plan PDF',    color:C.orange, desc:'Zone gauche' },
                  { icon:Database,  label:'DIGIFOR',     color:C.teal,   desc:'Zone droite haut' },
                  { icon:Layers,    label:'Shapefile',   color:C.navy,   desc:'Zone droite bas' },
                ].map(({icon:Icon,label,color,desc})=>(
                  <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, textAlign:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:12, backgroundColor:color+'14', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={19} color={color} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>{label}</span>
                    <span style={{ fontSize:10, color:C.gray }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Header village sélectionné */}
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid '+C.border, backgroundColor:'#fafafa', flexShrink:0 }}>
                <MapPin size={14} color={C.navy} />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:800, color:C.navy }}>{selVillage.nom}</p>
                  <p style={{ fontSize:10.5, color:C.gray }}>{selVillage.sous_prefecture} · {selVillage.nb_plans} plan{selVillage.nb_plans>1?'s':''} PDF</p>
                </div>
                <button onClick={()=>setSelVillage(null)} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:C.gray, cursor:'pointer', padding:'4px 8px', borderRadius:6, border:'1px solid '+C.border, backgroundColor:'#fff' }}>
                  <X size={11} /> Fermer
                </button>
              </div>

              {/* Grille de PDF cards */}
              <div style={{ flex:1, overflowY:'auto', padding:14 }}>
                {dossLoading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:40, color:C.gray, fontSize:13 }}>
                    <Loader2 size={18} className="animate-spin" />Chargement des fichiers PDF…
                  </div>
                ) : pdfCards.length === 0 ? (
                  <div style={{ textAlign:'center', padding:40 }}>
                    <FileText size={30} style={{ color:'#d1d5db', margin:'0 auto 10px' }} />
                    <p style={{ fontSize:13, color:C.gray }}>Aucun fichier PDF trouvé pour ce village</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize:10.5, color:C.gray, marginBottom:10 }}>
                      {pdfCards.length} fichier{pdfCards.length>1?'s':''} PDF — cliquer pour ouvrir la fenêtre de contrôle
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                      {pdfCards.map(({dossier:d, plan:p}) => (
                        <PdfCard key={`${d.id}-${p.id}`} dossier={d} plan={p}
                                 onOpen={(dos, pl) => setModal({ dossier: dos, plan: pl })} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de contrôle */}
      {modal && (
        <ControleModal
          dossier={modal.dossier}
          zone={zoneCtx}
          onClose={() => setModal(null)}
          onSaved={() => {
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
