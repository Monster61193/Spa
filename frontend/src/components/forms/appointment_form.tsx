import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../contexts/auth.context'
import { useBranch } from '../../contexts/branch.context'
import { useServices } from '../../hooks/use_services'
import { api_client } from '../../api/api_client'

// Esquema de validación para agendar cita
const AppointmentSchema = z.object({
  servicio_id: z.string().uuid('Debes seleccionar un servicio.'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias.'),
})

type AppointmentFormValues = z.infer<typeof AppointmentSchema>

/**
 * Formulario para agendar una nueva cita.
 * Utiliza datos del contexto (usuario logeado y sucursal activa)
 * y de la API (servicios disponibles).
 */
export const AppointmentForm = () => {
  const { user } = useAuth()
  const { activeBranch } = useBranch()
  const { data: services, isLoading: isLoadingServices } = useServices()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(AppointmentSchema),
    // Inicializamos con un ID de servicio vacío para el selector
    defaultValues: {
        servicio_id: '',
    }
  })

  const handle_submit: SubmitHandler<AppointmentFormValues> = async (data) => {
    if (!user) return alert('Error: Usuario no logeado.')
    if (!activeBranch) return alert('Error: Sucursal no seleccionada.')

    const payload = {
        usuario_id: user.id, // ID del usuario logeado (admin o recepcionista)
        servicio_id: data.servicio_id,
        // Usamos Z para indicar que la hora está en UTC/ISO para el backend
        fecha_hora: new Date(data.fecha_hora).toISOString(),
    }

    try {
        await api_client.post('/appointments', payload)
        alert('¡Cita agendada con éxito!')
        reset() // Limpia el formulario
        // Opcional: invalidar query para refrescar la lista de citas en el dashboard
    } catch (error) {
        console.error('Error al agendar cita:', error)
        alert('Error al agendar cita. Revisa la consola.')
    }
  }

  // Si no hay sucursal activa, no podemos agendar
  if (!activeBranch) {
    return <p>Selecciona una sucursal para agendar citas.</p>
  }
  
  if (isLoadingServices) {
    return <p>Cargando servicios...</p>
  }

  return (
    <div className="appointment-form-container" style={{ maxWidth: '400px', margin: 'auto' }}>
      <h3>Agendar Nueva Cita</h3>
      <form onSubmit={handleSubmit(handle_submit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* 1. Selector de Servicios */}
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
                    {service.nombre} ({service.duracionMinutos} min)
                </option>
            ))}
          </select>
          {errors.servicio_id && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.servicio_id.message}</span>}
        </div>
        
        {/* 2. Selector de Fecha y Hora */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label htmlFor="fecha_hora">Fecha y Hora</label>
          <input
            id="fecha_hora"
            type="datetime-local"
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