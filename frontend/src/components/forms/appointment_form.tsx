import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/auth.context';
import { useBranch } from '../../contexts/branch.context';
import { useServices } from '../../hooks/use_services';
import { useClients } from '../../hooks/use_clients';
import { useEmployees } from '../../hooks/use_employees';
import { api_client } from '../../api/api_client';

import './appointment_form.css';

/**
 * Esquema de validación para la creación de citas.
 * Actualizado para Sprint 3: Incluye `empleado_id` opcional.
 */
const AppointmentSchema = z.object({
  cliente_id: z.string().min(1, 'Debes seleccionar un cliente.'),
  // El empleado es opcional al crear, pero vital para calcular comisiones al cerrar.
  empleado_id: z.string().optional(),
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
 * Formulario transaccional para agendar citas.
 *
 * Funcionalidades Clave:
 * 1. Selección de Cliente.
 * 2. Asignación de Empleado (Sprint 3 - Comisiones).
 * 3. Carrito de Servicios (Cálculo de totales en tiempo real).
 *
 * @param {Props} props - Props del componente.
 */
export const AppointmentForm = ({ onSuccess }: Props) => {
  const { user } = useAuth();
  const { activeBranch } = useBranch();

  // --- HOOKS DE DATOS ---
  const { data: services = [], isLoading: is_loading_services } = useServices();
  const { data: clients = [], isLoading: is_loading_clients } = useClients();
  // Consumimos empleados filtrados por la sucursal activa
  const { data: employees = [], isLoading: is_loading_employees } = useEmployees();

  // --- ESTADO LOCAL ---
  const [selected_service_id, set_selected_service_id] = useState<string>('');
  const [api_error, set_api_error] = useState<string | null>(null);

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
      empleado_id: '', // Valor inicial vacío
      servicios_ids: [],
      fecha_hora: '',
    },
  });

  // --- CÁLCULOS EN TIEMPO REAL ---
  const added_service_ids = watch('servicios_ids');

  const total_estimado = added_service_ids.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.precioBase || 0);
  }, 0);

  const duracion_total = added_service_ids.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.duracionMinutos || 0);
  }, 0);

  // Fecha mínima (hoy) para el input datetime-local
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const min_datetime = now.toISOString().slice(0, 16);

  // --- HANDLERS ---

  const handle_add_service = () => {
    if (!selected_service_id) return;
    if (added_service_ids.includes(selected_service_id)) return;

    const new_ids = [...added_service_ids, selected_service_id];
    setValue('servicios_ids', new_ids, { shouldValidate: true });
    set_selected_service_id('');
  };

  const handle_remove_service = (id_to_remove: string) => {
    const new_ids = added_service_ids.filter((id) => id !== id_to_remove);
    setValue('servicios_ids', new_ids, { shouldValidate: true });
  };

  /**
   * Envío del formulario.
   * Construye el payload incluyendo el empleado asignado.
   */
  const on_submit: SubmitHandler<AppointmentFormValues> = async (data) => {
    if (!user || !activeBranch) return;
    set_api_error(null);

    const payload = {
      usuario_id: data.cliente_id,
      // Enviamos undefined si es string vacío para que el backend lo ignore limpiamente
      empleado_id: data.empleado_id || undefined,
      servicios_ids: data.servicios_ids,
      fecha_hora: new Date(data.fecha_hora).toISOString(),
    };

    try {
      await api_client.post('/appointments', payload);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error al agendar cita:', error);
      const msg = error.response?.data?.message || 'Ocurrió un error al guardar.';
      set_api_error(msg);
    }
  };

  // Validaciones de carga inicial
  if (!activeBranch) return <p>Selecciona una sucursal.</p>;
  if (is_loading_services || is_loading_clients || is_loading_employees) return <p>Cargando catálogos...</p>;

  return (
    <div className="appointment-form-container">
      <h3 className="form-title">Nueva Cita</h3>

      {/* Feedback de errores de API */}
      {api_error && (
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
          {api_error}
        </div>
      )}

      <form onSubmit={handleSubmit(on_submit)} className="appointment-form">
        {/*
          SECCIÓN 1: CLIENTE Y EMPLEADO
          Usamos Grid para ponerlos lado a lado.
        */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Selector de Cliente */}
          <div className="form-group">
            <label htmlFor="cliente_id" className="form-label">
              Cliente
            </label>
            <select id="cliente_id" disabled={isSubmitting} className="form-select" {...register('cliente_id')}>
              <option value="">-- Seleccionar --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.email})
                </option>
              ))}
            </select>
            {errors.cliente_id && <span className="error-message">{errors.cliente_id.message}</span>}
          </div>

          {/* Selector de Empleado (Nuevo Sprint 3) */}
          <div className="form-group">
            <label htmlFor="empleado_id" className="form-label">
              Atiende (Opcional)
            </label>
            <select id="empleado_id" disabled={isSubmitting} className="form-select" {...register('empleado_id')}>
              <option value="">-- Cualquiera --</option>
              {employees.map((e) => (
                <option key={e.empleado_id} value={e.empleado_id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SECCIÓN 2: CARRITO DE SERVICIOS */}
        <div className="service-cart">
          <label htmlFor="service_selector" className="form-label">
            Agregar Servicios
          </label>
          <div className="cart-controls">
            <select
              id="service_selector"
              value={selected_service_id}
              onChange={(e) => set_selected_service_id(e.target.value)}
              disabled={isSubmitting}
              className="form-select"
            >
              <option value="">-- Elegir servicio --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id} disabled={added_service_ids.includes(s.id)}>
                  {s.nombre} (${s.precioBase})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handle_add_service}
              disabled={!selected_service_id || isSubmitting}
              className="btn-add"
            >
              +
            </button>
          </div>

          {/* Lista de items agregados */}
          {added_service_ids.length > 0 && (
            <ul className="cart-list">
              {added_service_ids.map((id) => {
                const s = services.find((srv) => srv.id === id);
                return (
                  <li key={id} className="cart-item">
                    <span>{s?.nombre}</span>
                    <div className="cart-item-details">
                      <span className="cart-item-price">${s?.precioBase}</span>
                      <button type="button" onClick={() => handle_remove_service(id)} className="btn-remove">
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
              Duración: <strong>{duracion_total} min</strong>
            </div>
            <div className="cart-total-price">
              Total: <strong>${total_estimado}</strong>
            </div>
          </div>
          {errors.servicios_ids && <span className="error-message">{errors.servicios_ids.message}</span>}
        </div>

        {/* SECCIÓN 3: FECHA Y HORA */}
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

        {/* BOTÓN DE ACCIÓN */}
        <button type="submit" disabled={isSubmitting} className="btn-submit">
          {isSubmitting ? 'Guardando...' : `Confirmar Cita ($${total_estimado})`}
        </button>
      </form>
    </div>
  );
};
