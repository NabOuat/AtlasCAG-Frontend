import { createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

export const ZoneContext = createContext(null)
export const useZone = () => useContext(ZoneContext)

export default function ZoneLayout({ zone }) {
  return (
    <ZoneContext.Provider value={zone}>
      <Outlet />
    </ZoneContext.Provider>
  )
}
