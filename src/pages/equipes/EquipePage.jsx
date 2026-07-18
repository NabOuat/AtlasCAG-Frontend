import { useLocation } from 'react-router-dom'
import { useZone } from '@/layouts/ZoneLayout'
import { Users, Wrench, Compass } from 'lucide-react'

const CFG = {
  ce:   { label: 'Commissaires Enquêteurs',   icon: Users,   color: '#C75A24' },
  cet:  { label: "Chefs d'Équipe Technique",  icon: Wrench,  color: '#41A6C7' },
  gnss: { label: 'Agents GNSS',               icon: Compass, color: '#43D793' },
}

export default function EquipePage() {
  const { pathname } = useLocation()
  const zone = useZone()
  const key  = pathname.split('/').pop()
  const { label, icon: Icon, color } = CFG[key] ?? CFG.ce

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ backgroundColor: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: '#1a2536' }}>{label}</h1>
          <p className="text-[11.5px]" style={{ color: '#6b7280' }}>Zone {zone}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl flex flex-col items-center justify-center py-20"
           style={{ border: '1px solid #f0f0f0' }}>
        <Icon size={40} style={{ color: '#d1d5db', marginBottom: 12 }} />
        <p className="text-[14px] font-semibold" style={{ color: '#1a2536' }}>Module en développement</p>
        <p className="text-[12px] mt-1" style={{ color: '#9ca3af' }}>
          Ce module sera disponible prochainement.
        </p>
      </div>
    </div>
  )
}
