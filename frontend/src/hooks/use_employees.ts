import { useQuery } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { useBranch } from '../contexts/branch.context';

/**
 * Tipo que representa a un empleado en el frontend.
 * Mapeado desde la respuesta del UsersService.
 */
export type Employee = {
  usuario_id: string; // ID de login (tabla usuarios)
  empleado_id: string; // ID de nómina (tabla empleados) -> Este se manda a la cita
  nombre: string;
  email: string;
};

/**
 * Hook para obtener los empleados de la sucursal activa.
 * Se invalida automáticamente al cambiar de sucursal.
 */
export const useEmployees = () => {
  const { activeBranch } = useBranch();
  const branch_id = activeBranch?.id;

  return useQuery({
    // Query Key incluye branch_id para caché independiente por sucursal
    queryKey: ['employees', branch_id],
    queryFn: async () => {
      if (!branch_id) return [];

      const response = await api_client.get<{ items: Employee[] }>('/users/employees');
      return response.data.items;
    },
    // Solo ejecutamos si hay una sucursal seleccionada
    enabled: Boolean(branch_id),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché, los empleados no cambian seguido
  });
};
