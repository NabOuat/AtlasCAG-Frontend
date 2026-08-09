import client from './client'

export const getDossiers      = (params = {}) => client.get('/dossiers/',           { params })
export const getDossier       = (id)          => client.get(`/dossiers/${id}/`)
export const createDossier    = (data)        => client.post('/dossiers/',           data)
export const updateDossier    = (id, data)    => client.patch(`/dossiers/${id}/`,    data)
export const deleteDossier    = (id)          => client.delete(`/dossiers/${id}/`)
export const getDossierStats  = (params = {}) => client.get('/dossiers/stats/',      { params })

// ── Suivi CF (import ADS / DigiFor) ───────────────────────────────────────────

export const getSuiviCF    = (params = {}) => client.get('/dossiers/suivi-cf/', { params })
export const importAdsFile = (formData)    =>
  client.post('/dossiers/suivi-cf/import-ads/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// ── Vagues d'envoi ─────────────────────────────────────────────────────────────

export const getVagues = (params = {}) => client.get('/dossiers/vagues/', { params })
