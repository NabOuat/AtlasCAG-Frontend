import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { login, getMe } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

/* ── Hex grid filigrane ──────────────────────────────────── */
function HexGrid() {
  const r = 26, colSp = r * 1.5, rowSp = r * Math.sqrt(3)
  const hexes = []
  for (let c = 0; c < 15; c++) {
    for (let row = 0; row < 18; row++) {
      const cx = c * colSp + r
      const cy = row * rowSp + (c % 2 ? rowSp / 2 : 0) + r
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 30)
        return `${(cx + (r - 2) * Math.cos(a)).toFixed(1)},${(cy + (r - 2) * Math.sin(a)).toFixed(1)}`
      }).join(' ')
      hexes.push(<polygon key={`h${c}-${row}`} points={pts}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.7" />)
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{hexes}</svg>
  )
}

/* ── Boussole cartographique ─────────────────────────────── */
function Compass() {
  const cx = 160, cy = 160, R = 140
  const rings = [35, 70, 105, 135]
  const gridLines = [-100, -50, 0, 50, 100]
  return (
    <svg width="320" height="320" viewBox="0 0 320 320"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
         className="w-full max-w-[260px] mx-auto">
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#41A6C7" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#41A6C7" stopOpacity="0" />
        </radialGradient>
        <clipPath id="disc"><circle cx={cx} cy={cy} r={R} /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="url(#rg)" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(65,166,199,0.2)" strokeWidth="1" />
      <g clipPath="url(#disc)">
        {gridLines.map(o => (
          <g key={o}>
            <line x1={cx+o} y1={cy-R} x2={cx+o} y2={cy+R} stroke="rgba(65,166,199,0.1)" strokeWidth="0.7" />
            <line x1={cx-R} y1={cy+o} x2={cx+R} y2={cy+o} stroke="rgba(65,166,199,0.1)" strokeWidth="0.7" />
          </g>
        ))}
      </g>
      {rings.map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(65,166,199,0.13)" strokeWidth="0.8"
          strokeDasharray={r > 70 ? '3 5' : 'none'} />
      ))}
      {/* Axes */}
      <line x1={cx} y1={cy-R+14} x2={cx} y2={cy-38} stroke="rgba(199,90,36,0.55)" strokeWidth="1.2" />
      <line x1={cx} y1={cy+38}   x2={cx} y2={cy+R-14} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1={cx-R+14} y1={cy} x2={cx-38} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <line x1={cx+38}   y1={cy} x2={cx+R-14} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {/* Flèche Nord */}
      <polygon points={`${cx},${cy-38} ${cx-7},${cy-16} ${cx+7},${cy-16}`} fill="#C75A24" opacity="0.9" />
      <polygon points={`${cx},${cy+38} ${cx-7},${cy+16} ${cx+7},${cy+16}`} fill="rgba(255,255,255,0.25)" />
      {/* Centre */}
      <circle cx={cx} cy={cy} r={5}  fill="#1a2536" />
      <circle cx={cx} cy={cy} r={2.5} fill="#C75A24" />
      {/* N */}
      <text x={cx} y={cy-R+11} textAnchor="middle" fill="#C75A24"
        fontSize="11" fontWeight="700" fontFamily="Roboto,sans-serif">N</text>
      {/* Ticks */}
      {Array.from({ length: 36 }, (_, i) => {
        const a  = (Math.PI / 180) * (i * 10)
        const r1 = R - (i % 9 === 0 ? 12 : i % 3 === 0 ? 7 : 4)
        return (
          <line key={i}
            x1={(cx + R  * Math.cos(a)).toFixed(1)} y1={(cy + R  * Math.sin(a)).toFixed(1)}
            x2={(cx + r1 * Math.cos(a)).toFixed(1)} y2={(cy + r1 * Math.sin(a)).toFixed(1)}
            stroke={i % 9 === 0 ? 'rgba(199,90,36,0.55)' : 'rgba(255,255,255,0.14)'}
            strokeWidth={i % 9 === 0 ? '1.5' : '0.7'} />
        )
      })}
    </svg>
  )
}

const FEATURES = [
  { dot: '#C75A24', label: 'Gestion des dossiers fonciers' },
  { dot: '#41A6C7', label: 'Cartographie et zonage territorial' },
  { dot: '#43D793', label: 'Reporting et validation AFOR' },
]

