/**
 * Representa al usuario autenticado en el sistema.
 * Alineado con la respuesta del endpoint /auth/login del backend.
 */
export type User = {
  email: string;
  nombre: string;
};

/**
 * Estructura de la respuesta exitosa de login que viene del API.
 */
export type LoginResponse = {
  access_token: string;
  user: User;
};

/**
 * Estado global de autenticación para la aplicación frontend.
 */
export type AuthState = {
  token: string | null;
  user: User | null;
  is_authenticated: boolean;
};
