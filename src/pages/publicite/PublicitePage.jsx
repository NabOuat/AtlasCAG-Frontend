import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText, FileSpreadsheet, Upload, Plus, Download,
  Trash2, X, Search, ChevronDown, File, AlertCircle,
  CheckCircle2, Loader2,
} from 'lucide-react'
import { getVillages } from '@/api/referentiel'
import { getPlansPDF, uploadPlanPDF, deleteFichier, getExcelsPublicite, uploadExcelPublicite, deleteExcelPublicite } from '@/api/fichiers'

/* ── Palette ─────────────────────────────────────────────────── */
const C = {
  bg:       '#f1f5f9',
  card:     '#ffffff',
  border:   '#e2e8f0',
  navy:     '#1a2536',
  orange:   '#C75A24',
  orangeL:  '#f97316',
  green:    '#10b981',
  text:     '#0f172a',
  muted:    '#64748b',
  light:    '#94a3b8',
  red:      '#ef4444',
  excel:    '#217346',
  pdf:      '#dc2626',
}

const ZONE_IDS = { cavally: 1, worodougou: 2 }

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Select ──────────────────────────────────────────────────── */
function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div style={{ position: 'relative', minWidth: 160 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%', appearance: 'none',
          padding: '8px 32px 8px 12px',
          border: `1px solid ${C.border}`, borderRadius: 8,
          background: disabled ? '#f8fafc' : C.card,
          color: value ? C.text : C.light,
          fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        color: C.light, pointerEvents: 'none',
      }} />
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────────── */
function Badge({ children, color = C.orange }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: `${color}18`, color,
    }}>
      {children}
    </span>
  )
}

