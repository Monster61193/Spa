import { useState } from 'react';
import { isAxiosError } from 'axios';

// Componentes de Negocio (Módulos)
import { BranchSelector } from './components/branch_selector/branch_selector';
import { InventoryTable } from './components/inventory/inventory_table';
import { AppointmentForm } from './components/forms/appointment_form';
import { AppointmentDetailsModal } from './components/forms/appointment_details_modal';

// Componentes UI y Layout
import { Modal } from './components/ui/modal';
import { Header } from './components/layout/header';
import { LoginPage } from './pages/login_page';

// Hooks y Contextos
import { useAppointments } from './hooks/use_appointments';
import { use_inventory } from './hooks/use_inventory';
import { useBranch } from './contexts/branch.context';
import { useAuth } from './contexts/auth.context';

// Configuración
import { api_client } from './api/api_client';

// --- DEFINICIÓN DE TIPOS LOCALES ---

/**
 * Define el estado del modal de retroalimentación (Feedback Modal).
 */
type FeedbackState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
};

/**
 * Define el estado del modal de confirmación de acciones destructivas.
 */
type ConfirmationState = {
  isOpen: boolean;
  citaId: string | null;
};

// --- COMPONENTE PRINCIPAL ---

/**
 * Componente Raíz de la Aplicación (Dashboard).
 */
