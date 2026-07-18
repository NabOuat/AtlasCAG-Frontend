import api from './client'

export const getGeoLayer      = (zone, layerType) => api.get(`/geo/${zone}/${layerType}/`)
export const getGeoTables     = (zone)             => api.get(`/geo/${zone}/tables/`)
export const getCfParcelles   = (zone, params)     => api.get(`/geo/${zone}/cf/parcelles/`, { params })
export const getCfDetail      = (zone, numDemand)  => api.get(`/geo/${zone}/cf/detail/`,    { params: { num_demand: numDemand } })
