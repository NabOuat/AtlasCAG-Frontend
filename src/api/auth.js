import client from './client'

export const login = (username, password) =>
  client.post('/token/', { username, password })

export const refreshToken = (refresh) =>
  client.post('/token/refresh/', { refresh })

export const getMe = () =>
  client.get('/accounts/me/')