export default function Login() {
  const [form, setForm]        = useState({ username: '', password: '' })
  const [showPwd, setShowPwd]  = useState(false)
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState(null)
  const navigate               = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { data }     = await login(form.username, form.password)
      setTokens(data.access, data.refresh)
      const { data: me } = await getMe()
      setUser(me)
      navigate('/')
    } catch {
      setError("Identifiants incorrects.")
    } finally {
      setLoading(false)
    }
  }

  const focusF = (e) => {
    e.target.style.borderColor     = '#C75A24'
    e.target.style.backgroundColor = '#fff'
    e.target.style.boxShadow       = '0 0 0 3px rgba(199,90,36,0.11)'
  }
  const blurF  = (e) => {
    e.target.style.borderColor     = '#e5e7eb'
    e.target.style.backgroundColor = '#f9fafb'
    e.target.style.boxShadow       = 'none'
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: 'Roboto, sans-serif' }}>

      {/* ══ PANNEAU GAUCHE ══════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[56%] relative flex-col overflow-hidden"
           style={{ background: 'linear-gradient(155deg, #1c2d40 0%, #0e1c2c 50%, #08101a 100%)' }}>
        <HexGrid />

        {/* Halos */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(199,90,36,0.1) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(65,166,199,0.09) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-between h-full px-10 py-8">
          {/* Logo */}
          <img src="/logo.png" alt="AtlasCAG" className="h-10 w-auto object-contain"
               style={{ filter: 'brightness(0) invert(1)' }} />

          {/* Centre */}
          <div className="flex flex-col gap-6">
            <Compass />
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2"
                 style={{ color: '#41A6C7' }}>
                Agence Foncière Rurale · Côte d'Ivoire
              </p>
              <h1 className="font-bold text-white leading-tight mb-3"
                  style={{ fontSize: '28px' }}>
                La donnée foncière,<br />
                <span style={{ color: '#C75A24' }}>précise</span> et{' '}
                <span style={{ color: '#43D793' }}>fiable</span>.
              </h1>
              <div className="space-y-2">
                {FEATURES.map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dot }} />
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.52)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            AtlasCAG v0.1 · © 2026 AFOR
          </p>
        </div>
      </div>

      {/* ══ PANNEAU DROIT ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#fff' }}>

        {/* Bande tricolore */}
        <div className="flex h-1 flex-shrink-0">
          <div className="flex-1" style={{ backgroundColor: '#C75A24' }} />
          <div className="w-16"  style={{ backgroundColor: '#41A6C7' }} />
          <div className="w-8"   style={{ backgroundColor: '#43D793' }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-14">

          {/* Logo mobile */}
          <div className="lg:hidden mb-6">
            <img src="/logo.png" alt="AtlasCAG" className="h-12 w-auto mx-auto" />
          </div>

          <div className="w-full max-w-[360px]">

            {/* En-tête */}
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5"
                 style={{ color: '#C75A24' }}>
                Plateforme de gestion foncière
              </p>
              <h2 className="font-bold mb-1" style={{ fontSize: '24px', color: '#0e1c2c' }}>
                Connexion
              </h2>
              <p className="text-[13px]" style={{ color: '#6b7280' }}>
                Accédez à votre espace de travail AFOR.
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex gap-2 items-center rounded-lg p-3 mb-4"
                   style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}>
                <AlertCircle size={14} style={{ color: '#ef4444' }} className="shrink-0" />
                <p className="text-[12px]" style={{ color: '#c53030' }}>{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">

              {/* Identifiant */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#374151' }}>
                  Identifiant
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                       style={{ color: '#c0c4cc' }} />
                  <input
                    type="text" value={form.username} onChange={onChange('username')}
                    placeholder="Votre nom d'utilisateur"
                    autoComplete="username" required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 outline-none"
                    style={{ fontFamily:'Roboto,sans-serif', fontSize:'13px',
                             color:'#1f2937', backgroundColor:'#f9fafb', borderColor:'#e5e7eb' }}
                    onFocus={focusF} onBlur={blurF}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#374151' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                       style={{ color: '#c0c4cc' }} />
                  <input
                    type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange('password')}
                    placeholder="••••••••••"
                    autoComplete="current-password" required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border-2 outline-none"
                    style={{ fontFamily:'Roboto,sans-serif', fontSize:'13px',
                             color:'#1f2937', backgroundColor:'#f9fafb', borderColor:'#e5e7eb' }}
                    onFocus={focusF} onBlur={blurF}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-60"
                    style={{ color: '#9ca3af' }}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13px] text-white"
                style={{
                  background: 'linear-gradient(135deg, #C75A24 0%, #d96b30 100%)',
                  boxShadow: '0 4px 14px rgba(199,90,36,0.3)',
                  opacity: loading ? 0.75 : 1,
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg,#a8491c,#bf5a24)' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg,#C75A24,#d96b30)' }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> Connexion…</> : 'Se connecter'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] mt-6" style={{ color: '#d1d5db' }}>
              Accès réservé aux agents AFOR · © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
