import { useState } from 'react'
import { BranchSelector } from './components/branch_selector/branch_selector'
import { InventoryForm } from './components/forms/inventory_form'
import { AppointmentForm } from './components/forms/appointment_form'
import { useAppointments } from './hooks/use_appointments'
import { useBranch } from './contexts/branch.context'
import { useAuth } from './contexts/auth.context'
import { LoginPage } from './pages/login_page'
import { Modal } from './components/ui/modal'
import { Header } from './components/layout/header'

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
  const { is_authenticated, user } = useAuth()
  
  // Obtenemos el contexto de la sucursal activa
  const { activeBranch } = useBranch()
  
  // Consumimos las citas de la sucursal activa (vienen del backend real)
  const { data: appointments = [], isLoading } = useAppointments()
  
  // Estado local para controlar la visibilidad del modal de "Agendar Cita"
  const [is_modal_open, set_is_modal_open] = useState(false)

  // 1. BLOQUEO DE SEGURIDAD:
  // Si NO está autenticado, mostramos Login y detenemos la renderización del dashboard.
  if (!is_authenticated) {
    return <LoginPage />
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
            <button 
              className="btn-primary"
              onClick={() => set_is_modal_open(true)}
            >
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
                          <span className={`badge-status status-${appointment.estado}`}>
                            {appointment.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-secondary">
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
  )
}

export default App