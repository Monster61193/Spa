import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/auth.context'
import { useBranch } from '../../contexts/branch.context'
import { useServices } from '../../hooks/use_services'
import { useClients } from '../../hooks/use_clients'
import { api_client } from '../../api/api_client'

// CORRECCIÓN 1: Cambiamos .uuid() por .min(1)
// Esto permite que IDs cortos como 'serv-1' (del seed) sean válidos.
const AppointmentSchema = z.object({
  cliente_id: z.string().min(1, 'Debes seleccionar un cliente.'),
  servicio_id: z.string().min(1, 'Debes seleccionar un servicio.'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias.'),
})

type AppointmentFormValues = z.infer<typeof AppointmentSchema>

/**
 * Formulario para agendar una nueva cita.
 * Incluye selectores dinámicos y validación de fecha futura.
 */
export const AppointmentForm = () => {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  
  // Hooks de datos
  const { data: services, isLoading: isLoadingServices } = useServices()
  const { data: clients, isLoading: isLoadingClients } = useClients()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
        servicio_id: '',
        cliente_id: '',
        fecha_hora: ''
    }
  })

  // CORRECCIÓN 2: Calcular fecha mínima para el input (YYYY-MM-DDTHH:mm)
  // Restamos el offset de zona horaria para que toISOString no nos dé la hora UTC
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const min_datetime = now.toISOString().slice(0, 16)

  const handle_submit: SubmitHandler<AppointmentFormValues> = async (data) => {
    if (!user || !activeBranch) return

    const payload = {
        usuario_id: data.cliente_id,
        servicio_id: data.servicio_id,
        fecha_hora: new Date(data.fecha_hora).toISOString(),
    }

    try {
        await api_client.post('/appointments', payload)
        alert('¡Cita agendada con éxito!')
        reset()
        // Truco rápido: Recargar para ver la cita en la tabla (luego usaremos invalidación de query)
        window.location.reload()
    } catch (error) {
        console.error('Error al agendar cita:', error)
        alert('Ocurrió un error al intentar agendar.')
    }
  }

  if (!activeBranch) return <p>Selecciona una sucursal.</p>
  if (isLoadingServices || isLoadingClients) return <p>Cargando catálogos...</p>

  return (
    <div className="appointment-form-container" style={{ maxWidth: '400px', margin: 'auto' }}>
      
      <form onSubmit={handleSubmit(handle_submit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Agendar Nueva Cita</h3>
        {/* Selector de Clientes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="cliente_id">Cliente</label>
          <select
            id="cliente_id"
            disabled={isSubmitting}
            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
            {...register('cliente_id')}
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clients?.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.email})
                </option>
            ))}
          </select>
          {errors.cliente_id && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.cliente_id.message}</span>}
        </div>

        {/* Selector de Servicios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="servicio_id">Servicio</label>
          <select
            id="servicio_id"
            disabled={isSubmitting}
            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
            {...register('servicio_id')}
          >
            <option value="">-- Seleccionar Servicio --</option>
            {services?.map(service => (
                <option key={service.id} value={service.id}>
                    {service.nombre} ({service.duracionMinutos} min) - ${service.precioBase}
                </option>
            ))}
          </select>
          {errors.servicio_id && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.servicio_id.message}</span>}
        </div>
        
        {/* Fecha y Hora con restricción de pasado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="fecha_hora">Fecha y Hora</label>
          <input
            id="fecha_hora"
            type="datetime-local"
            min={min_datetime} // <--- Aquí aplicamos la restricción
            disabled={isSubmitting}
            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc' }}
            {...register('fecha_hora')}
          />
          {errors.fecha_hora && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.fecha_hora.message}</span>}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            padding: '0.75rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Agendando...' : 'Agendar Cita'}
        </button>
      </form>
    </div>
  )
}