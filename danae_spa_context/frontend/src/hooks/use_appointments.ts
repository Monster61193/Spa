import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/api_client'
import { useBranch } from '../contexts/branch.context'

type Appointment = {
  id: string
  servicio: string
  cliente: string
  fechaHora: string
  estado: string
}

const fetchAppointments = async (branchId: string) => {
  // The backend for this endpoint is mock-based and doesn't actually use the query param yet.
  // However, we send it so it's correct for a future real implementation.
  const response = await apiClient.get('/appointments', { params: { sucursalId: branchId } })
  return response.data.items as Appointment[]
}

export const useAppointments = () => {
  const { activeBranch } = useBranch()
  return useQuery(
    ['branch', activeBranch?.id ?? 'global', 'appointments'],
    () => fetchAppointments(activeBranch?.id ?? ''),
    {
      enabled: Boolean(activeBranch?.id)
    }
  )
}
