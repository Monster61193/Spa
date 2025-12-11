import { useState } from 'react';
import { isAxiosError } from 'axios';

// --- COMPONENTES DE NEGOCIO ---
import { InventoryTable } from './components/inventory/inventory_table';
import { AppointmentForm } from './components/forms/appointment_form';
import { AppointmentDetailsModal } from './components/forms/appointment_details_modal';
import { ServicesManagerModal } from './components/services/services_manager_modal';
import { InventoryActionModal } from './components/inventory/inventory_action_modal';

// --- COMPONENTES UI / LAYOUT ---
import { Modal } from './components/ui/modal';
import { Header } from './components/layout/header';
import { LoginPage } from './pages/login_page';

// --- HOOKS Y CONTEXTOS ---
import { useAppointments } from './hooks/use_appointments';
import { use_inventory, InventoryItem } from './hooks/use_inventory';
import { useBranch } from './contexts/branch.context';
import { useAuth } from './contexts/auth.context';
import { useEmployees } from './hooks/use_employees';
import { usePromotions } from './hooks/use_promotions'; // <--- NUEVO IMPORT

// --- INFRAESTRUCTURA ---
import { api_client } from './api/api_client';

// --- ESTILOS ---
import './App.css';
import './components/forms/appointment_details.css';

type FeedbackState = {
  is_open: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
};

type ConfirmationState = {
  is_open: boolean;
  cita_id: string | null;
};

