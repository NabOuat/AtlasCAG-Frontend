import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderOpen, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { getDossier, updateDossier } from '@/api/dossiers'
import dayjs from 'dayjs'

const C = { orange: '#C75A24', teal: '#41A6C7', green: '#43D793', navy: '#1a2536', gray: '#6b7280' }

const STATUT = {
  EN_COURS: { bg: '#fef9c3', text: '#b45309', label: 'En cours',  icon: Clock },
  VALIDE:   { bg: '#dcfce7', text: '#15803d', label: 'Validé',    icon: CheckCircle2 },
  REJETE:   { bg: '#fee2e2', text: '#b91c1c', label: 'Rejeté',    icon: XCircle },
  ARCHIVE:  { bg: '#f3f4f6', text: '#6b7280', label: 'Archivé',   icon: FileText },
  ANNULE:   { bg: '#fce7f3', text: '#9d174d', label: 'Annulé',    icon: XCircle },
}

const TYPE = {
  DTV:                { bg: '#e0f2fe', text: '#0369a1', label: 'Délimitation territoriale de village' },
  CF:                 { bg: '#dcfce7', text: '#15803d', label: 'Certification foncière' },
  CONTRACTUALISATION: { bg: '#fef3c7', text: '#92400e', label: 'Contractualisation' },
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start py-2.5" style={{ borderBottom: '1px solid #f5f5f5' }}>
      <span className="w-40 flex-shrink-0 text-[12px]" style={{ color: C.gray }}>{label}</span>
      <span className="text-[12.5px] font-medium" style={{ color: '#333' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function DossierDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDossier(id)
      .then(r  => setDossier(r.data))
      .catch(() => navigate('/dossiers'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-7 h-7 border-2 rounded-full animate-spin"
           style={{ borderColor: C.orange, borderTopColor: 'transparent' }} />
    </div>
  )

  if (!dossier) return null

  const s = STATUT[dossier.statut]     ?? STATUT.EN_COURS
  const t = TYPE[dossier.type_dossier] ?? TYPE.DTV
  const SIcon = s.icon

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Back */}
      <button onClick={() => navigate('/dossiers')}
              className="flex items-center gap-2 text-[12.5px] hover:underline"
              style={{ color: C.gray }}>
        <ArrowLeft size={14} />
        Retour aux dossiers
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6"
           style={{ border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ backgroundColor: `${C.orange}15` }}>
              <FolderOpen size={22} style={{ color: C.orange }} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: C.navy }}>
                {dossier.numero_dossier}
              </h1>
              <p className="text-[12.5px]" style={{ color: C.gray }}>
                {dossier.village_nom} · {dossier.zone_nom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: t.bg, color: t.text }}>
              {t.label}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: s.bg, color: s.text }}>
              <SIcon size={11} />
              {s.label}
            </span>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6"
             style={{ border: '1px solid #f0f0f0' }}>
          <h2 className="text-[13.5px] font-bold mb-3" style={{ color: C.navy }}>Informations</h2>
          <InfoRow label="N° dossier"  value={dossier.numero_dossier} />
          <InfoRow label="Village"     value={dossier.village_nom} />
          <InfoRow label="Zone"        value={dossier.zone_nom} />
          <InfoRow label="Type"        value={t.label} />
          <InfoRow label="Créé par"    value={dossier.cree_par_nom} />
          <InfoRow label="Créé le"     value={dayjs(dossier.cree_le).format('DD MMMM YYYY')} />
          <InfoRow label="Modifié le"  value={dayjs(dossier.modifie_le).format('DD MMMM YYYY')} />
        </div>

        {/* Historique */}
        <div className="bg-white rounded-2xl p-6"
             style={{ border: '1px solid #f0f0f0' }}>
          <h2 className="text-[13.5px] font-bold mb-3" style={{ color: C.navy }}>Historique des statuts</h2>
          {(!dossier.historique || dossier.historique.length === 0) ? (
            <p className="text-[12px]" style={{ color: C.gray }}>Aucun historique</p>
          ) : (
            <div className="space-y-0">
              {dossier.historique.map((h) => (
                <div key={h.id} className="flex gap-3 py-2.5" style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: C.orange }} />
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: C.navy }}>
                      {h.ancien_statut} → {h.nouveau_statut}
                    </p>
                    {h.commentaire && (
                      <p className="text-[11px]" style={{ color: C.gray }}>{h.commentaire}</p>
                    )}
                    <p className="text-[10.5px] mt-0.5" style={{ color: '#9ca3af' }}>
                      {h.modifie_par_nom ?? 'Système'} · {dayjs(h.modifie_le).format('DD/MM/YY HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
