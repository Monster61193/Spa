import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { useServices } from '../../hooks/use_services';
import { useEmployees } from '../../hooks/use_employees';
import { useEditAppointment, useCancelAppointment, Appointment } from '../../hooks/use_appointments';
import './appointment_details.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
};

type LocalFeedback = {
  is_open: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning';
};

/**
 * Modal híbrido: Visualización y Edición de Citas.
 * Soporta edición en línea (Inline Editing) para el empleado y el estado.
 */
export const AppointmentDetailsModal = ({ isOpen, onClose, appointment }: Props) => {
  // --- HOOKS ---
  const { data: catalog_services = [] } = useServices();
  const { data: employees = [] } = useEmployees();
  const { mutate: edit_appointment, isLoading: is_saving } = useEditAppointment();
  const { mutate: cancel_appointment, isLoading: is_canceling } = useCancelAppointment();

  // --- ESTADOS ---
  const [is_editing, set_is_editing] = useState(false);

  // Servicios
  const [selected_service_ids, set_selected_service_ids] = useState<string[]>([]);
  const [temp_selector, set_temp_selector] = useState<string>('');

  // Empleado (Estado para el select)
  const [selected_employee_id, set_selected_employee_id] = useState<string | null>(null);

  // Cancelación y Feedback
  const [is_cancel_modal_open, set_is_cancel_modal_open] = useState(false);
  const [cancellation_reason, set_cancellation_reason] = useState('');
  const [cancellation_error, set_cancellation_error] = useState<string | null>(null);
  const [feedback, set_feedback] = useState<LocalFeedback>({
    is_open: false,
    title: '',
    message: '',
    type: 'success',
  });

  // --- EFECTOS ---
  useEffect(() => {
    if (isOpen) {
      set_is_editing(false);
      set_selected_service_ids([]);
      set_selected_employee_id(null);
      set_temp_selector('');
      set_is_cancel_modal_open(false);
      set_cancellation_reason('');
      set_cancellation_error(null);
      set_feedback((prev) => ({ ...prev, is_open: false }));
    }
  }, [isOpen, appointment]);

  // --- MEMOS ---
  const fecha_formateada = useMemo(() => {
    if (!appointment) return '';
    return new Date(appointment.fechaHora).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [appointment]);

  const hora_formateada = useMemo(() => {
    if (!appointment) return '';
    return new Date(appointment.fechaHora).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [appointment]);

  const edit_mode_items = useMemo(() => {
    return selected_service_ids.map((id) => catalog_services.find((s) => s.id === id)).filter(Boolean);
  }, [selected_service_ids, catalog_services]);

  const edit_total = useMemo(() => {
    return edit_mode_items.reduce((sum, item) => sum + (item?.precioBase || 0), 0);
  }, [edit_mode_items]);

  // --- HANDLERS ---
  const show_feedback = (title: string, message: string, type: 'success' | 'error' | 'warning') => {
    set_feedback({ is_open: true, title, message, type });
  };

  const close_feedback = () => {
    set_feedback((prev) => ({ ...prev, is_open: false }));
    if (feedback.type === 'success') onClose();
  };

  const toggle_edit_mode = () => {
    if (appointment) {
      // Precargar servicios
      if (appointment.servicios_items && appointment.servicios_items.length > 0) {
        set_selected_service_ids(appointment.servicios_items.map((item) => item.id));
      } else {
        set_selected_service_ids([]);
      }
      // Precargar empleado
      set_selected_employee_id(appointment.empleado_id || '');
    }
    set_is_editing(true);
  };

  const handle_add_service = () => {
    if (!temp_selector || selected_service_ids.includes(temp_selector)) return;
    set_selected_service_ids((prev) => [...prev, temp_selector]);
    set_temp_selector('');
  };

  const handle_remove_service = (id_to_remove: string) => {
    set_selected_service_ids((prev) => prev.filter((id) => id !== id_to_remove));
  };

  const handle_submit_changes = () => {
    if (!appointment) return;
    if (selected_service_ids.length === 0) {
      show_feedback('Datos incompletos', 'La cita debe tener al menos un servicio.', 'warning');
      return;
    }

    edit_appointment(
      {
        id: appointment.id,
        servicios_ids: selected_service_ids,
        empleado_id: selected_employee_id || undefined,
      },
      {
        onSuccess: () => {
          show_feedback('¡Actualización Exitosa!', 'La cita ha sido modificada correctamente.', 'success');
        },
        onError: (error: any) => {
          const msg = error.response?.data?.message || 'Error al actualizar.';
          show_feedback('Error', msg, 'error');
        },
      },
    );
  };

  const open_cancel_modal = () => {
    set_cancellation_reason('');
    set_cancellation_error(null);
    set_is_cancel_modal_open(true);
  };

  const handle_confirm_cancel = () => {
    if (!appointment) return;
    if (cancellation_reason.trim().length < 5) {
      set_cancellation_error('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    cancel_appointment(
      { id: appointment.id, motivo: cancellation_reason },
      {
        onSuccess: () => {
          set_is_cancel_modal_open(false);
          show_feedback('Cita Cancelada', 'La cita ha sido cancelada correctamente.', 'success');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'No se pudo cancelar.';
          set_is_cancel_modal_open(false);
          show_feedback('Error al Cancelar', msg, 'error');
        },
      },
    );
  };

  if (!appointment) return null;
  const is_busy = is_saving || is_canceling;

  return (
    <>
      <Modal is_open={isOpen} on_close={onClose} title="">
        <div className="details-header">
          <h2 className="details-title">{is_editing ? 'Modificar Cita' : 'Detalle de Cita'}</h2>
          <p className="details-subtitle">Folio: {appointment.id}</p>
        </div>

        {/* --- GRID DE INFORMACIÓN (Inline Editing Integrado) --- */}
        <div className="details-grid">
          <div className="info-group">
            <span className="info-label">Cliente</span>
            <span className="info-value">{appointment.cliente}</span>
          </div>

          {/* CAMPO ATENDIDO POR: Switch texto/select */}
          <div className="info-group">
            <label htmlFor="edit-employee" className="info-label">
              Atendido por
            </label>
            {is_editing ? (
              // MODO EDICIÓN: Selector
              <select
                id="edit-employee"
                className="inline-edit-select" // <--- CLASE NUEVA AQUÍ
                value={selected_employee_id || ''}
                onChange={(e) => set_selected_employee_id(e.target.value)}
                disabled={is_busy}
              >
                <option value="">-- Sin Asignar --</option>
                {employees.map((emp) => (
                  <option key={emp.empleado_id} value={emp.empleado_id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            ) : (
              // MODO LECTURA: Texto
              <span
                className="info-value"
                style={{ color: appointment.empleado === 'No asignado' ? 'var(--text-secondary)' : 'inherit' }}
              >
                {appointment.empleado}
              </span>
            )}
          </div>

          <div className="info-group">
            <span className="info-label">Estado</span>
            <span className={`badge-status status-${appointment.estado}`} style={{ width: 'fit-content' }}>
              {appointment.estado}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">Fecha</span>
            <span className="info-value">{fecha_formateada}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Hora</span>
            <span className="info-value">{hora_formateada}</span>
          </div>
        </div>

        {/* --- SECCIÓN SERVICIOS --- */}
        {!is_editing ? (
          <div className="services-section">
            <h4
              style={{
                margin: '0 0 0.8rem 0',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
              }}
            >
              Desglose de Servicios
            </h4>
            <ul className="services-list">
              {appointment.servicios_items && appointment.servicios_items.length > 0 ? (
                appointment.servicios_items.map((item) => (
                  <li key={item.id} className="service-item">
                    <span>{item.nombre}</span>
                    <span style={{ fontWeight: 500 }}>${item.precio}</span>
                  </li>
                ))
              ) : (
                <li className="service-item">{appointment.servicio}</li>
              )}
            </ul>
            <div style={{ textAlign: 'right', marginTop: '1.2rem', fontSize: '1.2rem' }}>
              Total: <strong>${appointment.total}</strong>
            </div>
          </div>
        ) : (
          <div className="edit-mode-container">
            {/* El selector de empleados se movió arriba a la Grid. Aquí solo quedan los servicios. */}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            <h4 style={{ margin: '0 0 0.5rem 0' }}>Servicios</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Agrega o elimina servicios. Total recalculado automáticamente.
            </p>

            <div className="service-selector-group">
              <select
                className="service-select"
                value={temp_selector}
                onChange={(e) => set_temp_selector(e.target.value)}
                disabled={is_busy}
              >
                <option value="">-- Seleccionar Servicio --</option>
                {catalog_services.map((s) => (
                  <option key={s.id} value={s.id} disabled={selected_service_ids.includes(s.id)}>
                    {s.nombre} (${s.precioBase})
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={handle_add_service} disabled={!temp_selector || is_busy}>
                +
              </button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {edit_mode_items.map(
                (item) =>
                  item && (
                    <div key={item.id} className="edit-list-item">
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          ${item.precioBase} - {item.duracionMinutos} min
                        </div>
                      </div>
                      <button
                        className="btn-remove-item"
                        onClick={() => handle_remove_service(item.id)}
                        title="Eliminar servicio"
                      >
                        ✕
                      </button>
                    </div>
                  ),
              )}
            </div>

            <div
              style={{
                textAlign: 'right',
                marginTop: '1rem',
                borderTop: '1px dashed var(--border-color)',
                paddingTop: '0.5rem',
              }}
            >
              Nuevo Total: <strong>${edit_total}</strong>
            </div>
          </div>
        )}

        {/* --- FOOTER BOTONES --- */}
        <div className="details-actions" style={{ justifyContent: 'space-between' }}>
          {!is_editing && appointment.estado === 'pendiente' ? (
            <button className="btn-danger" onClick={open_cancel_modal} disabled={is_busy}>
              Cancelar Cita
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            {!is_editing ? (
              <>
                <button className="btn-secondary-action" onClick={onClose} disabled={is_busy}>
                  Cerrar
                </button>
                {appointment.estado === 'pendiente' && (
                  <button className="btn-primary" onClick={toggle_edit_mode} disabled={is_busy}>
                    Editar Cita
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="btn-secondary-action" onClick={() => set_is_editing(false)} disabled={is_busy}>
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  onClick={handle_submit_changes}
                  disabled={is_busy || selected_service_ids.length === 0}
                >
                  {is_saving ? 'Guardando...' : 'Confirmar Cambios'}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Modales Anidados (Feedback y Cancelación) */}
      <Modal is_open={is_cancel_modal_open} on_close={() => set_is_cancel_modal_open(false)} title="Cancelar Cita">
        <div className="cancel-form-container">
          <p className="cancel-warning-text">Esta acción es irreversible.</p>
          <textarea
            className="cancel-textarea"
            placeholder="Motivo de cancelación..."
            value={cancellation_reason}
            onChange={(e) => {
              set_cancellation_reason(e.target.value);
              if (e.target.value.trim().length >= 5) set_cancellation_error(null);
            }}
            disabled={is_canceling}
            autoFocus
          />
          {cancellation_error && <p className="text-error">{cancellation_error}</p>}
          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button
              className="btn-secondary-action"
              onClick={() => set_is_cancel_modal_open(false)}
              disabled={is_canceling}
            >
              Atrás
            </button>
            <button
              className="btn-danger"
              onClick={handle_confirm_cancel}
              disabled={is_canceling || cancellation_reason.trim().length < 5}
            >
              {is_canceling ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal is_open={feedback.is_open} on_close={close_feedback} title={feedback.title}>
        <div className="local-feedback-content">
          <div className="local-feedback-icon">
            {feedback.type === 'success' ? '✅' : feedback.type === 'warning' ? '⚠️' : '❌'}
          </div>
          <p className="local-feedback-msg">{feedback.message}</p>
          <div className="modal-actions">
            <button className="btn-primary" onClick={close_feedback}>
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
