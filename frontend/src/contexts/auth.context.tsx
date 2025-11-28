import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { AuthState, User, LoginResponse } from '../types/auth.types'
import { auth_store } from './auth_store'
import { api_client } from '../api/api_client'

/**
 * Define la forma del contexto que consumirán los componentes.
 */
type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Proveedor de Autenticación.
 * Gestiona el estado global de usuario y las funciones de entrada/salida.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Inicializamos el estado leyendo lo que haya en localStorage (persistencia)
  const [state, set_state] = useState<AuthState>(auth_store.get_initial_state())
  const [is_loading, set_is_loading] = useState(false)

  /**
   * Ejecuta la petición de login y actualiza el estado global.
   */
  const login = async (email: string, password: string) => {
    set_is_loading(true)
    try {
      // Hacemos la petición POST real al backend
      // El X-Branch-Id se inyectará solo si hay una seleccionada, 
      // pero para Login el backend debe permitirlo (ya arreglamos esto en backend?)
      // OJO: Si el backend exige Branch para login, debemos asegurarnos de que se mande.
      // Por ahora asumimos que el usuario selecciona branch DESPUÉS o el interceptor lo maneja.
      
      const { data } = await api_client.post<LoginResponse>('/auth/login', {
        email,
        password,
      })

      // Guardamos en store (localStorage)
      auth_store.set_session(data.access_token, data.user)

      // Actualizamos React
      set_state({
        token: data.access_token,
        user: data.user,
        is_authenticated: true,
      })
    } finally {
      set_is_loading(false)
    }
  }

  const logout = () => {
    auth_store.clear_session()
    set_state({
      token: null,
      user: null,
      is_authenticated: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isLoading: is_loading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook personalizado para acceder a la sesión.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}