import { useState } from 'react';
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

/**
 * Vista principal de la aplicación.
 * Orquesta la navegación, autenticación y layout principal.
 *
 * Estructura:
 * - Header: Navegación y herramientas globales.
 * - Main: Contenedor principal con padding.
 * - Secciones: Paneles de contenido (Citas, Inventario).
 */
export const App = () => {
  // Obtenemos el estado de autenticación y funciones de sesión
  const { is_authenticated, user } = useAuth();

  // Obtenemos el contexto de la sucursal activa
  const { activeBranch } = useBranch();

  // Consumimos las citas de la sucursal activa (vienen del backend real)
  // 'refetch' nos permite recargar los datos manualmente tras una acción
  const { data: appointments = [], isLoading, refetch } = useAppointments();

  // Estado local para controlar la visibilidad del modal de "Agendar Cita"
  const [is_modal_open, set_is_modal_open] = useState(false);

  // Estado para controlar qué citas se están cerrando actualmente (para deshabilitar botones individualmente)
  const [closing_ids, set_closing_ids] = useState<string[]>([]);

  /**
   * Maneja la acción de cerrar una cita.
   * Llama al endpoint transaccional del backend y actualiza la UI.
   *
   * @param cita_id - ID de la cita a cerrar.
   */
  const handle_close_appointment = async (cita_id: string) => {
    // 1. Confirmación de seguridad para evitar clics accidentales
    const confirmar = window.confirm(
      '¿Estás seguro de cerrar esta cita? Se descontará inventario y se generarán puntos.',
    );
    if (!confirmar) return;

    // 2. Agregamos el ID a la lista de "procesando" para mostrar feedback visual
    set_closing_ids((prev) => [...prev, cita_id]);

    try {
      // 3. Llamada al endpoint transaccional
      await api_client.post('/appointments/close', { citaId: cita_id });

      alert('¡Cita cerrada y procesada con éxito!');

      // 4. Recargamos la tabla para mostrar el nuevo estado
      refetch();
    } catch (error) {
      console.error('Error al cerrar la cita:', error);
      alert('Ocurrió un error al intentar cerrar la cita. Revisa la consola.');
    } finally {
      // 5. Quitamos el ID de la lista de "procesando"
      set_closing_ids((prev) => prev.filter((id) => id !== cita_id));
    }
  };

  // 1. BLOQUEO DE SEGURIDAD:
  // Si NO está autenticado, mostramos Login y detenemos la renderización del dashboard.
  if (!is_authenticated) {
    return <LoginPage />;
  }

  // 2. DASHBOARD (Solo visible si hay sesión activa):
  return (
    <div className="layout-root">
      {/* HEADER DE NAVEGACIÓN */}
      <Header />

      {/* CONTENIDO PRINCIPAL */}
      <main className="app-shell">
        {/* Título de Bienvenida */}
        <div className="welcome-section">
          <h1>Agenda Cinco Estrellas</h1>
          <p className="subtitle">Bienvenido de nuevo, {user?.nombre}</p>
        </div>

        {/* Panel de Selección de Sucursal */}
        <section className="panel">
          <BranchSelector />
          {activeBranch ? (
            <p className="subtitle mt-2">
              Operando en: <strong>{activeBranch.nombre}</strong>
            </p>
          ) : (
            <p className="subtitle">Cargando sucursales...</p>
          )}
        </section>

        {/* Panel de Gestión de Citas */}
        <section className="panel">
          <div className="panel-header">
            <h2>Citas por sucursal</h2>

            {/* Botón para abrir el Modal de Agendar */}
            <button className="btn-primary" onClick={() => set_is_modal_open(true)}>
              + Nueva Cita
            </button>
          </div>

          {/* Tabla de Citas */}
          {isLoading ? (
            <p>Cargando citas...</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Cliente</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th> {/* Nueva Columna */}
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{new Date(appointment.fechaHora).toLocaleString()}</td>
                        <td>{appointment.servicio}</td>
                        <td>{appointment.cliente}</td>
                        <td className="text-center">
                          <span className={`badge-status status-${appointment.estado}`}>{appointment.estado}</span>
                        </td>
                        {/* Célula de Acciones: Conectada a la función handle_close_appointment */}
                        <td className="text-center">
                          {appointment.estado === 'pendiente' ? (
                            <button
                              className="btn-danger"
                              onClick={() => handle_close_appointment(appointment.id)}
                              disabled={closing_ids.includes(appointment.id)}
                              style={{
                                opacity: closing_ids.includes(appointment.id) ? 0.7 : 1,
                                cursor: closing_ids.includes(appointment.id) ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {closing_ids.includes(appointment.id) ? 'Cerrando...' : 'Cerrar / Cobrar'}
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

        {/* Panel de Inventario (Placeholder) */}
        <section className="panel">
          <h2>Modelo de inventario</h2>
          <InventoryForm />
        </section>

        {/* MODAL DE AGENDAR CITA */}
        <Modal
          is_open={is_modal_open}
          on_close={() => set_is_modal_open(false)}
          title="" // El título ya está incluido en el formulario interno
        >
          <AppointmentForm />
        </Modal>
      </main>
    </div>
  );
};

export default App;
