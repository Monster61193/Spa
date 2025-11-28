import { AuthState, User } from '../types/auth.types';

/**
 * Clave para persistir el token en el navegador.
 */
const TOKEN_KEY = 'danae_auth_token';
const USER_KEY = 'danae_auth_user';

/**
 * Store estático para acceso directo desde interceptores (fuera del ciclo de vida de React).
 * Maneja la persistencia básica en localStorage.
 */
export const auth_store = {
  /**
   * Obtiene el token actual (de memoria o storage).
   */
  get_token: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Guarda la sesión del usuario.
   */
  set_session: (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Limpia la sesión (Logout).
   */
  clear_session: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Recupera el estado inicial al recargar la página.
   */
  get_initial_state: (): AuthState => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user_raw = localStorage.getItem(USER_KEY);
    const user = user_raw ? (JSON.parse(user_raw) as User) : null;

    return {
      token,
      user,
      is_authenticated: Boolean(token),
    };
  },
};
