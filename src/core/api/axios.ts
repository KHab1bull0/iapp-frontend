import axios from 'axios'

// .env.production ends with a slash, which produced a double-slashed
// "https://host//api". Trim it here so the URL is correct either way.
const baseURL = import.meta.env.PROD
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/+$/, '')}/api`
  : '/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
