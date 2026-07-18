import client from './client'

export const getUsers    = (params = {}) => client.get('/accounts/users/',          { params })
export const getUser     = (id)          => client.get(`/accounts/users/${id}/`)
export const createUser  = (data)        => client.post('/accounts/users/',          data)
export const updateUser  = (id, data)    => client.patch(`/accounts/users/${id}/`,   data)
export const toggleUser  = (id, active)  => client.patch(`/accounts/users/${id}/`,   { is_active: active })
