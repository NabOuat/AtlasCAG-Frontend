import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, MapPin, CheckSquare,
  Calendar, Settings, LogOut, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Bell, Globe, Users,
  Wrench, Compass, FileCheck, Activity, FileText,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { PROFILS } from '@/utils/permissions'

/* ── Constantes ────────────────────────────────────────── */
const W_OPEN   = 260
const W_CLOSED = 64

const ZONE_ITEMS = [
  { path: 'cf',             icon: FolderOpen,  label: 'CF' },
  { path: 'dtv',            icon: MapPin,      label: 'DTV' },
  { path: 'ce',             icon: Users,       label: 'Commissaires Enquêteurs' },
  { path: 'cet',            icon: Wrench,      label: "Chefs d'Équipe Technique" },
  { path: 'gnss',           icon: Compass,     label: 'Agents GNSS' },
  { path: 'traitement-cf',  icon: FileCheck,   label: 'Traitement CF' },
  { path: 'traitement-dtv', icon: Activity,    label: 'Traitement DTV' },
  { path: 'planning',       icon: Calendar,    label: 'Planning & Suivi' },
  { path: 'controle',       icon: CheckSquare, label: 'Contrôle Qualité' },
]

const ZONES = [
  { key: 'cavally',    label: 'Cavally',    accent: '#E06B2F', rgb: '224,107,47'  },
  { key: 'worodougou', label: 'Worodougou', accent: '#3A9EB8', rgb: '58,158,184'  },
]

const TOP_ITEMS    = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/geo',       icon: Globe,           label: 'Géoportail' },
  { to: '/geo/cf',    icon: FileText,        label: 'Parcelles CF' },
]
const BOTTOM_ITEMS = [
  { to: '/admin', icon: Settings, label: 'Administration' },
]

const PROFIL_COLORS = {
  CHEF_PROJET: '#E06B2F', SIFOR_SENIOR: '#3A9EB8', SIFOR_JUNIOR: '#3A9EB8',
  CE: '#43D793', CR: '#43D793', CET: '#64748b', AGENT_GNSS: '#64748b', RAF: '#a78bfa',
}

/* Breadcrumb */
function getBreadcrumb(pathname) {
  if (pathname === '/dashboard') return [{ label: 'Tableau de bord' }]
  if (pathname === '/geo')       return [{ label: 'Géoportail' }]
  if (pathname === '/geo/cf')    return [{ label: 'Géoportail' }, { label: 'Parcelles CF' }]
  if (pathname === '/admin')     return [{ label: 'Administration' }]
  const m = pathname.match(/^\/(cavally|worodougou)\/(.+)/)
  if (m) {
    const z = ZONES.find(z => z.key === m[1])
    const item = ZONE_ITEMS.find(i => i.path === m[2])
    return [{ label: z?.label ?? m[1], accent: z?.accent }, { label: item?.label ?? m[2] }]
  }
  return [{ label: 'AtlasCAG' }]
}

/* ── Tooltip portal ────────────────────────────────────── */
function Tooltip({ label, anchorY }) {
  return createPortal(
    <div style={{
      position: 'fixed', left: W_CLOSED + 8, top: anchorY,
      transform: 'translateY(-50%)',
      background: '#1e293b', color: '#f1f5f9',
      fontSize: 12, fontWeight: 500, letterSpacing: '0.01em',
      padding: '6px 12px', borderRadius: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
      pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 9999,
    }}>
      <span style={{
        position: 'absolute', right: '100%', top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: '5px 6px 5px 0',
        borderStyle: 'solid',
        borderColor: 'transparent #1e293b transparent transparent',
        display: 'block',
      }} />
      {label}
    </div>,
    document.body
  )
}

/* ── Item navigation ───────────────────────────────────── */
function NavItem({ icon: Icon, label, active, onClick, collapsed, accent = '#E06B2F', rgb = '224,107,47' }) {
  const [hover, setHover] = useState(false)
  const [tipY,  setTipY]  = useState(null)
  const ref = useRef(null)

  const onEnter = () => {
    setHover(true)
    if (collapsed && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setTipY(r.top + r.height / 2)
    }
  }

  const bg = active
    ? `rgba(${rgb},0.14)`
    : hover ? 'rgba(255,255,255,0.055)' : 'transparent'
  const color = active
    ? `#${[...accent.slice(1)].reduce((a,c,i) => i%2?a+c:a+c,'')}`  // accent
    : hover ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.52)'

  /* accent correct */
  const textColor = active ? accent : hover ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.52)'

  return (
    <>
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onEnter}
        onMouseLeave={() => { setHover(false); setTipY(null) }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, padding: collapsed ? '9px 0' : '8px 12px',
          marginBottom: 1, borderRadius: 9, border: 'none', cursor: 'pointer',
          backgroundColor: bg, color: textColor,
          fontSize: 13, fontWeight: active ? 600 : 400,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <Icon size={15} strokeWidth={active ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
        {!collapsed && active && (
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            backgroundColor: accent, flexShrink: 0, opacity: 0.8,
          }} />
        )}
      </button>
      {collapsed && tipY !== null && <Tooltip label={label} anchorY={tipY} />}
    </>
  )
}

