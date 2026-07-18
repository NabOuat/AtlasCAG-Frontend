import client from './client'

export const getZones   = ()        => client.get('/referentiel/zones/')
export const getRegions = ()        => client.get('/referentiel/regions/')

export const getVillages     = (params = {}) => client.get('/referentiel/villages/',          { params })
export const getVillagesDTVStats = (params = {}) => client.get('/referentiel/villages/stats_dtv/', { params })
