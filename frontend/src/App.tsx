import { useState } from 'react';
import { isAxiosError } from 'axios';
import { BranchSelector } from './components/branch_selector/branch_selector';
import { InventoryForm } from './components/forms/inventory_form';
import { AppointmentForm } from './components/forms/appointment_form';
import { useAppointments } from './hooks/use_appointments';
import { useBranch } from './contexts/branch.context';
import { useAuth } from './contexts/auth.context';
import { LoginPage } from './pages/login_page';
import { Modal } from './components/ui/modal';
import { Header } from './components/layout/header';
import { api_client } from './api/api_client';

// --- DEFINICIÓN DE TIPOS LOCALES ---

type FeedbackState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
};

/**
 * Estado para controlar el modal de confirmación previo a la acción.
 */
type ConfirmationState = {
  isOpen: boolean;
  citaId: string | null; // Guardamos el ID para saber qué borrar al confirmar
};

// --- COMPONENTE PRINCIPAL ---

export const App = () => {
  const { is_authenticated, user } = useAuth();
  const { activeBranch } = useBranch();
  const { data: appointments = [], isLoading, refetch } = useAppointments();

  // Estados de UI
  const [is_modal_open, set_is_modal_open] = useState(false);
  const [closing_ids, set_closing_ids] = useState<string[]>([]);

  // Estado para el Feedback (Resultado final)
  const [feedback, set_feedback] = useState<FeedbackState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // NUEVO: Estado para la Confirmación (Paso previo)
  const [confirmation, set_confirmation] = useState<ConfirmationState>({
    isOpen: false,
    citaId: null,
  });

  // --- HANDLERS ---

  const close_feedback = () => set_feedback((prev) => ({ ...prev, isOpen: false }));

  const close_confirmation = () => set_confirmation({ isOpen: false, citaId: null });

  /**
   * PASO 1: Solicitar confirmación.
   * En lugar de ejecutar la lógica, solo abrimos el modal de pregunta.
   */
  const request_close_appointment = (cita_id: string) => {
    set_confirmation({
      isOpen: true,
      citaId: cita_id,
    });
  };

  /**
   * PASO 2: Ejecutar cierre.
   * Esta función se llama SOLO cuando el usuario confirma en el modal.
   */
  const execute_close_appointment = async () => {
    // Obtenemos el ID guardado en el estado
    const cita_id = confirmation.citaId;
    if (!cita_id) return;

    // Cerramos el modal de pregunta inmediatamente
    close_confirmation();

    // Iniciamos la carga visual en el botón de la tabla
    set_closing_ids((prev) => [...prev, cita_id]);

    try {
      const response = await api_client.post('/appointments/close', { citaId: cita_id });

      // Éxito: Modal Verde
      set_feedback({
        isOpen: true,
        title: '🎉 ¡Cita Cerrada!',
        message: response.data.mensaje || 'Operación completada con éxito.',
        type: 'success',
      });

      refetch();
    } catch (error) {
      console.error('Error al cerrar:', error);

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
          mensaje = 'No tienes permisos en esta sucursal.';
        } else {
          mensaje = `Error (${status}): ${msg || mensaje}`;
        }
      }

      set_feedback({ isOpen: true, title: titulo, message: mensaje, type: tipo });
    } finally {
      set_closing_ids((prev) => prev.filter((id) => id !== cita_id));
    }
  };

  if (!is_authenticated) {
    return <LoginPage />;
  }

  return (
    <div className="layout-root">
      <Header />

      <main className="app-shell">
        {/* WELCOME SECTION */}
        <div
          className="welcome-section"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div className="logo-container">
            {/* Aquí va tu logo, asegúrate de tener la imagen en public/ */}
            <span style={{ fontSize: '2rem' }}>🧖‍♀️</span>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Bienvenido al Panel de Control</h1>
            <p className="subtitle" style={{ margin: '0.2rem 0 0 0' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* SELECTOR DE SUCURSAL */}
        <section className="panel" style={{ marginBottom: '1.5rem' }}>
          <BranchSelector />
          {activeBranch && (
            <p className="subtitle mt-2">
              Sucursal activa: <strong>{activeBranch.nombre}</strong>
            </p>
          )}
        </section>

        {/* TABLA DE CITAS */}
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
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Servicio</th>
                    <th>Cliente</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>
                          {new Date(appt.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{appt.servicio}</td>
                        <td>{appt.cliente}</td>
                        <td className="text-center">
                          <span className={`badge-status status-${appt.estado}`}>{appt.estado}</span>
                        </td>
                        <td className="text-center">
                          {/* BOTÓN: Ahora llama a request_close_appointment en vez de la lógica directa */}
                          {appt.estado === 'pendiente' ? (
                            <button
                              className="btn-danger"
                              onClick={() => request_close_appointment(appt.id)}
                              disabled={closing_ids.includes(appt.id)}
                              style={{
                                opacity: closing_ids.includes(appt.id) ? 0.6 : 1,
                                cursor: closing_ids.includes(appt.id) ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {closing_ids.includes(appt.id) ? 'Cerrando...' : 'Cerrar / Cobrar'}
                            </button>
                          ) : (
                            <span className="text-secondary" style={{ fontSize: '0.9rem' }}>
                              ✅ Completada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-secondary">
                        No hay citas registradas en esta sucursal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* INVENTARIO */}
        <section className="panel">
          <h2>Modelo de inventario</h2>
          <InventoryForm />
        </section>

        {/* --- MODALES --- */}

        {/* 1. MODAL FORMULARIO (Nueva Cita) */}
        <Modal is_open={is_modal_open} on_close={() => set_is_modal_open(false)} title="">
          <AppointmentForm />
        </Modal>

        {/* 2. MODAL CONFIRMACIÓN (Reemplazo de window.confirm) */}
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

        {/* 3. MODAL FEEDBACK (Resultado) */}
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
