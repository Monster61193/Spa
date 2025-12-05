import { useState } from 'react';
import { isAxiosError } from 'axios';

// --- COMPONENTES DE NEGOCIO (Dominios) ---
import { BranchSelector } from './components/branch_selector/branch_selector';
import { InventoryTable } from './components/inventory/inventory_table';
import { AppointmentForm } from './components/forms/appointment_form';
import { AppointmentDetailsModal } from './components/forms/appointment_details_modal';
// Nuevos componentes del Sprint 2.5 (Catálogos e Inventario)
import { ServicesManagerModal } from './components/services/services_manager_modal';
import { InventoryActionModal } from './components/inventory/inventory_action_modal';

// --- COMPONENTES UI / LAYOUT ---
import { Modal } from './components/ui/modal';
import { Header } from './components/layout/header';
import { LoginPage } from './pages/login_page';

// --- HOOKS Y CONTEXTOS (Capa de Aplicación) ---
import { useAppointments } from './hooks/use_appointments';
import { use_inventory, InventoryItem } from './hooks/use_inventory'; // Importamos InventoryItem
import { useBranch } from './contexts/branch.context';
import { useAuth } from './contexts/auth.context';

// --- INFRAESTRUCTURA ---
import { api_client } from './api/api_client';

// --- ESTILOS GLOBALES UNIFICADOS ---
import './App.css';

// --- DEFINICIÓN DE TIPOS LOCALES ---
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

/**
 * Componente Principal: Dashboard Operativo.
 * Gestiona el ciclo de vida completo de las operaciones de Citas e Inventario.
 */
