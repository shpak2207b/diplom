import axios from 'axios'

export const api = axios.create({
  baseURL: '',
})

// Attach admin JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
