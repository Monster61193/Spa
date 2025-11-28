import axios from 'axios';
import { branchStore } from '../contexts/branch_store';
import { auth_store } from '../contexts/auth_store';

/**
 * Cliente HTTP centralizado para toda la aplicación.
 * Configurado con la URL base y tiempos de espera estándar.
 */
export const api_client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 12000,
});

/**
 * Interceptor de Request:
 * Inyecta automáticamente las cabeceras de contexto (Sucursal y Auth).
 */
api_client.interceptors.request.use((config) => {
  // 1. Inyectar Sucursal Activa (Multi-tenancy)
  // Nota: branchStore usa camelCase en su definición actual, lo mantenemos por compatibilidad
  const branch_id = branchStore.getActiveBranchId();

  config.headers = config.headers ?? {};

  //if (branch_id) {
  //  config.headers['X-Branch-Id'] = branch_id;
  //}
  // Si no hay sucursal seleccionada (ej. en Login), enviamos la principal por defecto
  // para satisfacer al BranchGuard del backend.
  config.headers['X-Branch-Id'] = branch_id ?? 'branch-principal';

  // 2. Inyectar Token de Autenticación (Seguridad)
  const token = auth_store.get_token();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

/**
 * Interceptor de Response (Opcional pero recomendado):
 * Para manejar expiración de sesión globalmente (401).
 */
api_client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el backend nos rechaza (token vencido), cerramos sesión localmente
      auth_store.clear_session();
      // Opcional: forzar recarga o redirección a login
      // window.location.href = '/login'
    }
    return Promise.reject(error);
  },
);
