import { useQuery } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { User } from '../types/auth.types';

/**
 * Hook para obtener el listado de clientes desde el backend.
 */
export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api_client.get<{ items: User[] }>('/users/clients');
      return response.data.items;
    },
  });
};