/* ── Header de zone ────────────────────────────────────── */
function ZoneHeader({ label, accent, rgb, isOpen, active, onToggle, collapsed }) {
  const [hover, setHover] = useState(false)
  const [tipY,  setTipY]  = useState(null)
  const ref = useRef(null)
  const lit = isOpen || active

  const onEnter = () => {
    setHover(true)
    if (collapsed && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setTipY(r.top + r.height / 2)
    }
  }

  return (
    <>
      <button
        ref={ref}
        onClick={onToggle}
        onMouseEnter={onEnter}
        onMouseLeave={() => { setHover(false); setTipY(null) }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 9, padding: collapsed ? '10px 0' : '9px 12px',
          marginBottom: 3, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: lit || hover
            ? `rgba(${rgb},0.12)`
            : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        {/* Puce colorée */}
        <div style={{
          width: 24, height: 24, borderRadius: 7, flexShrink: 0,
          backgroundColor: lit ? `rgba(${rgb},0.25)` : 'rgba(255,255,255,0.07)',
          border: `1px solid ${lit ? `rgba(${rgb},0.5)` : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: lit ? accent : 'rgba(255,255,255,0.25)',
            transition: 'background 0.15s',
          }} />
        </div>

        {!collapsed && (
          <>
            <span style={{
              flex: 1, textAlign: 'left',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              color: lit ? accent : 'rgba(255,255,255,0.4)',
              transition: 'color 0.15s',
            }}>
              {label}
            </span>
            <ChevronDown size={13} style={{
              color: lit ? `rgba(${rgb},0.6)` : 'rgba(255,255,255,0.22)',
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s ease, color 0.15s',
              flexShrink: 0,
            }} />
          </>
        )}
      </button>
      {collapsed && tipY !== null && <Tooltip label={label.toUpperCase()} anchorY={tipY} />}
    </>
  )
}

/* ── Divider ───────────────────────────────────────────── */
const Divider = () => (
  <div style={{ margin: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
)

/* ── Label section ─────────────────────────────────────── */
function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div style={{ height: 6 }} />
  return (
    <p style={{
      padding: '2px 12px 6px',
      fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

/* ════════════════════════════════════════════════════════ */
export default function AppLayout() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAuthStore()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('atlas-sidebar') === 'true'
  )
  const toggleSidebar = () => setCollapsed(c => {
    localStorage.setItem('atlas-sidebar', String(!c))
    return !c
  })

  const [openZones, setOpenZones] = useState(() => ({
    cavally:    !pathname.startsWith('/worodougou'),
    worodougou: pathname.startsWith('/worodougou'),
  }))

  useEffect(() => {
    if (pathname.startsWith('/cavally'))    setOpenZones(z => ({ ...z, cavally:    true }))
    if (pathname.startsWith('/worodougou')) setOpenZones(z => ({ ...z, worodougou: true }))
  }, [pathname])

  useEffect(() => {
    const h = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials    = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() : 'U'
  const profilColor = user ? (PROFIL_COLORS[user.profil] ?? '#64748b') : '#64748b'
  const crumbs      = getBreadcrumb(pathname)
  const sideW       = collapsed ? W_CLOSED : W_OPEN

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: sideW, display: 'flex', flexDirection: 'column',
        backgroundColor: '#0f172a',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '2px 0 16px rgba(0,0,0,0.25)',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* ── Logo ─────────────────────────────────────────── */}
        <div style={{
          height: 64, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: collapsed ? '0' : '0 8px 0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            {/* Logo carré */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #C75A24 0%, #e8813d 100%)',
              boxShadow: '0 4px 12px rgba(199,90,36,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/logo.png" alt="" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{
                  color: '#f8fafc', fontWeight: 700, fontSize: 15,
                  letterSpacing: '-0.025em', lineHeight: '20px', whiteSpace: 'nowrap',
                }}>AtlasCAG</p>
                <p style={{
                  color: 'rgba(255,255,255,0.3)', fontSize: 10,
                  letterSpacing: '0.1em', whiteSpace: 'nowrap',
                }}>GESTION FONCIÈRE</p>
              </div>
            )}
          </div>

          {/* Bouton toggle */}
          {!collapsed && (
            <button onClick={toggleSidebar} style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              <PanelLeftClose size={14} />
            </button>
          )}
          {collapsed && (
            <button onClick={toggleSidebar} style={{
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px 8px' }}>

          <SectionLabel collapsed={collapsed}>Principal</SectionLabel>
          {TOP_ITEMS.map(({ to, icon, label }) => (
            <NavItem key={to} icon={icon} label={label} collapsed={collapsed}
              active={pathname === to || pathname.startsWith(to + '/')}
              onClick={() => navigate(to)} />
          ))}

          <Divider />

          {ZONES.map(({ key, label, accent, rgb }) => {
            const isOpen     = openZones[key]
            const zoneActive = pathname.startsWith(`/${key}/`)

            return (
              <div key={key} style={{ marginBottom: 4 }}>
                <ZoneHeader
                  label={label} accent={accent} rgb={rgb}
                  isOpen={isOpen} active={zoneActive} collapsed={collapsed}
                  onToggle={() => setOpenZones(z => ({ ...z, [key]: !z[key] }))}
                />
                {isOpen && (
                  <div style={{ position: 'relative', paddingLeft: collapsed ? 0 : 6, paddingBottom: 6 }}>
                    {ZONE_ITEMS.map(({ path, icon, label: lbl }) => {
                      const to = `/${key}/${path}`
                      return (
                        <NavItem key={to} icon={icon} label={lbl}
                          collapsed={collapsed} accent={accent} rgb={rgb}
                          active={pathname === to || pathname.startsWith(to + '/')}
                          onClick={() => navigate(to)} />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <Divider />

          <SectionLabel collapsed={collapsed}>Système</SectionLabel>
          {BOTTOM_ITEMS.map(({ to, icon, label }) => (
            <NavItem key={to} icon={icon} label={label} collapsed={collapsed}
              active={pathname === to || pathname.startsWith(to + '/')}
              onClick={() => navigate(to)} />
          ))}
        </nav>

        {/* ── Profil ───────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, padding: collapsed ? '14px 0' : '12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, backgroundColor: 'rgba(0,0,0,0.2)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            backgroundColor: profilColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
            boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
          }}>
            {initials}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <p style={{
                color: '#f1f5f9', fontSize: 12.5, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                lineHeight: '18px',
              }}>
                {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : '—'}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.35)', fontSize: 10.5,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user ? (PROFILS[user.profil] ?? user.profil) : ''}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ══ CONTENU ══════════════════════════════════════════ */}
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        marginLeft: sideW,
        transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ── Topbar ───────────────────────────────────────── */}
        <header style={{
          height: 60, backgroundColor: '#fff',
          position: 'sticky', top: 0, zIndex: 40,
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 0 #e2e8f0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 28px',
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <ChevronRight size={14} style={{ color: '#cbd5e1' }} />}
                {i === 0 && c.accent && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: c.accent, flexShrink: 0,
                  }} />
                )}
                <span style={{
                  fontSize: 13.5,
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  color: i === crumbs.length - 1 ? '#0f172a' : '#94a3b8',
                }}>
                  {c.label}
                </span>
              </span>
            ))}
          </div>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notifications */}
            <TopbarBtn icon={Bell} />

            {/* Profil */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <UserBtn
                initials={initials} profilColor={profilColor}
                name={user?.first_name || user?.username || '—'}
                open={menuOpen}
                onClick={() => setMenuOpen(v => !v)}
              />
              {menuOpen && (
                <UserDropdown
                  user={user} initials={initials} profilColor={profilColor}
                  onLogout={() => { logout(); navigate('/login') }}
                />
              )}
            </div>
          </div>
        </header>

        {/* Contenu page */}
        <main style={{ flex: 1, padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ── Composants topbar ─────────────────────────────────── */
function TopbarBtn({ icon: Icon }) {
  const [h, setH] = useState(false)
  return (
    <button
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 38, height: 38, borderRadius: 10,
        border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: h ? '#f8fafc' : '#fff',
        color: h ? '#475569' : '#94a3b8',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <Icon size={16} />
    </button>
  )
}

function UserBtn({ initials, profilColor, name, open, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px 6px 6px', borderRadius: 10,
        border: '1px solid #e2e8f0',
        backgroundColor: open || h ? '#f8fafc' : '#fff',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: profilColor, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700,
      }}>
        {initials}
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{name}</span>
      <ChevronDown size={13} style={{
        color: '#94a3b8',
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s',
      }} />
    </button>
  )
}

function UserDropdown({ user, initials, profilColor, onLogout }) {
  const [h, setH] = useState(false)
  return (
    <div style={{
      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
      width: 216, backgroundColor: '#fff', borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 30px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)',
      overflow: 'hidden', zIndex: 50,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: profilColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: '18px' }}>
              {user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ''}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              {user ? (PROFILS[user.profil] ?? user.profil) : ''}
            </p>
          </div>
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding: 6 }}>
        <button
          onClick={onLogout}
          onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#ef4444',
            backgroundColor: h ? '#fef2f2' : 'transparent',
            transition: 'background 0.12s',
          }}
        >
          <LogOut size={14} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
