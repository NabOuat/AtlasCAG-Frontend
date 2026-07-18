import client from './client'

export const getDashboard = () => client.get('/stats/dashboard/')

export const getFaits = (params = {}) => client.get('/stats/faits/', { params })
