import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Map, RefreshCw, Layers, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { getGeoLayer } from '@/api/geo'

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  navy:   '#1a2536',
  gray:   '#6b7280',
  orange: '#E06B2F',
  green:  '#2DA96A',
  blue:   '#3B82F6',
  bg:     '#f7f8fa',
  border: '#e8eaed',
}

/* ── Zones ───────────────────────────────────────────────────────── */
const ZONES = [
  { key: 'cavally',    label: 'Cavally',    center: [6.53, -7.96], zoom: 10 },
  { key: 'worodougou', label: 'Worodougou', center: [7.95, -6.50], zoom: 10 },
]

/* ── Couleurs par stade ──────────────────────────────────────────── */
const CF_COLORS = {
  LEVE:     '#F59E0B',
  PROV:     '#38BDF8',
  DEF:      '#E06B2F',
  EXISTANT: '#9B59B6',
}
const DTV_COLORS = {
  LEVE:     '#34D399',
  PROV:     '#10B981',
  DEF:      '#059669',
  DELIMITE: '#065F46',
}

const CF_TYPES  = [
  { key: 'LEVE',     label: 'Levé',        color: CF_COLORS.LEVE },
  { key: 'PROV',     label: 'Provisoire',  color: CF_COLORS.PROV },
  { key: 'DEF',      label: 'Définitif',   color: CF_COLORS.DEF },
  { key: 'EXISTANT', label: 'Existant',    color: CF_COLORS.EXISTANT },
]
const DTV_TYPES = [
  { key: 'LEVE',     label: 'Levé',       color: DTV_COLORS.LEVE },
  { key: 'PROV',     label: 'Provisoire', color: DTV_COLORS.PROV },
  { key: 'DELIMITE', label: 'Délimité',   color: DTV_COLORS.DELIMITE },
]

function cfColor(s)  { return CF_COLORS[s?.toUpperCase()]  ?? CF_COLORS.DEF }
function dtvColor(s) { return DTV_COLORS[s?.toUpperCase()] ?? DTV_COLORS.DELIMITE }

/* ── Styles GeoJSON ──────────────────────────────────────────────── */
const cfStyle      = f => { const c = cfColor(f?.properties?._statut);  return { color: c, weight: 1.5, opacity: 0.9, fillColor: c, fillOpacity: 0.22 } }
const cfHover      = f => { const c = cfColor(f?.properties?._statut);  return { fillOpacity: 0.52, weight: 2.5, color: c } }
const dtvStyle     = f => { const c = dtvColor(f?.properties?._statut); return { color: c, weight: 2,   opacity: 0.9, fillColor: c, fillOpacity: 0.16 } }
const dtvHover     = f => { const c = dtvColor(f?.properties?._statut); return { fillOpacity: 0.42, weight: 3,   color: c } }
const spStyle      = { color: C.blue, weight: 2, opacity: 0.75, fillColor: C.blue, fillOpacity: 0.05, dashArray: '6 3' }
const spHover      = { fillOpacity: 0.15, weight: 3 }

