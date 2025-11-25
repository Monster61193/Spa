import axios from 'axios'
import { branchStore } from '../contexts/branch_store'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 12000
})

apiClient.interceptors.request.use((config) => {
  const branchId = branchStore.getActiveBranchId()
  if (branchId) {
    config.headers = config.headers ?? {}
    config.headers['X-Branch-Id'] = branchId
  }
  return config
})