export const App = () => {
  // --- HOOKS DE CONTEXTO ---
  const { is_authenticated } = useAuth();
  const { activeBranch: active_branch } = useBranch();

  // --- HOOKS DE DATOS ---
  const {
    data: appointments_list = [],
    isLoading: is_loading_appointments,
    refetch: refetch_appointments,
  } = useAppointments();

  const { data: inventory_data = [], isLoading: is_loading_inventory } = use_inventory();

  // --- ESTADOS DE UI ---
  const [is_form_modal_open, set_is_form_modal_open] = useState(false);
  const [selected_appointment, set_selected_appointment] = useState<any | null>(null);
  const [processing_ids, set_processing_ids] = useState<string[]>([]);
  const [is_services_modal_open, set_is_services_modal_open] = useState(false);

  // Nuevo estado para el modal de Inventario (Crear/Restock)
  const [inventory_modal, set_inventory_modal] = useState<{
    is_open: boolean;
    mode: 'create' | 'restock';
    target_item: InventoryItem | null;
  }>({
    is_open: false,
    mode: 'create',
    target_item: null,
  });

  // Estados Modales Auxiliares
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

  // --- HANDLERS (Lógica de Negocio) ---

  const handle_close_feedback = () => set_feedback((prev) => ({ ...prev, is_open: false }));

  const handle_cancel_confirmation = () => set_confirmation({ is_open: false, cita_id: null });

  const handle_view_details = (appointment: any) => set_selected_appointment(appointment);

  const handle_request_close = (cita_id: string) => set_confirmation({ is_open: true, cita_id });

  /**
   * NUEVO HANDLER: Gestiona el éxito al crear una cita.
   * 1. Cierra el modal del formulario.
   * 2. Muestra feedback visual de éxito.
   * 3. Refresca la tabla de citas (adiós reload).
   */
  const handle_appointment_created = () => {
    set_is_form_modal_open(false); // Cierra el modal
    set_feedback({
      is_open: true,
      title: '¡Cita Agendada!',
      message: 'La cita se ha registrado correctamente en el sistema.',
      type: 'success',
    });
    refetch_appointments(); // Actualización "live"
  };

  // --- HANDLERS INVENTARIO (Sprint 2.5) ---

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
   * Ejecuta el cierre de venta (Transacción).
   */
  const handle_execute_close = async () => {
    const target_id = confirmation.cita_id;
    if (!target_id) return;

    handle_cancel_confirmation();
    set_processing_ids((prev) => [...prev, target_id]);

    try {
      const response = await api_client.post('/appointments/close', { citaId: target_id });
      set_feedback({
        is_open: true,
        title: '🎉 ¡Cita Cerrada!',
        message: response.data.mensaje || 'Venta procesada y stock actualizado.',
        type: 'success',
      });
      refetch_appointments();
    } catch (error) {
      console.error('Error crítico en cierre de cita:', error);
      let titulo = 'Error del Sistema';
      let mensaje = 'Ocurrió un error inesperado de red.';
      let tipo: 'error' | 'warning' = 'error';

      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const msg_backend = error.response.data.message;
        if (status === 409) {
          titulo = '⚠️ Acción Bloqueada';
          mensaje = msg_backend;
          tipo = 'warning';
        } else if (status === 403) {
          titulo = '⛔ Acceso Denegado';
          mensaje = 'No tienes permisos en esta sucursal.';
        } else {
          mensaje = `Error (${status}): ${msg_backend || mensaje}`;
        }
      }
      set_feedback({ is_open: true, title: titulo, message: mensaje, type: tipo });
    } finally {
      set_processing_ids((prev) => prev.filter((id) => id !== target_id));
    }
  };

  // Guard de autenticación
  if (!is_authenticated) return <LoginPage />;

  return (
    <div className="layout-root">
      <Header />

      <main className="app-shell">
        {/* 1. BIENVENIDA */}
        <div className="welcome-header">
          <div className="welcome-logo">🧖‍♀️</div>
          <div>
            <h1 className="welcome-title">Bienvenido al Panel de Control</h1>
            <p className="welcome-date">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* 2. SELECTOR DE SUCURSAL */}
        <section className="panel section-spacer">
          <BranchSelector />
          {active_branch && (
            <p className="branch-info">
              Sucursal activa: <strong>{active_branch.nombre}</strong>
            </p>
          )}
        </section>

        {/* 3. AGENDA */}
        <section className="panel">
          <div className="panel-header">
            <h2>Agenda del Día</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Botón Gestión de Catálogo (Sprint 2.5) */}
              <button
                className="btn-secondary-action"
                onClick={() => set_is_services_modal_open(true)}
                title="Gestionar catálogo de servicios"
              >
                ⚙️ Servicios
              </button>
              <button
                className="btn-primary"
                onClick={() => set_is_form_modal_open(true)}
                aria-label="Crear nueva cita"
              >
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
                        <td className="col-status">
                          <span className={`badge-status status-${appt.estado}`}>{appt.estado}</span>
                        </td>
                        <td className="col-actions">
                          <div className="table-actions-container">
                            <button
                              onClick={() => handle_view_details(appt)}
                              className="btn-secondary-action"
                              title="Ver detalles completos"
                            >
                              <span>📄</span> Detalle
                            </button>
                            {appt.estado === 'pendiente' && (
                              <button
                                className="btn-danger"
                                onClick={() => handle_request_close(appt.id)}
                                disabled={processing_ids.includes(appt.id)}
                                title="Procesar cierre de venta"
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
                      <td colSpan={5}>No hay citas registradas en esta sucursal para hoy.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 4. INVENTARIO */}
        <section className="panel">
          <div className="panel-header">
            <h2>📦 Inventario en Tiempo Real</h2>
            <button
              className="btn-secondary-action" // Botón para crear nuevo material
              onClick={open_create_material}
              title="Registrar nuevo material"
            >
              + Nuevo Material
            </button>
          </div>
          <InventoryTable
            data={inventory_data}
            loading={is_loading_inventory}
            onRestock={open_restock_material} // Pasamos el handler de restock
          />
        </section>

        {/* --- MODALES --- */}

        {/* Modal: Crear Cita */}
        <Modal is_open={is_form_modal_open} on_close={() => set_is_form_modal_open(false)}>
          <AppointmentForm onSuccess={handle_appointment_created} />
        </Modal>

        {/* Modal: Detalles (Lectura, Edición, Cancelación) */}
        <AppointmentDetailsModal
          isOpen={!!selected_appointment}
          onClose={() => set_selected_appointment(null)}
          appointment={selected_appointment}
        />

        {/* Modal: Gestor de Servicios (Sprint 2.5) */}
        <ServicesManagerModal is_open={is_services_modal_open} on_close={() => set_is_services_modal_open(false)} />

        {/* Modal: Acciones de Inventario (Sprint 2.5) */}
        <InventoryActionModal
          is_open={inventory_modal.is_open}
          on_close={close_inventory_modal}
          mode={inventory_modal.mode}
          target_item={inventory_modal.target_item}
        />

        {/* Modal: Confirmación Cierre */}
        <Modal is_open={confirmation.is_open} on_close={handle_cancel_confirmation} title="Confirmar Acción">
          <div className="confirmation-container">
            <div className="confirmation-icon">🤔</div>
            <p className="confirmation-text">
              ¿Estás seguro de cerrar esta cita?
              <span className="confirmation-subtext">
                Se descontará inventario y se generarán puntos automáticamente.
              </span>
            </p>
            <div className="modal-actions">
              <button onClick={handle_cancel_confirmation} className="btn-cancel">
                Cancelar
              </button>
              <button className="btn-primary" onClick={handle_execute_close} autoFocus>
                Sí, Confirmar
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Feedback */}
        <Modal is_open={feedback.is_open} on_close={handle_close_feedback} title={feedback.title}>
          <div className={`feedback-content feedback-${feedback.type}`}>
            <div className="feedback-icon-lg">
              {feedback.type === 'success' && '✅'}
              {feedback.type === 'warning' && '⚠️'}
              {feedback.type === 'error' && '❌'}
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