/* ── Fond de cartes ──────────────────────────────────────────────── */
const BASEMAPS = [
  { key: 'positron',  label: 'Clair',     icon: '🗺',  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',                                               attrib: '© OSM © CARTO',               sub: 'abcd', extra: null },
  { key: 'osm',       label: 'OSM',       icon: '🌍',  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                                                            attrib: '© OpenStreetMap contributors', sub: 'abc',  extra: null },
  { key: 'satellite', label: 'Satellite', icon: '🛰',  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',                  attrib: 'Tiles © Esri',                sub: 'a',    extra: null },
  { key: 'hybrid',    label: 'Hybride',   icon: '🌐',  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',                  attrib: 'Tiles © Esri | Labels © CARTO', sub: 'a',  extra: { url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', sub: 'abcd' } },
]

/* ── Popup ───────────────────────────────────────────────────────── */
const FIELD_LABELS = {
  NUM_DEMAND:'N° demande', NOM_DEMAND:'Demandeur', NOM_VILLAGE:'Village',
  NOM_REGION:'Région', NOM_DEPART:'Département', NOM_SSPREF:'Sous-préfecture',
  SUPERF:'Superficie (ha)', PERIM:'Périmètre (m)', NOM_PROJET:'Projet',
  NOM_OTA:'Opérateur', STATUT:'Statut', N_DEMCGE:'N° CGE', OCS:'Occupation du sol',
  SOUS_PREF:'Sous-préfecture', DEPARTMNT:'Département', Shape_Area:'Superficie (m²)',
}
const SKIP_FIELDS = new Set(['id','FID','Shape','SHAPE','SHAPE_1','_source_table','_schema','_exclude_from_bounds','layer','path'])

function buildPopup(props, accent) {
  const statut = props._statut ?? ''
  const title  = props.NOM_VILLAGE ?? props.NOM_DEMAND ?? props.NUM_DEMAND ?? props.SOUS_PREF ?? '—'
  const rows   = Object.entries(props)
    .filter(([k,v]) => !SKIP_FIELDS.has(k) && !k.startsWith('_') && v != null && v !== '')
    .map(([k,v]) => {
      const label = FIELD_LABELS[k] ?? k
      const val   = k==='SUPERF' ? (+v).toFixed(4)+' ha' : k==='PERIM' ? (+v).toFixed(2)+' m' : String(v)
      return `<tr><td style="color:#9ca3af;padding:2px 10px 2px 0;white-space:nowrap;font-size:11px">${label}</td><td style="font-weight:600;color:#111827;font-size:11px">${val}</td></tr>`
    }).join('')
  return `<div style="font:13px/1.5 system-ui,sans-serif;min-width:190px;max-width:280px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #f3f4f6">
      <span style="font-weight:700;font-size:13px;color:#111827;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</span>
      <span style="margin-left:8px;background:${accent}18;color:${accent};padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap;border:1px solid ${accent}40">${statut}</span>
    </div>
    <div style="max-height:200px;overflow-y:auto"><table style="border-collapse:collapse;width:100%">${rows}</table></div>
  </div>`
}

/* ── FitData ─────────────────────────────────────────────────────── */
function FitData({ bounds, center, zoom }) {
  const map  = useMap()
  const prev = useRef(null)
  useEffect(() => {
    const key = JSON.stringify(bounds ?? center)
    if (key === prev.current) return
    prev.current = key
    if (bounds) map.fitBounds(bounds, { padding: [30,30], maxZoom: 13, animate: true })
    else        map.flyTo(center, zoom, { duration: 1 })
  }, [bounds, center, zoom])
  return null
}

/* ── TypeChips — filtre couleur ──────────────────────────────────── */
function TypeChips({ types, active, setActive }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5 pl-1">
      {types.map(t => {
        const on = active.has(t.key)
        return (
          <button key={t.key}
            onClick={() => setActive(prev => { const n=new Set(prev); on?n.delete(t.key):n.add(t.key); return n })}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-all"
            style={{
              backgroundColor: on ? t.color+'22' : '#f3f4f6',
              color:           on ? t.color       : '#9ca3af',
              border:          `1px solid ${on ? t.color+'55' : '#e5e7eb'}`,
            }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: on ? t.color : '#d1d5db' }} />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── LayerRow ─────────────────────────────────────────────────────── */
function LayerRow({ label, color, count, loading, visible, onToggle, expanded, onExpand, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 group">
        <button onClick={onToggle}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ backgroundColor: visible ? color+'18' : '#f3f4f6', border: `1.5px solid ${visible ? color : '#e5e7eb'}` }}>
          {visible
            ? <Eye size={10}    style={{ color }} />
            : <EyeOff size={10} style={{ color: '#9ca3af' }} />}
        </button>

        <span className="flex-1 text-[12px] font-semibold" style={{ color: visible ? C.navy : '#9ca3af' }}>
          {label}
        </span>

        {loading
          ? <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" style={{ color }} />
          : <span className="text-[11px] font-bold tabular-nums" style={{ color: visible ? color : '#d1d5db' }}>
              {count.toLocaleString('fr-CI')}
            </span>
        }

        {children && (
          <button onClick={onExpand} className="ml-0.5 opacity-40 hover:opacity-70 transition-opacity">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>
      {expanded && children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
export default function GeoPortail() {
  const [zone,       setZone]       = useState('cavally')
  const [basemapKey, setBasemapKey] = useState('positron')
  const [cfData,     setCfData]     = useState(null)
  const [dtvData,    setDtvData]    = useState(null)
  const [spData,     setSpData]     = useState(null)
  const [cfVis,      setCfVis]      = useState(true)
  const [dtvVis,     setDtvVis]     = useState(true)
  const [spVis,      setSpVis]      = useState(true)
  const [cfLoading,  setCfLoading]  = useState(false)
  const [dtvLoading, setDtvLoading] = useState(false)
  const [spLoading,  setSpLoading]  = useState(false)
  const [error,      setError]      = useState(null)
  const [bounds,     setBounds]     = useState(null)
  const [cfExp,      setCfExp]      = useState(true)
  const [dtvExp,     setDtvExp]     = useState(true)
  const [cfTypes,    setCfTypes]    = useState(() => new Set(CF_TYPES.map(t=>t.key)))
  const [dtvTypes,   setDtvTypes]   = useState(() => new Set(DTV_TYPES.map(t=>t.key)))

  const basemap  = BASEMAPS.find(b=>b.key===basemapKey) ?? BASEMAPS[0]
  const zoneConf = ZONES.find(z=>z.key===zone) ?? ZONES[0]

  const load = useCallback(async (z) => {
    setError(null); setCfData(null); setDtvData(null); setSpData(null); setBounds(null)
    setCfLoading(true); setDtvLoading(true); setSpLoading(true)
    const [cf, dtv, sp] = await Promise.allSettled([
      getGeoLayer(z,'cf'), getGeoLayer(z,'dtv'), getGeoLayer(z,'sous_prefecture'),
    ])
    if (cf.status==='fulfilled')  { setCfData(cf.value.data);   if (cf.value.data._meta?.bounds) setBounds(cf.value.data._meta.bounds) }
    else setError(e=>(e?e+' | ':'')+`CF: ${cf.reason?.response?.data?.detail??cf.reason?.message}`)
    setCfLoading(false)
    if (dtv.status==='fulfilled') { setDtvData(dtv.value.data) }
    else setError(e=>(e?e+' | ':'')+`DTV: ${dtv.reason?.response?.data?.detail??dtv.reason?.message}`)
    setDtvLoading(false)
    if (sp.status==='fulfilled')  { setSpData(sp.value.data) }
    else setError(e=>(e?e+' | ':'')+`SP: ${sp.reason?.response?.data?.detail??sp.reason?.message}`)
    setSpLoading(false)
  }, [])

  useEffect(() => { load(zone) }, [zone, load])

  const cfFiltered  = cfData  ? { ...cfData,  features: (cfData.features??[]).filter(f=>cfTypes.has(f.properties?._statut))  } : null
  const dtvFiltered = dtvData ? { ...dtvData, features: (dtvData.features??[]).filter(f=>dtvTypes.has(f.properties?._statut)) } : null

  const cfTotal  = cfData?.features?.length  ?? 0
  const dtvTotal = dtvData?.features?.length ?? 0
  const cfCount  = cfFiltered?.features?.length  ?? 0
  const dtvCount = dtvFiltered?.features?.length ?? 0
  const spCount  = spData?.features?.length      ?? 0

  const cfKey  = `cf-${zone}-${cfCount}-${[...cfTypes].sort()}`
  const dtvKey = `dtv-${zone}-${dtvCount}-${[...dtvTypes].sort()}`
  const spKey  = `sp-${zone}-${spCount}`

  const anyLoading = cfLoading || dtvLoading || spLoading

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 52px - 48px)', minHeight:500 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#E06B2F18' }}>
            <Map size={17} color={C.orange} />
          </div>
          <div>
            <h1 style={{ fontSize:17, fontWeight:800, color:C.navy, lineHeight:1.2 }}>Géoportail</h1>
            <p style={{ fontSize:11, color:C.gray, marginTop:1 }}>Données spatiales QGIS — Cavally &amp; Worodougou</p>
          </div>
        </div>
        <button onClick={()=>load(zone)}
                style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid '+C.border, backgroundColor:'#fff', cursor:'pointer' }}>
          <RefreshCw size={13} color={C.gray} className={anyLoading?'animate-spin':''} />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:14, flex:1, minHeight:0 }}>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div style={{ width:236, flexShrink:0, display:'flex', flexDirection:'column', gap:0, overflowY:'auto', paddingRight:2 }}>

          {/* Zone tabs */}
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid '+C.border, padding:'10px 10px 10px', marginBottom:10 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af', marginBottom:7 }}>Zone</p>
            <div style={{ display:'flex', gap:6 }}>
              {ZONES.map(z=>(
                <button key={z.key} onClick={()=>setZone(z.key)}
                        style={{
                          flex:1, padding:'7px 0', borderRadius:8, fontSize:12.5, fontWeight:700,
                          backgroundColor: zone===z.key ? C.navy : C.bg,
                          color:           zone===z.key ? '#fff'  : '#6b7280',
                          border:          zone===z.key ? 'none'  : '1px solid '+C.border,
                          cursor:'pointer', transition:'all .15s',
                        }}>
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Basemap */}
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid '+C.border, padding:'10px', marginBottom:10 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af', marginBottom:7 }}>Fond de carte</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {BASEMAPS.map(b=>{
                const active = basemapKey===b.key
                return (
                  <button key={b.key} onClick={()=>setBasemapKey(b.key)}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderRadius:8,
                            backgroundColor: active ? C.navy+'12' : C.bg,
                            border:`1.5px solid ${active ? C.navy : C.border}`,
                            color: active ? C.navy : '#6b7280',
                            fontSize:11, fontWeight: active ? 700 : 500, cursor:'pointer',
                          }}>
                    <span style={{ fontSize:14 }}>{b.icon}</span>
                    {b.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Couches */}
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid '+C.border, padding:'10px 12px', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <Layers size={11} color={C.gray} />
              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af' }}>Couches</p>
            </div>

            {/* Divider helper */}
            <div style={{ height:1, backgroundColor:C.border, margin:'8px 0' }} />

            {/* Sous-préfectures */}
            <LayerRow label="Sous-préfectures" color={C.blue} count={spCount}
                      loading={spLoading} visible={spVis} onToggle={()=>setSpVis(v=>!v)}
                      expanded={false} onExpand={null} />

            <div style={{ height:1, backgroundColor:C.border, margin:'6px 0' }} />

            {/* CF */}
            <LayerRow label="CF — Parcelles" color={C.orange}
                      count={cfCount} loading={cfLoading} visible={cfVis} onToggle={()=>setCfVis(v=>!v)}
                      expanded={cfExp} onExpand={()=>setCfExp(v=>!v)}>
              <TypeChips types={CF_TYPES} active={cfTypes} setActive={setCfTypes} />
            </LayerRow>

            <div style={{ height:1, backgroundColor:C.border, margin:'6px 0' }} />

            {/* DTV */}
            <LayerRow label="DTV — Villages" color={C.green}
                      count={dtvCount} loading={dtvLoading} visible={dtvVis} onToggle={()=>setDtvVis(v=>!v)}
                      expanded={dtvExp} onExpand={()=>setDtvExp(v=>!v)}>
              <TypeChips types={DTV_TYPES} active={dtvTypes} setActive={setDtvTypes} />
            </LayerRow>
          </div>

          {/* Stats compactes */}
          <div style={{ backgroundColor:'#fff', borderRadius:12, border:'1px solid '+C.border, padding:'10px 12px', marginBottom:10 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af', marginBottom:8 }}>Résumé</p>
            {[
              { label:'Sous-préfectures', val:spCount,  color:C.blue },
              { label:'Parcelles CF',     val:`${cfCount} / ${cfTotal}`, color:C.orange },
              { label:'Villages DTV',     val:`${dtvCount} / ${dtvTotal}`, color:C.green },
            ].map(({label,val,color})=>(
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
                <span style={{ fontSize:11.5, color:'#555' }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:700, color }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ backgroundColor:'#fff1f0', border:'1px solid #fca5a5', color:'#991b1b', borderRadius:10, padding:'8px 10px', fontSize:11, display:'flex', gap:6, alignItems:'flex-start' }}>
              <AlertTriangle size={13} style={{ flexShrink:0, marginTop:1 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Carte ────────────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:0, borderRadius:16, overflow:'hidden', position:'relative', border:'1px solid '+C.border, boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
          <MapContainer center={zoneConf.center} zoom={zoneConf.zoom} style={{ height:'100%', width:'100%' }}>
            <TileLayer key={basemap.key} attribution={basemap.attrib} url={basemap.url} subdomains={basemap.sub} maxZoom={20} />
            {basemap.extra && <TileLayer key={basemap.key+'-lbl'} attribution="" url={basemap.extra.url} subdomains={basemap.extra.sub} maxZoom={20} />}
            <FitData bounds={bounds} center={zoneConf.center} zoom={zoneConf.zoom} />

            {spVis && spData?.features?.length>0 && (
              <GeoJSON key={spKey} data={spData} style={spStyle}
                onEachFeature={(f,l)=>{ l.bindPopup(buildPopup(f.properties??{},C.blue),{maxWidth:300}); l.on('mouseover',()=>l.setStyle({...spStyle,...spHover})); l.on('mouseout',()=>l.setStyle(spStyle)) }} />
            )}
            {dtvVis && dtvFiltered?.features?.length>0 && (
              <GeoJSON key={dtvKey} data={dtvFiltered} style={dtvStyle}
                onEachFeature={(f,l)=>{ const c=dtvColor(f.properties?._statut); l.bindPopup(buildPopup(f.properties??{},c),{maxWidth:300}); l.on('mouseover',()=>l.setStyle(dtvHover(f))); l.on('mouseout',()=>l.setStyle(dtvStyle(f))) }} />
            )}
            {cfVis && cfFiltered?.features?.length>0 && (
              <GeoJSON key={cfKey} data={cfFiltered} style={cfStyle}
                onEachFeature={(f,l)=>{ const c=cfColor(f.properties?._statut); l.bindPopup(buildPopup(f.properties??{},c),{maxWidth:300}); l.on('mouseover',()=>l.setStyle(cfHover(f))); l.on('mouseout',()=>l.setStyle(cfStyle(f))) }} />
            )}
          </MapContainer>

          {/* Loading overlay */}
          {anyLoading && (
            <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', zIndex:1000, pointerEvents:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:99, backgroundColor:'rgba(26,37,54,0.88)', color:'#fff', fontSize:11.5, fontWeight:600, backdropFilter:'blur(4px)' }}>
                <div style={{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
                Chargement des couches…
              </div>
            </div>
          )}

          {/* Bottom counter pill */}
          {!anyLoading && (cfCount+dtvCount+spCount)>0 && (
            <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', zIndex:1000, pointerEvents:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:99, backgroundColor:'rgba(26,37,54,0.88)', color:'#fff', fontSize:11.5, fontWeight:600, backdropFilter:'blur(4px)' }}>
                <span style={{ color:'#93c5fd' }}>{spCount} SP</span>
                <span style={{ color:'#4b5563' }}>·</span>
                <span style={{ color:'#fdba74' }}>{cfCount} CF</span>
                <span style={{ color:'#4b5563' }}>·</span>
                <span style={{ color:'#6ee7b7' }}>{dtvCount} DTV</span>
              </div>
            </div>
          )}

          {/* No data state */}
          {!anyLoading && cfTotal===0 && dtvTotal===0 && spCount===0 && !error && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, pointerEvents:'none' }}>
              <div style={{ backgroundColor:'#fff', borderRadius:16, padding:'24px 32px', textAlign:'center', border:'1px solid '+C.border, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
                <Map size={30} color="#d1d5db" style={{ margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, fontWeight:700, color:C.navy }}>Aucune donnée spatiale</p>
                <p style={{ fontSize:11.5, color:C.gray, marginTop:4 }}>Aucune couche trouvée pour la zone {zoneConf.label}.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
