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
  empleado: string; // Nombre para mostrar en tabla/detalle
  fechaHora: string;
  estado: string;
  total: number;
  // NUEVOS CAMPOS FINANCIEROS
  anticipo: number;
  restante: number; // Calculado por backend o frontend

  // Datos Lógicos (para edición)
  cliente_id: string;
  empleado_id: string | null; // ID para formularios (puede ser null)
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
 *
 * ACTUALIZACIÓN SPRINT 3: Ahora soporta la reasignación de empleado (`empleado_id`).
 */
export const useEditAppointment = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();

  return useMutation({
    mutationFn: async ({
      id,
      servicios_ids,
      empleado_id,
    }: {
      id: string;
      servicios_ids: string[];
      empleado_id?: string; // Opcional: si viene, actualiza el empleado
    }) => {
      // Enviamos el payload combinado al endpoint de actualización de items.
      // El backend debe estar preparado para recibir 'empleado_id' en este PATCH.
      const response = await api_client.patch(`/appointments/${id}/items`, {
        servicios_ids,
        empleado_id,
      });
      return response.data;
    },
    onSuccess: () => {
      // Al tener éxito, forzamos la recarga de la lista de citas de esta sucursal
      // para reflejar los cambios de precio o empleado inmediatamente.
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