/* ── PDF Card ────────────────────────────────────────────────── */
function PdfCard({ item, onDelete }) {
  const [hover, setHover] = useState(false)
  const url = item.fichier_url
    ? new URL(item.fichier_url).pathname
    : null

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.card, borderRadius: 12,
        border: `1px solid ${hover ? C.orange + '60' : C.border}`,
        padding: '16px',
        transition: 'all 0.18s',
        boxShadow: hover ? `0 4px 16px rgba(199,90,36,0.12)` : '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* Icône + nom */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: `${C.pdf}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={18} color={C.pdf} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: '18px',
          }}>
            {item.nom}
          </p>
          <p style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
            {item.village_nom ?? '—'}
          </p>
        </div>
      </div>

      {/* Méta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {item.sous_prefecture && (
          <Badge color={C.muted}>{item.sous_prefecture}</Badge>
        )}
        {item.dossier_numero && (
          <Badge color={C.orange}>N° {item.dossier_numero}</Badge>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: `1px solid ${C.border}`,
      }}>
        <div>
          <p style={{ fontSize: 11, color: C.light }}>{fmtDate(item.televerse_le)}</p>
          <p style={{ fontSize: 11, color: C.light }}>{fmt(item.taille)}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {url && (
            <a href={url} target="_blank" rel="noreferrer"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.muted, textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = C.green }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
            >
              <Download size={13} />
            </a>
          )}
          <button
            onClick={() => onDelete(item.id)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.light, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.red + '60' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.light; e.currentTarget.style.borderColor = C.border }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Excel Row ───────────────────────────────────────────────── */
function ExcelRow({ item, onDelete, index }) {
  const url = item.fichier_url ? new URL(item.fichier_url).pathname : null
  return (
    <tr style={{ background: index % 2 === 0 ? C.card : '#f8fafc' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${C.excel}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileSpreadsheet size={15} color={C.excel} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nom}</p>
            {item.description && (
              <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{item.description}</p>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{item.village_nom ?? '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{item.sous_prefecture ?? '—'}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{fmtDate(item.televerse_le)}</td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{fmt(item.taille)}</td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {url && (
            <a href={url} target="_blank" rel="noreferrer"
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.muted, textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = C.green }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
            >
              <Download size={12} />
            </a>
          )}
          <button
            onClick={() => onDelete(item.id)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: `1px solid ${C.border}`, background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.light, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = C.red }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.light }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ── Upload Modal ────────────────────────────────────────────── */
function UploadModal({ mode, villages, onClose, onSuccess }) {
  const isPDF = mode === 'pdf'
  const fileRef = useRef(null)

  const [form, setForm]       = useState({ nom: '', village: '', description: '', dossier: '' })
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const accept = isPDF ? '.pdf' : '.xlsx,.xls,.csv'
  const label  = isPDF ? 'Ajouter un plan PDF' : 'Importer un fichier Excel'
  const hint   = isPDF ? 'Fichier PDF — plan de parcelle' : 'Fichier Excel (.xlsx, .xls, .csv)'

  const pickFile = (f) => {
    if (!f) return
    setFile(f)
    if (!form.nom) setForm(v => ({ ...v, nom: f.name.replace(/\.[^.]+$/, '') }))
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier.'); return }
    if (!form.nom.trim()) { setError('Le nom est requis.'); return }
    if (isPDF && !form.dossier) { setError('Le numéro de dossier est requis.'); return }
    if (!isPDF && !form.village) { setError('Le village est requis.'); return }

    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('fichier', file)
      fd.append('nom', form.nom.trim())
      if (isPDF) {
        fd.append('dossier', form.dossier)
        fd.append('type_fichier', 'PLAN')
      } else {
        fd.append('village', form.village)
        if (form.description) fd.append('description', form.description)
      }
      if (isPDF) await uploadPlanPDF(fd)
      else       await uploadExcelPublicite(fd)
      onSuccess()
    } catch (e) {
      const msg = e?.response?.data
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Erreur lors de l\'envoi.')
    } finally {
      setLoading(false)
    }
  }

  const accentColor = isPDF ? C.pdf : C.excel
  const bgAccent    = `${accentColor}12`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: C.card, borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 48px rgba(15,23,42,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: bgAccent,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${accentColor}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPDF ? <FileText size={18} color={accentColor} /> : <FileSpreadsheet size={18} color={accentColor} />}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{label}</p>
              <p style={{ fontSize: 12, color: C.muted }}>{hint}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${C.border}`, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.muted, cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? accentColor : file ? C.green : C.border}`,
              borderRadius: 12, padding: '24px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: dragOver ? `${accentColor}08` : file ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.18s',
            }}
          >
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <CheckCircle2 size={20} color={C.green} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{file.name}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{fmt(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={24} color={C.light} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>
                  Glisser-déposer ou <span style={{ color: accentColor }}>parcourir</span>
                </p>
                <p style={{ fontSize: 11, color: C.light, marginTop: 4 }}>{accept}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }}
              onChange={e => pickFile(e.target.files?.[0])} />
          </div>

          {/* Nom */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
              Nom du fichier *
            </label>
            <input
              value={form.nom}
              onChange={e => setForm(v => ({ ...v, nom: e.target.value }))}
              placeholder="Ex : Plan parcelle Kohoua_CF-2024-0123"
              style={{
                width: '100%', padding: '9px 12px',
                border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, color: C.text, background: C.card,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Village (Excel) ou Dossier (PDF) */}
          {isPDF ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                N° de dossier (ID) *
              </label>
              <input
                value={form.dossier}
                onChange={e => setForm(v => ({ ...v, dossier: e.target.value }))}
                placeholder="ID du dossier CF"
                type="number"
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontSize: 13, color: C.text, background: C.card,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                Village *
              </label>
              <Select
                value={form.village}
                onChange={v => setForm(f => ({ ...f, village: v }))}
                options={villages.map(v => ({ value: String(v.id), label: v.nom }))}
                placeholder="Sélectionner un village"
              />
            </div>
          )}

          {/* Description (Excel seulement) */}
          {!isPDF && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
                Description
              </label>
              <input
                value={form.description}
                onChange={e => setForm(v => ({ ...v, description: e.target.value }))}
                placeholder="Ex : Liste publicité mars 2026 — 45 parcelles"
                style={{
                  width: '100%', padding: '9px 12px',
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  fontSize: 13, color: C.text, background: C.card,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 8,
              background: '#fef2f2', border: `1px solid ${C.red}40`,
              fontSize: 12, color: C.red,
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.card,
            fontSize: 13, fontWeight: 500, color: C.muted, cursor: 'pointer',
          }}>
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '9px 20px', borderRadius: 8,
              border: 'none', background: loading ? `${accentColor}80` : accentColor,
              fontSize: 13, fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'background 0.15s',
            }}
          >
            {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {isPDF ? 'Ajouter le PDF' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────── */
function Empty({ tab }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      color: C.muted,
    }}>
      {tab === 'pdf'
        ? <FileText size={40} color={C.border} style={{ margin: '0 auto 12px' }} />
        : <FileSpreadsheet size={40} color={C.border} style={{ margin: '0 auto 12px' }} />
      }
      <p style={{ fontSize: 15, fontWeight: 600, color: C.light }}>Aucun fichier trouvé</p>
      <p style={{ fontSize: 13, marginTop: 4 }}>
        {tab === 'pdf'
          ? 'Utilisez « Ajouter PDF » pour enregistrer un plan de parcelle.'
          : 'Utilisez « Importer Excel » pour ajouter une liste de parcelles en publicité.'
        }
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════ */
export default function PublicitePage() {
  const { zone } = useParams()
  const zoneId   = ZONE_IDS[zone] ?? null

  // Données
  const [villages,    setVillages]    = useState([])
  const [pdfs,        setPdfs]        = useState([])
  const [excels,      setExcels]      = useState([])
  const [loading,     setLoading]     = useState(false)

  // Filtres
  const [dept,        setDept]        = useState('')
  const [sousPref,    setSousPref]    = useState('')
  const [villageId,   setVillageId]   = useState('')
  const [search,      setSearch]      = useState('')

  // UI
  const [tab,         setTab]         = useState('pdf')   // 'pdf' | 'excel'
  const [modal,       setModal]       = useState(null)    // null | 'pdf' | 'excel'

  /* ── Options filtres ─────────────────────────────────────────── */
  const depts = [...new Set(
    villages
      .filter(v => v.sous_prefecture_fk?.departement_nom || v.sous_prefecture)
      .map(v => v.sous_prefecture?.split('/')?.[0]?.trim() ?? v.sous_prefecture)
  )].sort().map(d => ({ value: d, label: d }))

  const sousPrefOptions = [...new Set(
    villages
      .filter(v => !dept || v.sous_prefecture?.toUpperCase().includes(dept.toUpperCase()))
      .map(v => v.sous_prefecture)
      .filter(Boolean)
  )].sort().map(s => ({ value: s, label: s }))

  const villageOptions = villages
    .filter(v => {
      if (sousPref && v.sous_prefecture !== sousPref) return false
      return true
    })
    .map(v => ({ value: String(v.id), label: v.nom }))

  /* ── Chargement villages ─────────────────────────────────────── */
  useEffect(() => {
    if (!zoneId) return
    getVillages({ zone: zoneId }).then(r => setVillages(r.data.results ?? r.data))
  }, [zoneId])

  /* ── Chargement fichiers ─────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (zoneId)    params.zone      = zoneId
      if (villageId) params.village   = villageId
      if (sousPref)  params.sous_pref = sousPref

      if (tab === 'pdf') {
        const r = await getPlansPDF(params)
        setPdfs(r.data.results ?? r.data)
      } else {
        const r = await getExcelsPublicite(params)
        setExcels(r.data.results ?? r.data)
      }
    } finally {
      setLoading(false)
    }
  }, [tab, zoneId, villageId, sousPref])

  useEffect(() => { load() }, [load])

  /* ── Suppression ─────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce fichier ?')) return
    try {
      if (tab === 'pdf') await deleteFichier(id)
      else               await deleteExcelPublicite(id)
      load()
    } catch { /* ignore */ }
  }

  /* ── Filtre local (search) ───────────────────────────────────── */
  const q = search.toLowerCase()
  const filteredPdfs = pdfs.filter(f =>
    !q || f.nom?.toLowerCase().includes(q) || f.village_nom?.toLowerCase().includes(q)
  )
  const filteredExcels = excels.filter(f =>
    !q || f.nom?.toLowerCase().includes(q) || f.village_nom?.toLowerCase().includes(q)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>
      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.navy, lineHeight: '28px' }}>
            Publicité
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>
            Plans PDF et listes Excel des parcelles envoyées en publicité
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setModal('excel')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 9,
              border: `1.5px solid ${C.excel}`,
              background: 'transparent', color: C.excel,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${C.excel}12` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <FileSpreadsheet size={15} />
            Importer Excel
          </button>
          <button
            onClick={() => setModal('pdf')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 9,
              border: 'none', background: C.orange, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
              boxShadow: `0 3px 10px ${C.orange}50`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#b54e1e' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.orange }}
          >
            <Plus size={15} />
            Ajouter PDF
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4,
        background: C.card, borderRadius: 10,
        border: `1px solid ${C.border}`,
        padding: 4, width: 'fit-content',
      }}>
        {[
          { key: 'pdf',   icon: FileText,        label: 'Plans PDF',        count: pdfs.length    },
          { key: 'excel', icon: FileSpreadsheet,  label: 'Listes Excel',     count: excels.length  },
        ].map(({ key, icon: Icon, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 7, border: 'none',
              background: tab === key ? (key === 'pdf' ? `${C.pdf}12` : `${C.excel}12`) : 'transparent',
              color: tab === key ? (key === 'pdf' ? C.pdf : C.excel) : C.muted,
              fontSize: 13, fontWeight: tab === key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
            {label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '1px 7px', borderRadius: 10,
              background: tab === key
                ? (key === 'pdf' ? `${C.pdf}20` : `${C.excel}20`)
                : `${C.border}`,
              color: tab === key ? (key === 'pdf' ? C.pdf : C.excel) : C.muted,
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filtres ─────────────────────────────────────────────── */}
      <div style={{
        background: C.card, borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: C.light, pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un fichier ou village…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: `1px solid ${C.border}`, borderRadius: 8,
              fontSize: 13, color: C.text, background: C.card,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ width: 1, height: 28, background: C.border }} />

        {/* Département */}
        <Select
          value={dept}
          onChange={v => { setDept(v); setSousPref(''); setVillageId('') }}
          options={depts}
          placeholder="Département"
        />

        {/* Sous-préfecture */}
        <Select
          value={sousPref}
          onChange={v => { setSousPref(v); setVillageId('') }}
          options={sousPrefOptions}
          placeholder="Sous-préfecture"
          disabled={!dept && depts.length > 0}
        />

        {/* Village */}
        <Select
          value={villageId}
          onChange={setVillageId}
          options={villageOptions}
          placeholder="Village"
          disabled={!sousPref && sousPrefOptions.length > 0}
        />

        {/* Reset */}
        {(dept || sousPref || villageId || search) && (
          <button
            onClick={() => { setDept(''); setSousPref(''); setVillageId(''); setSearch('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              fontSize: 12, color: C.muted, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = C.red }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}
          >
            <X size={12} /> Effacer
          </button>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────────── */}
      <div style={{
        background: C.card, borderRadius: 12,
        border: `1px solid ${C.border}`,
        minHeight: 300, flex: 1,
      }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 64, color: C.muted, gap: 10,
          }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Chargement…
          </div>
        ) : tab === 'pdf' ? (
          filteredPdfs.length === 0 ? <Empty tab="pdf" /> : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14, padding: 16,
            }}>
              {filteredPdfs.map(f => (
                <PdfCard key={f.id} item={f} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : (
          filteredExcels.length === 0 ? <Empty tab="excel" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                    {['Fichier', 'Village', 'Sous-préfecture', 'Date', 'Taille', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: C.muted,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExcels.map((f, i) => (
                    <ExcelRow key={f.id} item={f} index={i} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ── Modal upload ─────────────────────────────────────────── */}
      {modal && (
        <UploadModal
          mode={modal}
          villages={villageOptions.length ? villages : villages}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); load() }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