export const App = () => {
  // --- HOOKS DE CONTEXTO Y DATOS ---
  const { is_authenticated } = useAuth();
  const { activeBranch } = useBranch();
  const { data: appointments = [], isLoading, refetch } = useAppointments();
  const { data: inventoryData = [], isLoading: isLoadingInventory } = use_inventory();

  // --- ESTADOS LOCALES (UI) ---
  const [is_modal_open, set_is_modal_open] = useState(false);
  const [selected_appointment, set_selected_appointment] = useState<any | null>(null);
  const [closing_ids, set_closing_ids] = useState<string[]>([]);

  const [feedback, set_feedback] = useState<FeedbackState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const [confirmation, set_confirmation] = useState<ConfirmationState>({
    isOpen: false,
    citaId: null,
  });

  // --- HANDLERS (Lógica de Interacción) ---

  const close_feedback = () => set_feedback((prev) => ({ ...prev, isOpen: false }));
  const close_confirmation = () => set_confirmation({ isOpen: false, citaId: null });

  const handleViewDetails = (appt: any) => {
    set_selected_appointment(appt);
  };

  const request_close_appointment = (cita_id: string) => {
    set_confirmation({
      isOpen: true,
      citaId: cita_id,
    });
  };

  const execute_close_appointment = async () => {
    const cita_id = confirmation.citaId;
    if (!cita_id) return;

    close_confirmation();
    set_closing_ids((prev) => [...prev, cita_id]);

    try {
      const response = await api_client.post('/appointments/close', { citaId: cita_id });
      set_feedback({
        isOpen: true,
        title: '🎉 ¡Cita Cerrada!',
        message: response.data.mensaje || 'Operación completada con éxito.',
        type: 'success',
      });
      refetch();
    } catch (error) {
      console.error('Error crítico al cerrar cita:', error);
      let titulo = 'Error del Sistema';
      let mensaje = 'Ocurrió un error inesperado.';
      let tipo: 'error' | 'warning' = 'error';

      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const msg = error.response.data.message;
        if (status === 409) {
          titulo = '⚠️ Acción Bloqueada';
          mensaje = msg;
          tipo = 'warning';
        } else if (status === 403) {
          titulo = '⛔ Acceso Denegado';
          mensaje = 'No tienes permisos para realizar esta acción en esta sucursal.';
        } else {
          mensaje = `Error (${status}): ${msg || mensaje}`;
        }
      }
      set_feedback({ isOpen: true, title: titulo, message: mensaje, type: tipo });
    } finally {
      set_closing_ids((prev) => prev.filter((id) => id !== cita_id));
    }
  };

  if (!is_authenticated) return <LoginPage />;

  // --- LAYOUT PRINCIPAL ---
  return (
    <div className="layout-root">
      <Header />

      <main className="app-shell">
        {/* SECCIÓN DE BIENVENIDA */}
        <div
          className="welcome-section"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div className="logo-container">
            <span style={{ fontSize: '2rem' }}>🧖‍♀️</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Bienvenido al Panel de Control</h1>
            <p className="subtitle" style={{ margin: '0.2rem 0 0 0' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* SECCIÓN: SELECTOR DE CONTEXTO */}
        <section className="panel" style={{ marginBottom: '1.5rem' }}>
          <BranchSelector />
          {activeBranch && (
            <p className="subtitle mt-2">
              Sucursal activa: <strong>{activeBranch.nombre}</strong>
            </p>
          )}
        </section>

        {/* SECCIÓN: GESTIÓN DE CITAS (Core Business) */}
        <section className="panel">
          <div className="panel-header">
            <h2>Agenda del Día</h2>
            <button className="btn-primary" onClick={() => set_is_modal_open(true)}>
              + Nueva Cita
            </button>
          </div>

          {isLoading ? (
            <p>Cargando agenda...</p>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {/* Ajuste de anchos para mejor distribución visual */}
                    <th style={{ width: '12%', textAlign: 'left' }}>Hora</th>
                    <th style={{ width: '35%', textAlign: 'left' }}>Servicio(s)</th>
                    <th style={{ width: '20%', textAlign: 'left' }}>Cliente</th>
                    <th className="text-center" style={{ width: '13%' }}>
                      Estado
                    </th>
                    <th className="text-center" style={{ width: '20%' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {new Date(appt.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{appt.servicio}</td>
                        <td>{appt.cliente}</td>

                        <td className="text-center">
                          <span className={`badge-status status-${appt.estado}`}>{appt.estado}</span>
                        </td>

                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                          {/* Contenedor Flex para centrar botones independientemente de la cantidad */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '0.5rem',
                              minHeight: '36px', // Altura mínima para evitar saltos visuales
                            }}
                          >
                            <button
                              onClick={() => handleViewDetails(appt)}
                              className="btn-secondary-action"
                              title="Ver detalles"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.4rem 0.8rem',
                              }}
                            >
                              <span>📄</span> Detalle
                            </button>

                            {appt.estado === 'pendiente' && (
                              <button
                                className="btn-danger"
                                onClick={() => request_close_appointment(appt.id)}
                                disabled={closing_ids.includes(appt.id)}
                                style={{
                                  opacity: closing_ids.includes(appt.id) ? 0.6 : 1,
                                  cursor: closing_ids.includes(appt.id) ? 'not-allowed' : 'pointer',
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {closing_ids.includes(appt.id) ? '...' : 'Cerrar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-secondary">
                        No hay citas registradas en esta sucursal para hoy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECCIÓN: INVENTARIO */}
        <section className="panel">
          <div className="panel-header">
            <h2>📦 Inventario en Tiempo Real</h2>
          </div>
          <InventoryTable data={inventoryData} loading={isLoadingInventory} />
        </section>

        {/* --- MODALES --- */}
        <Modal is_open={is_modal_open} on_close={() => set_is_modal_open(false)} title="">
          <AppointmentForm />
        </Modal>

        <AppointmentDetailsModal
          isOpen={!!selected_appointment}
          onClose={() => set_selected_appointment(null)}
          appointment={selected_appointment}
        />

        <Modal is_open={confirmation.isOpen} on_close={close_confirmation} title="Confirmar Acción">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
              ¿Estás seguro de cerrar esta cita? <br />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Se descontará inventario y se generarán puntos automáticamente.
              </span>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={close_confirmation}
                style={{
                  padding: '0.6rem 1.2rem',
                  border: '1px solid #ccc',
                  background: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={execute_close_appointment} autoFocus>
                Sí, Confirmar
              </button>
            </div>
          </div>
        </Modal>

        <Modal is_open={feedback.isOpen} on_close={close_feedback} title={feedback.title}>
          <div className={`feedback-content feedback-${feedback.type}`}>
            <div className="feedback-icon" style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>
              {feedback.type === 'success' && '✅'}
              {feedback.type === 'warning' && '⚠️'}
              {feedback.type === 'error' && '❌'}
            </div>
            <p className="feedback-message" style={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}>
              {feedback.message}
            </p>
            <div className="text-center mt-2" style={{ textAlign: 'center' }}>
              <button className="btn-primary" onClick={close_feedback} autoFocus>
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
