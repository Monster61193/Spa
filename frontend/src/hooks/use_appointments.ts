import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { useBranch } from '../contexts/branch.context';

/**
 * Estructura completa de una Cita en el Frontend.
 * Incluye datos visuales y metadatos para edición.
 */
export type Appointment = {
  id: string;
  // Datos Visuales
  servicio: string;
  cliente: string;
  fechaHora: string;
  estado: string;
  total: number;
  // Datos Lógicos (para edición)
  cliente_id: string;
  servicios_items: {
    id: string;
    nombre: string;
    precio: number;
  }[];
};

const fetch_appointments = async (branch_id: string) => {
  const response = await api_client.get('/appointments', {
    params: { sucursalId: branch_id },
  });
  return response.data.items as Appointment[];
};

/**
 * Hook para consumo de Citas (Lectura).
 */
export const useAppointments = () => {
  const { activeBranch } = useBranch();

  return useQuery(
    ['branch', activeBranch?.id ?? 'global', 'appointments'],
    () => fetch_appointments(activeBranch?.id ?? ''),
    {
      enabled: Boolean(activeBranch?.id),
      staleTime: 1000 * 60 * 2, // 2 minutos de frescura
    },
  );
};

/**
 * Hook para Mutaciones de Cita (Edición).
 * Encapsula la lógica de PATCH y la invalidación de caché.
 */
export const useEditAppointment = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  return useMutation({
    mutationFn: async ({ id, servicios_ids }: { id: string; servicios_ids: string[] }) => {
      // El backend ya tiene el BranchGuard, pero el interceptor inyecta el header.
      // El endpoint es PATCH /appointments/:id/items
      const response = await api_client.patch(`/appointments/${id}/items`, {
        servicios_ids,
      });
      return response.data;
    },
    onSuccess: () => {
      // Al tener éxito, forzamos la recarga de la lista de citas de esta sucursal
      queryClient.invalidateQueries(['branch', activeBranch?.id, 'appointments']);
    },
  });
};

/**
 * Hook para Cancelar Cita.
 */
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const response = await api_client.post(`/appointments/${id}/cancel`, {
        motivo,
      });
      return response.data;
    },
    onSuccess: () => {
      // Recargamos la lista para que la cita desaparezca o cambie de estado
      queryClient.invalidateQueries(['branch', activeBranch?.id, 'appointments']);
    },
  });
};
