/**
 * Definición de un servicio del catálogo del Spa.
 * Coincide con la estructura de la tabla 'servicios' del backend.
 */
export type Service = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number;
  duracionMinutos: number;
  activo: boolean;
};
