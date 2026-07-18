import client from './client'

export const getPlanning     = (params = {}) => client.get('/terrain/planning/',          { params })
export const createPlanning  = (data)        => client.post('/terrain/planning/',          data)
export const updatePlanning  = (id, data)    => client.patch(`/terrain/planning/${id}/`,   data)
export const deletePlanning  = (id)          => client.delete(`/terrain/planning/${id}/`)

export const getLayons       = (params = {}) => client.get('/terrain/layons/',             { params })
