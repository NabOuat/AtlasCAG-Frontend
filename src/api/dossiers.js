import client from './client'

export const getDossiers      = (params = {}) => client.get('/dossiers/',           { params })
export const getDossier       = (id)          => client.get(`/dossiers/${id}/`)
export const createDossier    = (data)        => client.post('/dossiers/',           data)
export const updateDossier    = (id, data)    => client.patch(`/dossiers/${id}/`,    data)
export const deleteDossier    = (id)          => client.delete(`/dossiers/${id}/`)
export const getDossierStats  = (params = {}) => client.get('/dossiers/stats/',      { params })
