import client from './client'

export const getRapports     = (params = {}) => client.get('/rapports/',          { params })
export const getRapport      = (id)          => client.get(`/rapports/${id}/`)
export const createRapport   = (data)        => client.post('/rapports/',          data)
export const updateRapport   = (id, data)    => client.patch(`/rapports/${id}/`,   data)
export const deleteRapport   = (id)          => client.delete(`/rapports/${id}/`)
