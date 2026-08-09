import { useState } from 'react'
import { MapPin, Building2 } from 'lucide-react'
import { C, S } from '@/utils/theme'
import PlanningTerrain from './PlanningTerrain'
import PlanningBureau from './PlanningBureau'

const TABS = [
  { key: 'terrain', icon: MapPin,    label: 'Planning Terrain' },
  { key: 'bureau',  icon: Building2, label: 'Planning Bureau' },
]

export default function PlanningSuiviPage() {
  const [tab, setTab] = useState('terrain')

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div style={{
        display: 'flex', gap: 4, background: C.card, borderRadius: 10,
        padding: 4, border: `1px solid ${C.border}`, boxShadow: S.shadowLight,
        marginBottom: 16, width: 'fit-content', flexShrink: 0,
      }}>
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 7, border: 'none',
              background: tab === key ? `${C.primary}12` : 'transparent',
              color: tab === key ? C.primary : C.muted,
              fontSize: 13, fontWeight: tab === key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'terrain' ? <PlanningTerrain /> : <PlanningBureau />}
      </div>
    </div>
  )
}
