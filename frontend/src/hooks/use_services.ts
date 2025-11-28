import { useQuery } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { Service } from '../types/service.types';

/**
 * Hook para obtener el listado de servicios disponibles en la sucursal activa.
 */
export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      // El backend debe manejar la lógica de filtrar por X-Branch-Id
      const response = await api_client.get<{ items: Service[] }>('/services');
      return response.data.items;
    },
    // Este hook se debe invalidar cuando la sucursal activa cambie,
    // pero por ahora lo dejamos simple.
  });
};
