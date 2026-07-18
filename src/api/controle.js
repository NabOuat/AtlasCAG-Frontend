import client from './client'

export const getControles     = (params = {}) => client.get('/controle/controles/',          { params })
export const getControle      = (id)          => client.get(`/controle/controles/${id}/`)
export const createControle   = (data)        => client.post('/controle/controles/',          data)
export const updateControle   = (id, data)    => client.patch(`/controle/controles/${id}/`,   data)
export const getControleStats = (params = {}) => client.get('/controle/controles/stats/',     { params })

export const getEnvois        = (params = {}) => client.get('/controle/envois/',              { params })
export const createEnvoi      = (data)        => client.post('/controle/envois/',              data)

// ── Contrôle Qualité ──────────────────────────────────────────────────────
export const getQcVillages = (params = {}) => client.get('/controle/qc/villages/', { params })
export const getQcDossiers = (params = {}) => client.get('/controle/qc/dossiers/', { params })
