import { useQuery } from '@tanstack/react-query';
import { api_client } from '../api/api_client'; // <--- Corrección aquí: api_client
import { useBranch } from '../contexts/branch.context';

type Appointment = {
  id: string;
  servicio: string;
  cliente: string;
  fechaHora: string;
  estado: string;
};

/**
 * Fetcher para obtener las citas de una sucursal específica.
 * @param branch_id - ID de la sucursal activa.
 */
const fetch_appointments = async (branch_id: string) => {
  // El backend espera 'sucursalId' como query param
  const response = await api_client.get('/appointments', {
    params: { sucursalId: branch_id },
  });
  return response.data.items as Appointment[];
};

/**
 * Hook para consumir las citas de la sucursal activa.
 */
export const useAppointments = () => {
  const { activeBranch } = useBranch(); // El contexto aún retorna camelCase, lo dejamos así por ahora

  return useQuery(
    ['branch', activeBranch?.id ?? 'global', 'appointments'],
    () => fetch_appointments(activeBranch?.id ?? ''),
    {
      enabled: Boolean(activeBranch?.id),
    },
  );
};