export const App = () => {
  const { is_authenticated } = useAuth();
  const { activeBranch: active_branch } = useBranch();

  // --- HOOKS DE DATOS ---
  const {
    data: appointments_list = [],
    isLoading: is_loading_appointments,
    refetch: refetch_appointments,
  } = useAppointments();

  const { data: inventory_data = [], isLoading: is_loading_inventory } = use_inventory();
  const { data: employees = [] } = useEmployees();
  // Consumimos promociones activas
  const { data: promotions = [] } = usePromotions();

  // --- ESTADOS DE UI ---
  const [is_form_modal_open, set_is_form_modal_open] = useState(false);
  const [selected_appointment, set_selected_appointment] = useState<any | null>(null);
  const [processing_ids, set_processing_ids] = useState<string[]>([]);
  const [is_services_modal_open, set_is_services_modal_open] = useState(false);

  // Estados para el cierre (Checkout)
  const [closing_employee_id, set_closing_employee_id] = useState<string>('');
  const [closing_promo_id, set_closing_promo_id] = useState<string>(''); // <--- NUEVO

  const [inventory_modal, set_inventory_modal] = useState<{
    is_open: boolean;
    mode: 'create' | 'restock';
    target_item: InventoryItem | null;
  }>({
    is_open: false,
    mode: 'create',
    target_item: null,
  });

  const [feedback, set_feedback] = useState<FeedbackState>({
    is_open: false,
    title: '',
    message: '',
    type: 'success',
  });

  const [confirmation, set_confirmation] = useState<ConfirmationState>({
    is_open: false,
    cita_id: null,
  });

  // --- VARIABLES DERIVADAS Y CÁLCULOS DE TICKET ---
  const appointment_to_close = appointments_list.find((a) => a.id === confirmation.cita_id);

  // Lógica de cálculo para el ticket visual
  const selected_promo = promotions.find((p) => p.id === closing_promo_id);
  const ticket_subtotal = appointment_to_close?.total || 0;
  const ticket_anticipo = appointment_to_close?.anticipo || 0;

  // Calculamos descuento estimado (El backend es la autoridad final, esto es visual)
  const ticket_descuento = selected_promo ? (ticket_subtotal * selected_promo.descuento) / 100 : 0;

  const ticket_total_final = Math.max(0, ticket_subtotal - ticket_descuento - ticket_anticipo);

  // --- HANDLERS ---

  const handle_close_feedback = () => set_feedback((prev) => ({ ...prev, is_open: false }));
  const handle_cancel_confirmation = () => set_confirmation({ is_open: false, cita_id: null });
  const handle_view_details = (appointment: any) => set_selected_appointment(appointment);

  const handle_request_close = (cita_id: string) => {
    const cita_actual = appointments_list.find((c) => c.id === cita_id);
    set_closing_employee_id(cita_actual?.empleado_id || '');
    set_closing_promo_id(''); // Resetear promo al abrir
    set_confirmation({ is_open: true, cita_id });
  };

  const handle_switch_to_edit = () => {
    if (!appointment_to_close) return;
    handle_cancel_confirmation();
    set_selected_appointment(appointment_to_close);
  };

  const handle_appointment_created = () => {
    set_is_form_modal_open(false);
    set_feedback({
      is_open: true,
      title: '¡Cita Agendada!',
      message: 'La cita se ha registrado correctamente.',
      type: 'success',
    });
    refetch_appointments();
  };

  const open_create_material = () => {
    set_inventory_modal({ is_open: true, mode: 'create', target_item: null });
  };
  const open_restock_material = (item: InventoryItem) => {
    set_inventory_modal({ is_open: true, mode: 'restock', target_item: item });
  };
  const close_inventory_modal = () => {
    set_inventory_modal((prev) => ({ ...prev, is_open: false }));
  };

  /**
   * Ejecuta el cierre enviando empleado y promoción.
   */
  const handle_execute_close = async () => {
    const target_id = confirmation.cita_id;
    if (!target_id) return;

    handle_cancel_confirmation();
    set_processing_ids((prev) => [...prev, target_id]);

    try {
      await api_client.post('/appointments/close', {
        citaId: target_id,
        empleadoId: closing_employee_id || undefined,
        promoId: closing_promo_id || undefined, // <--- Enviar promo seleccionada
      });

      set_feedback({
        is_open: true,
        title: '🎉 ¡Cita Cerrada!',
        message: 'Venta procesada, comisión asignada, descuento aplicado y stock actualizado.',
        type: 'success',
      });
      refetch_appointments();
    } catch (error) {
      console.error('Error crítico en cierre:', error);
      let titulo = 'Error del Sistema';
      let mensaje = 'Ocurrió un error inesperado.';
      let tipo: 'error' | 'warning' = 'error';

      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const msg_backend = error.response.data.message;
        if (status === 409) {
          titulo = '⚠️ Acción Bloqueada';
          mensaje = msg_backend; // Ej: Stock insuficiente o Promo inválida
          tipo = 'warning';
        } else if (status === 403) {
          titulo = '⛔ Acceso Denegado';
          mensaje = 'Sin permisos.';
        } else {
          mensaje = `Error (${status}): ${msg_backend}`;
        }
      }
      set_feedback({ is_open: true, title: titulo, message: mensaje, type: tipo });
    } finally {
      set_processing_ids((prev) => prev.filter((id) => id !== target_id));
    }
  };

  if (!is_authenticated) return <LoginPage />;

  return (
    <div className="layout-root">
      <Header />

      <main className="app-shell">
        <div className="welcome-header" style={{ marginTop: '1rem' }}>
          <div className="welcome-logo">🧖‍♀️</div>
          <div>
            <h1 className="welcome-title">Bienvenido al Panel de Control</h1>
            <p className="welcome-date">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* 2. AGENDA DEL DÍA */}
        <section className="panel">
          <div className="panel-header">
            <h2>Agenda del Día</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary-action" onClick={() => set_is_services_modal_open(true)}>
                ⚙️ Servicios
              </button>
              <button className="btn-primary" onClick={() => set_is_form_modal_open(true)}>
                + Nueva Cita
              </button>
            </div>
          </div>

          {is_loading_appointments ? (
            <p>Cargando agenda...</p>
          ) : (
            <div className="table-responsive">
              <table className="agenda-table">
                <thead>
                  <tr>
                    <th className="col-time">Hora</th>
                    <th className="col-service">Servicio(s)</th>
                    <th className="col-client">Cliente</th>
                    <th className="col-employee">Atendido por</th>
                    <th className="col-status">Estado</th>
                    <th className="col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments_list.length > 0 ? (
                    appointments_list.map((appt) => (
                      <tr key={appt.id}>
                        <td className="col-time">
                          {new Date(appt.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="col-service">{appt.servicio}</td>
                        <td>{appt.cliente}</td>
                        <td>
                          {appt.empleado === 'No asignado' ? (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              Sin asignar
                            </span>
                          ) : (
                            appt.empleado
                          )}
                        </td>
                        <td className="col-status">
                          <span className={`badge-status status-${appt.estado}`}>{appt.estado}</span>
                        </td>
                        <td className="col-actions">
                          <div className="table-actions-container">
                            <button onClick={() => handle_view_details(appt)} className="btn-secondary-action">
                              <span>📄</span> Detalle
                            </button>
                            {appt.estado === 'pendiente' && (
                              <button
                                className="btn-danger"
                                onClick={() => handle_request_close(appt.id)}
                                disabled={processing_ids.includes(appt.id)}
                              >
                                {processing_ids.includes(appt.id) ? '...' : 'Cerrar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-state-row">
                      <td colSpan={6}>No hay citas registradas hoy.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. INVENTARIO */}
        <section className="panel">
          <div className="panel-header">
            <h2>📦 Inventario en Tiempo Real</h2>
            <button className="btn-secondary-action" onClick={open_create_material}>
              + Nuevo Material
            </button>
          </div>
          <InventoryTable data={inventory_data} loading={is_loading_inventory} onRestock={open_restock_material} />
        </section>

        {/* --- MODALES --- */}
        <Modal is_open={is_form_modal_open} on_close={() => set_is_form_modal_open(false)}>
          <AppointmentForm onSuccess={handle_appointment_created} />
        </Modal>

        <AppointmentDetailsModal
          isOpen={!!selected_appointment}
          onClose={() => set_selected_appointment(null)}
          appointment={selected_appointment}
        />

        <ServicesManagerModal is_open={is_services_modal_open} on_close={() => set_is_services_modal_open(false)} />

        <InventoryActionModal
          is_open={inventory_modal.is_open}
          on_close={close_inventory_modal}
          mode={inventory_modal.mode}
          target_item={inventory_modal.target_item}
        />

        {/* === MODAL DE CIERRE (TICKET DE VENTA) === */}
        <Modal is_open={confirmation.is_open} on_close={handle_cancel_confirmation} title="Confirmar Cierre de Venta">
          <div className="confirmation-container">
            <div className="confirmation-icon">💰</div>

            {/* --- TICKET DE VENTA DINÁMICO --- */}
            {appointment_to_close && (
              <div className="checkout-summary">
                <div
                  style={{
                    marginBottom: '0.8rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.5rem',
                    textAlign: 'left',
                  }}
                >
                  <strong>Cliente:</strong> {appointment_to_close.cliente}
                </div>

                {/* Lista de Servicios */}
                {appointment_to_close.servicios_items &&
                  appointment_to_close.servicios_items.map((item, idx) => (
                    <div key={idx} className="checkout-row">
                      <span>{item.nombre}</span>
                      <span>${item.precio}</span>
                    </div>
                  ))}

                {/* --- LÍNEA DE DESCUENTO (Visible solo si hay promo seleccionada) --- */}
                {selected_promo && (
                  <div className="checkout-row" style={{ color: 'var(--success-color)' }}>
                    <span>
                      Promo: {selected_promo.nombre} (-{selected_promo.descuento}%)
                    </span>
                    <span>-${ticket_descuento.toFixed(2)}</span>
                  </div>
                )}

                {/* --- LÍNEA DE ANTICIPO --- */}
                {ticket_anticipo > 0 && (
                  <div className="checkout-row" style={{ color: 'var(--success-color)', fontWeight: 500 }}>
                    <span>Anticipo / Seña</span>
                    <span>-${ticket_anticipo}</span>
                  </div>
                )}

                {/* --- TOTALES --- */}
                <div className="checkout-total">
                  {/* Cambiamos el texto si hay descuentos/anticipos para ser claros */}
                  <span>{ticket_anticipo > 0 || ticket_descuento > 0 ? 'Restante a Cobrar' : 'Total a Pagar'}</span>
                  <span>${ticket_total_final.toFixed(2)}</span>
                </div>

                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <button onClick={handle_switch_to_edit} className="btn-link-action">
                    ✏️ ¿Olvidaste algo? Editar o agregar servicios
                  </button>
                </div>
              </div>
            )}

            <p className="confirmation-subtext" style={{ marginBottom: '1.5rem' }}>
              Al confirmar, se descontará el inventario y se generarán los puntos correspondientes.
            </p>

            {/* --- SELECTORES EN GRID (Empleado y Promoción) --- */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                textAlign: 'left',
                marginBottom: '2rem',
              }}
            >
              {/* Selector de Empleado */}
              <div>
                <label
                  htmlFor="closing-employee"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Asignar Comisión:
                </label>
                <select
                  id="closing-employee"
                  className="inline-edit-select"
                  style={{ fontSize: '0.9rem', padding: '0.4rem 2rem 0.4rem 0.6rem' }}
                  value={closing_employee_id}
                  onChange={(e) => set_closing_employee_id(e.target.value)}
                >
                  <option value="">-- Casa --</option>
                  {employees.map((emp) => (
                    <option key={emp.empleado_id} value={emp.empleado_id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Promoción (NUEVO) */}
              <div>
                <label
                  htmlFor="closing-promo"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Aplicar Promoción:
                </label>
                <select
                  id="closing-promo"
                  className="inline-edit-select"
                  style={{ fontSize: '0.9rem', padding: '0.4rem 2rem 0.4rem 0.6rem' }}
                  value={closing_promo_id}
                  onChange={(e) => set_closing_promo_id(e.target.value)}
                >
                  <option value="">-- Ninguna --</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (-{p.descuento}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handle_cancel_confirmation} className="btn-cancel">
                Cancelar
              </button>
              <button className="btn-primary" onClick={handle_execute_close} autoFocus>
                Confirmar Venta
              </button>
            </div>
          </div>
        </Modal>

        <Modal is_open={feedback.is_open} on_close={handle_close_feedback} title={feedback.title}>
          <div className={`feedback-content feedback-${feedback.type}`}>
            <div className="feedback-icon-lg">
              {feedback.type === 'success' ? '✅' : feedback.type === 'warning' ? '⚠️' : '❌'}
            </div>
            <p className="feedback-msg-center">{feedback.message}</p>
            <div className="feedback-actions">
              <button className="btn-primary" onClick={handle_close_feedback} autoFocus>
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default App;
