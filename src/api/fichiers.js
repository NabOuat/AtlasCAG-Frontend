import client from './client'

// ── Plans PDF (FichierDossier) ────────────────────────────────────────────────

export const getFichiers = (params = {}) =>
  client.get('/fichiers/', { params })

export const getPlansPDF = (params = {}) =>
  client.get('/fichiers/', { params: { type_fichier: 'PLAN', ...params } })

export const uploadPlanPDF = (formData) =>
  client.post('/fichiers/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteFichier = (id) =>
  client.delete(`/fichiers/${id}/`)

// ── Excel publicité ───────────────────────────────────────────────────────────

export const getExcelsPublicite = (params = {}) =>
  client.get('/fichiers/excel-publicite/', { params })

export const uploadExcelPublicite = (formData) =>
  client.post('/fichiers/excel-publicite/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteExcelPublicite = (id) =>
  client.delete(`/fichiers/excel-publicite/${id}/`)
