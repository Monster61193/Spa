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
 * Este modal reemplaza los 'alerts' nativos para mostrar resultados de operaciones.
 */
type FeedbackState = {
  /** Controla la visibilidad del modal */
  isOpen: boolean;
  /** Título principal (ej. "¡Éxito!", "Error") */
  title: string;
  /** Mensaje detallado para el usuario */
  message: string;
  /** Variación visual del modal según el resultado */
  type: 'success' | 'warning' | 'error';
};

/**
 * Define el estado del modal de confirmación de acciones destructivas.
 * Actúa como un "cortafuegos" antes de ejecutar lógica crítica.
 */
type ConfirmationState = {
  /** Controla la visibilidad del modal de pregunta */
  isOpen: boolean;
  /**
   * ID de la entidad sobre la cual se actuará (ej. ID de la cita).
   * Se guarda aquí temporalmente mientras el usuario confirma.
   */
  citaId: string | null;
};

// --- COMPONENTE PRINCIPAL ---

/**
 * Componente Raíz de la Aplicación (Dashboard).
 *
 * **Responsabilidades:**
 * 1. Orquestar la autenticación (Redirección a Login si no hay sesión).
 * 2. Gestionar el layout principal (Header + Main Content).
 * 3. Coordinar los módulos de negocio: Citas e Inventario.
 * 4. Manejar flujos de interacción complejos mediante Modales (Creación, Confirmación, Feedback, Detalles).
 */
