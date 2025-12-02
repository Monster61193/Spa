import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/auth.context';
import { useBranch } from '../../contexts/branch.context';
import { useServices } from '../../hooks/use_services';
import { useClients } from '../../hooks/use_clients';
import { api_client } from '../../api/api_client';

// Importamos los estilos aislados
import './appointment_form.css';

/**
 * Esquema de validación para Múltiples Servicios.
 */
const AppointmentSchema = z.object({
  cliente_id: z.string().min(1, 'Debes seleccionar un cliente.'),
  servicios_ids: z.array(z.string()).min(1, 'Debes agregar al menos un servicio a la cita.'),
  fecha_hora: z.string().min(1, 'La fecha y hora son obligatorias.'),
});

type AppointmentFormValues = z.infer<typeof AppointmentSchema>;

/**
 * Formulario transaccional para agendar citas con múltiples servicios (Carrito).
 * Refactorizado para usar clases CSS en lugar de estilos inline.
 */
export const AppointmentForm = () => {
  const { user } = useAuth();
  const { activeBranch } = useBranch();

  // Hooks de datos
  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();

  // Estado local para el selector temporal
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

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

  // Fecha mínima
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const min_datetime = now.toISOString().slice(0, 16);

  // Handlers de UI
  const handleAddService = () => {
    if (!selectedServiceId) return;
    if (addedServiceIds.includes(selectedServiceId)) {
      alert('Este servicio ya ha sido agregado.');
      return;
    }
    const newIds = [...addedServiceIds, selectedServiceId];
    setValue('servicios_ids', newIds, { shouldValidate: true });
    setSelectedServiceId('');
  };

  const handleRemoveService = (idToRemove: string) => {
    const newIds = addedServiceIds.filter((id) => id !== idToRemove);
    setValue('servicios_ids', newIds, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
    if (!user || !activeBranch) return;

    const payload = {
      usuario_id: data.cliente_id,
      servicios_ids: data.servicios_ids,
      fecha_hora: new Date(data.fecha_hora).toISOString(),
    };

    try {
      await api_client.post('/appointments', payload);
      alert('¡Cita agendada con éxito!');
      window.location.reload();
    } catch (error) {
      console.error('Error al agendar cita:', error);
      alert('Ocurrió un error al intentar agendar. Verifica el stock.');
    }
  };

  if (!activeBranch) return <p>Selecciona una sucursal.</p>;
  if (isLoadingServices || isLoadingClients) return <p>Cargando catálogos...</p>;

  return (
    <div className="appointment-form-container">
      <h3 className="form-title">Nueva Cita (Carrito)</h3>

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

        {/* 2. Selección de Servicios (Carrito) */}
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
                  {s.nombre} (${s.precioBase}) - {s.duracionMinutos} min
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddService}
              disabled={!selectedServiceId || isSubmitting}
              className="btn-add"
              title="Agregar servicio a la lista"
            >
              +
            </button>
          </div>

          {/* Lista de Servicios Agregados */}
          {addedServiceIds.length > 0 && (
            <ul className="cart-list">
              {addedServiceIds.map((id) => {
                const s = services.find((srv) => srv.id === id);
                return (
                  <li key={id} className="cart-item">
                    <span>{s?.nombre}</span>
                    <div className="cart-item-details">
                      <span className="cart-item-price">${s?.precioBase}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(id)}
                        className="btn-remove"
                        aria-label="Quitar servicio"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Resumen de Totales */}
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

        {/* 3. Fecha y Hora */}
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
