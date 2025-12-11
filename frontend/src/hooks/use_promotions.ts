import { useQuery } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { useBranch } from '../contexts/branch.context';

export type Promotion = {
  id: string;
  nombre: string;
  descuento: number; // Porcentaje (ej. 10 para 10%)
  tipo_alcance: 'Local' | 'Global';
};

/**
 * Hook para obtener las promociones vigentes de la sucursal activa.
 */
export const usePromotions = () => {
  const { activeBranch } = useBranch();
  const branch_id = activeBranch?.id;

  return useQuery({
    queryKey: ['promotions', branch_id],
    queryFn: async () => {
      if (!branch_id) return [];
      const response = await api_client.get<{ items: Promotion[] }>('/promotions/active', {
        params: { sucursalId: branch_id },
      });
      return response.data.items;
    },
    enabled: Boolean(branch_id),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
