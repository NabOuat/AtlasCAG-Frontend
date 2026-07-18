import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout    from '@/layouts/AppLayout'
import AuthLayout   from '@/layouts/AuthLayout'
import ZoneLayout   from '@/layouts/ZoneLayout'
import { useAuthStore } from '@/store/authStore'

const Login          = lazy(() => import('@/pages/auth/Login'))
const Dashboard      = lazy(() => import('@/pages/dashboard/Dashboard'))
const DossierList    = lazy(() => import('@/pages/dossiers/DossierList'))
const DossierDetail  = lazy(() => import('@/pages/dossiers/DossierDetail'))
const VillageList    = lazy(() => import('@/pages/villages/VillageList'))
const ControleList   = lazy(() => import('@/pages/controle/ControleList'))
const ControleQC     = lazy(() => import('@/pages/controle/ControleQC'))
const PlanningPage   = lazy(() => import('@/pages/planning/PlanningPage'))
const RapportPage    = lazy(() => import('@/pages/rapports/RapportPage'))
const AdminPage      = lazy(() => import('@/pages/admin/AdminPage'))
const GeoPortail     = lazy(() => import('@/pages/geo/GeoPortail'))
const CfParcelles    = lazy(() => import('@/pages/geo/CfParcelles'))
const EquipePage     = lazy(() => import('@/pages/equipes/EquipePage'))
const TraitementPage = lazy(() => import('@/pages/traitement/TraitementPage'))

const Loader = () => (
  <div className="flex justify-center items-center py-20">
    <div className="w-7 h-7 border-2 rounded-full animate-spin"
         style={{ borderColor: '#C75A24', borderTopColor: 'transparent' }} />
  </div>
)

function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const wrap = (el) => <Suspense fallback={<Loader />}>{el}</Suspense>

/* Routes identiques pour Cavally et Worodougou */
const zoneChildren = [
  { index: true,                element: <Navigate to="cf" replace /> },
  { path: 'cf',                 element: wrap(<DossierList />) },
  { path: 'dtv',                element: wrap(<VillageList />) },
  { path: 'ce',                 element: wrap(<EquipePage />) },
  { path: 'cet',                element: wrap(<EquipePage />) },
  { path: 'gnss',               element: wrap(<EquipePage />) },
  { path: 'traitement-cf',      element: wrap(<TraitementPage />) },
  { path: 'traitement-dtv',     element: wrap(<TraitementPage />) },
  { path: 'planning',           element: wrap(<PlanningPage />) },
  { path: 'controle',           element: wrap(<ControleQC />) },
]

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: wrap(<Login />) }],
  },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true,          element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',    element: wrap(<Dashboard />) },
      { path: 'geo',          element: wrap(<GeoPortail />) },
      { path: 'geo/cf',       element: wrap(<CfParcelles />) },
      { path: 'admin',        element: wrap(<AdminPage />) },
      /* Routes legacy — accessibles directement mais hors sidebar */
      { path: 'dossiers',     element: wrap(<DossierList />) },
      { path: 'dossiers/:id', element: wrap(<DossierDetail />) },
      { path: 'rapports',     element: wrap(<RapportPage />) },
      /* Zones */
      {
        path: 'cavally',
        element: <ZoneLayout zone="CAVALLY" />,
        children: zoneChildren,
      },
      {
        path: 'worodougou',
        element: <ZoneLayout zone="WORODOUGOU" />,
        children: zoneChildren,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
