import client from './client'

export const getRapportsBureau   = (params = {}) => client.get('/planning-bureau/rapports/', { params })
export const createRapportBureau = (formData)    =>
  client.post('/planning-bureau/rapports/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getDashboardBureau   = (params = {}) => client.get('/planning-bureau/rapports/dashboard/', { params })
export const exportRapportsBureau = (params = {}) =>
  client.get('/planning-bureau/rapports/export/', { params, responseType: 'blob' })