export const App = () => {
  // --- HOOKS DE CONTEXTO Y DATOS ---

  // Autenticación: Acceso al usuario y estado de sesión
  const { is_authenticated, user } = useAuth();

  // Sucursal: Contexto global para filtrar datos por sede
  const { activeBranch } = useBranch();

  // Citas: Obtención de la agenda del día (conectado a API)
  const { data: appointments = [], isLoading, refetch } = useAppointments();

  // Inventario: Obtención del stock en tiempo real
  // Renombramos variables para evitar colisiones de nombres con el hook de citas
  const { data: inventoryData = [], isLoading: isLoadingInventory } = use_inventory();

  // --- ESTADOS LOCALES (UI) ---

  // Control del modal de "Nueva Cita"
  const [is_modal_open, set_is_modal_open] = useState(false);

  // Control de la cita seleccionada para ver detalles (Sprint 2)
  // Si es null, el modal de detalles está cerrado.
  const [selected_appointment, set_selected_appointment] = useState<any | null>(null);

  // Estado de carga para botones individuales en la tabla (UX: Evitar doble clic)
  const [closing_ids, set_closing_ids] = useState<string[]>([]);

  // Estado para el Modal de Feedback (Resultado final de operaciones)
  const [feedback, set_feedback] = useState<FeedbackState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Estado para el Modal de Confirmación (Paso intermedio de seguridad)
  const [confirmation, set_confirmation] = useState<ConfirmationState>({
    isOpen: false,
    citaId: null,
  });

  // --- HANDLERS (Lógica de Interacción) ---

  /** Cierra el modal de feedback y reinicia su estado */
  const close_feedback = () => set_feedback((prev) => ({ ...prev, isOpen: false }));

  /** Cierra el modal de confirmación y limpia el ID temporal */
  const close_confirmation = () => set_confirmation({ isOpen: false, citaId: null });

  /**
   * Abre el modal de detalles para una cita específica.
   * @param appt - Objeto completo de la cita proveniente del hook.
   */
  const handleViewDetails = (appt: any) => {
    set_selected_appointment(appt);
  };

  /**
   * PASO 1: Solicitar confirmación de cierre.
   * En lugar de ejecutar la lógica directamente, abre el modal de pregunta.
   * Esto previene acciones accidentales.
   *
   * @param cita_id - ID de la cita que se intenta cerrar.
   */
  const request_close_appointment = (cita_id: string) => {
    set_confirmation({
      isOpen: true,
      citaId: cita_id,
    });
  };

  /**
   * PASO 2: Ejecutar cierre de cita.
   * Esta función se invoca ÚNICAMENTE cuando el usuario confirma explícitamente en el modal.
   * Maneja la llamada a la API, errores de negocio y actualizaciones de UI.
   */
  const execute_close_appointment = async () => {
    // Recuperamos el ID que guardamos en el paso 1
    const cita_id = confirmation.citaId;
    if (!cita_id) return;

    // Cerramos la pregunta inmediatamente para dar feedback visual de "proceso"
    close_confirmation();

    // UX: Indicamos carga en el botón específico de la tabla
    set_closing_ids((prev) => [...prev, cita_id]);

    try {
      // Llamada al endpoint transaccional del backend
      const response = await api_client.post('/appointments/close', { citaId: cita_id });

      // CASO ÉXITO: Mostramos modal verde
      set_feedback({
        isOpen: true,
        title: '🎉 ¡Cita Cerrada!',
        message: response.data.mensaje || 'Operación completada con éxito.',
        type: 'success',
      });

      // Refrescamos la tabla de citas para mostrar el nuevo estado "cerrada"
      // React Query también refrescará automáticamente el inventario si las keys están bien configuradas
      refetch();
    } catch (error) {
      console.error('Error crítico al cerrar cita:', error);

      // Valores por defecto para error genérico
      let titulo = 'Error del Sistema';
      let mensaje = 'Ocurrió un error inesperado.';
      let tipo: 'error' | 'warning' = 'error';

      // Manejo semántico de errores HTTP (Reglas de Negocio vs Errores Técnicos)
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const msg = error.response.data.message;

        if (status === 409) {
          // 409 Conflict: Problemas de lógica de negocio (ej. Stock insuficiente)
          titulo = '⚠️ Acción Bloqueada';
          mensaje = msg; // Mostramos el mensaje detallado del backend
          tipo = 'warning';
        } else if (status === 403) {
          // 403 Forbidden: Problemas de permisos (RBAC / Sucursal)
          titulo = '⛔ Acceso Denegado';
          mensaje = 'No tienes permisos para realizar esta acción en esta sucursal.';
        } else {
          // 500, 400, etc.
          mensaje = `Error (${status}): ${msg || mensaje}`;
        }
      }

      // Mostramos el modal con la configuración de error adecuada
      set_feedback({ isOpen: true, title: titulo, message: mensaje, type: tipo });
    } finally {
      // Limpieza: Liberamos el estado de carga del botón siempre
      set_closing_ids((prev) => prev.filter((id) => id !== cita_id));
    }
  };

  // --- RENDERIZADO CONDICIONAL (Seguridad) ---

  // Si no hay sesión válida, forzamos la vista de Login.
  // Esto protege todo el dashboard de accesos no autorizados.
  if (!is_authenticated) {
    return <LoginPage />;
  }

  // --- LAYOUT PRINCIPAL ---
  return (
    <div className="layout-root">
      {/* Header Global: Navegación y Perfil de Usuario */}
      <Header />

      <main className="app-shell">
        {/* SECCIÓN DE BIENVENIDA */}
        <div
          className="welcome-section"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}
        >
          {/* Logo Corporativo */}
          <div className="logo-container">
            <span style={{ fontSize: '2rem' }}>🧖‍♀️</span>
          </div>

          {/* Saludo y Fecha */}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Bienvenido al Panel de Control</h1>
            <p className="subtitle" style={{ margin: '0.2rem 0 0 0' }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* SECCIÓN: SELECTOR DE CONTEXTO (SUCURSAL) */}
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
            {/* Botón de acción primaria */}
            <button className="btn-primary" onClick={() => set_is_modal_open(true)}>
              + Nueva Cita
            </button>
          </div>

          {/* Tabla de Datos con estados de carga */}
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

                        {/* Badge de Estado */}
                        <td className="text-center">
                          <span className={`badge-status status-${appt.estado}`}>{appt.estado}</span>
                        </td>

                        {/* Acciones Contextuales */}
                        <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                          {/* Botón: Ver Detalles (Nuevo Sprint 2) */}
                          <button
                            onClick={() => handleViewDetails(appt)}
                            className="icon-btn"
                            title="Ver Detalles Completos"
                            style={{
                              marginRight: '0.8rem',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              border: 'none',
                              background: 'none',
                            }}
                          >
                            👁️
                          </button>

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
                    // Estado Vacío de la Tabla
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

        {/* SECCIÓN: INVENTARIO (Visualización en tiempo real) */}
        <section className="panel">
          <div className="panel-header">
            <h2>📦 Inventario en Tiempo Real</h2>
          </div>

          {/* Componente de tabla especializado con lógica de alertas */}
          <InventoryTable data={inventoryData} loading={isLoadingInventory} />
        </section>

        {/* --- SISTEMA DE MODALES --- */}

        {/* 1. Modal de Formulario (Creación) */}
        <Modal is_open={is_modal_open} on_close={() => set_is_modal_open(false)} title="">
          <AppointmentForm />
        </Modal>

        {/* 2. Modal de Detalles de Cita (Visualización) - SPRINT 2 */}
        <AppointmentDetailsModal
          isOpen={!!selected_appointment}
          onClose={() => set_selected_appointment(null)}
          appointment={selected_appointment}
        />

        {/* 3. Modal de Confirmación (Seguridad antes de acción destructiva) */}
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

        {/* 4. Modal de Feedback (Respuesta del Sistema) */}
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
