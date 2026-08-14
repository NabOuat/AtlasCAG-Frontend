import client from './client'

export const getDossiers      = (params = {}) => client.get('/dossiers/',           { params })
export const getDossier       = (id)          => client.get(`/dossiers/${id}/`)
export const createDossier    = (data)        => client.post('/dossiers/',           data)
export const updateDossier    = (id, data)    => client.patch(`/dossiers/${id}/`,    data)
export const deleteDossier    = (id)          => client.delete(`/dossiers/${id}/`)
export const getDossierStats  = (params = {}) => client.get('/dossiers/stats/',      { params })

// ── Suivi CF — suivi administratif des dossiers CF (statut, statut_cf, vague d'envoi) ────────
// Distinct de la table attributaire SIG (@/api/geo getCfParcelles), qui reste la source
// d'affichage cartographique — ceci pilote le workflow administratif.
export const getSuiviCF       = (params = {}) => client.get('/dossiers/suivi-cf/',        { params })
export const getSuiviCFItem   = (id)          => client.get(`/dossiers/suivi-cf/${id}/`)
export const createSuiviCF    = (data)        => client.post('/dossiers/suivi-cf/',        data)
export const updateSuiviCF    = (id, data)    => client.patch(`/dossiers/suivi-cf/${id}/`, data)
export const importAdsFile    = (formData)    => client.post('/dossiers/suivi-cf/import-ads/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// ── Vagues d'envoi ─────────────────────────────────────────────────────────────────────────
export const getVagues        = (params = {}) => client.get('/dossiers/vagues/',   { params })
export const createVague      = (data)        => client.post('/dossiers/vagues/',   data)
