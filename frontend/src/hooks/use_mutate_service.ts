import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { Service } from '../types/service.types';

/**
 * DTO para crear/editar servicio.
 * Coincide con el esquema Zod del backend (snake_case para la API).
 */
export type ServicePayload = {
  id?: string; // Opcional, solo para updates
  nombre: string;
  precio_base: number;
  duracion_minutos: number;
  activo?: boolean;
};

/**
 * Hook para gestionar el ciclo de vida (CUD) de los servicios.
 */
export const useMutateService = () => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ServicePayload) => {
      // Si tiene ID, es un PATCH (Update), si no, es un POST (Create)
      if (payload.id) {
        const { id, ...body } = payload;
        const response = await api_client.patch(`/services/${id}`, body);
        return response.data;
      } else {
        const response = await api_client.post('/services', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidamos la lista de servicios para que se refresque en todos lados
      // (tanto en el Manager como en el Select de Citas)
      query_client.invalidateQueries(['services']);
    },
  });
};
