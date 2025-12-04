import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/auth.context';
import { useBranch } from '../../contexts/branch.context';
import { useServices } from '../../hooks/use_services';
import { useClients } from '../../hooks/use_clients';
import { api_client } from '../../api/api_client';

import './appointment_form.css';

// --- ESQUEMA DE VALIDACIÓN ---
const AppointmentSchema = z.object({
  cliente_id: z.string().min(1, 'Debes seleccionar un cliente.'),
  servicios_ids: z.array(z.string()).min(1, 'Debes agregar al menos un servicio a la cita.'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias.'),
});

type AppointmentFormValues = z.infer<typeof AppointmentSchema>;

// --- DEFINICIÓN DE PROPS ---
type Props = {
  /**
   * Callback que se ejecuta cuando la cita se crea exitosamente en el backend.
   * Permite al componente padre manejar el cierre del modal y el feedback.
   */
  onSuccess?: () => void;
};

/**
 * Formulario transaccional para agendar citas (Carrito de Servicios).
 *
 * @param {Props} props - Props del componente.
 */
export const AppointmentForm = ({ onSuccess }: Props) => {
  const { user } = useAuth();
  const { activeBranch } = useBranch();

  // Hooks de datos
  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();

  // Estado local
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  // Estado para errores de API que no son de validación de campos
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(AppointmentSchema),
    defaultValues: {
      cliente_id: '',
      servicios_ids: [],
      fecha_hora: '',
    },
  });

  // Cálculos en tiempo real
  const addedServiceIds = watch('servicios_ids');

  const totalEstimado = addedServiceIds.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.precioBase || 0);
  }, 0);

  const duracionTotal = addedServiceIds.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.duracionMinutos || 0);
  }, 0);

  // Fecha mínima (hoy)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const min_datetime = now.toISOString().slice(0, 16);

  // --- HANDLERS ---

  const handleAddService = () => {
    if (!selectedServiceId) return;
    if (addedServiceIds.includes(selectedServiceId)) return;

    const newIds = [...addedServiceIds, selectedServiceId];
    setValue('servicios_ids', newIds, { shouldValidate: true });
    setSelectedServiceId('');
  };

  const handleRemoveService = (idToRemove: string) => {
    const newIds = addedServiceIds.filter((id) => id !== idToRemove);
    setValue('servicios_ids', newIds, { shouldValidate: true });
  };

  /**
   * Envío del formulario.
   * En lugar de alert(), delega el éxito al padre mediante onSuccess().
   */
  const onSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
    if (!user || !activeBranch) return;
    setApiError(null);

    const payload = {
      usuario_id: data.cliente_id,
      servicios_ids: data.servicios_ids,
      fecha_hora: new Date(data.fecha_hora).toISOString(),
    };

    try {
      await api_client.post('/appointments', payload);

      // Notificamos al padre que todo salió bien
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error al agendar cita:', error);
      // Mostramos el error dentro del formulario (UX no intrusiva)
      const msg = error.response?.data?.message || 'Ocurrió un error al guardar.';
      setApiError(msg);
    }
  };

  if (!activeBranch) return <p>Selecciona una sucursal.</p>;
  if (isLoadingServices || isLoadingClients) return <p>Cargando catálogos...</p>;

  return (
    <div className="appointment-form-container">
      <h3 className="form-title">Nueva Cita (Carrito)</h3>

      {/* Mensaje de error de API */}
      {apiError && (
        <div
          style={{
            padding: '0.8rem',
            marginBottom: '1rem',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            fontSize: '0.9rem',
          }}
        >
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="appointment-form">
        {/* 1. Selección de Cliente */}
        <div className="form-group">
          <label htmlFor="cliente_id" className="form-label">
            Cliente
          </label>
          <select id="cliente_id" disabled={isSubmitting} className="form-select" {...register('cliente_id')}>
            <option value="">-- Seleccionar Cliente --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.email})
              </option>
            ))}
          </select>
          {errors.cliente_id && <span className="error-message">{errors.cliente_id.message}</span>}
        </div>

        {/* 2. Carrito de Servicios */}
        <div className="service-cart">
          <label htmlFor="service_selector" className="form-label">
            Agregar Servicios
          </label>
          <div className="cart-controls">
            <select
              id="service_selector"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={isSubmitting}
              className="form-select"
            >
              <option value="">-- Elegir servicio --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id} disabled={addedServiceIds.includes(s.id)}>
                  {s.nombre} (${s.precioBase})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddService}
              disabled={!selectedServiceId || isSubmitting}
              className="btn-add"
            >
              +
            </button>
          </div>

          {addedServiceIds.length > 0 && (
            <ul className="cart-list">
              {addedServiceIds.map((id) => {
                const s = services.find((srv) => srv.id === id);
                return (
                  <li key={id} className="cart-item">
                    <span>{s?.nombre}</span>
                    <div className="cart-item-details">
                      <span className="cart-item-price">${s?.precioBase}</span>
                      <button type="button" onClick={() => handleRemoveService(id)} className="btn-remove">
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="cart-summary">
            <div>
              Duración: <strong>{duracionTotal} min</strong>
            </div>
            <div className="cart-total-price">
              Total: <strong>${totalEstimado}</strong>
            </div>
          </div>
          {errors.servicios_ids && <span className="error-message">{errors.servicios_ids.message}</span>}
        </div>

        {/* 3. Fecha */}
        <div className="form-group">
          <label htmlFor="fecha_hora" className="form-label">
            Fecha y Hora
          </label>
          <input
            id="fecha_hora"
            type="datetime-local"
            min={min_datetime}
            className="form-input"
            {...register('fecha_hora')}
          />
          {errors.fecha_hora && <span className="error-message">{errors.fecha_hora.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-submit">
          {isSubmitting ? 'Guardando...' : `Confirmar Cita ($${totalEstimado})`}
        </button>
      </form>
    </div>
  );
};
