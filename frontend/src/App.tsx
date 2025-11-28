import { BranchSelector } from './components/branch_selector/branch_selector'
import { InventoryForm } from './components/forms/inventory_form'
import { AppointmentForm } from './components/forms/appointment_form'
import { useAppointments } from './hooks/use_appointments'
import { useBranch } from './contexts/branch.context'
import { useAuth } from './contexts/auth.context'
import { LoginPage } from './pages/login_page'

/**
 * Vista principal de la aplicación.
 * Actúa como "Layout Protegido": si no hay usuario, muestra Login.
 */
export const App = () => {
  // Obtenemos el estado de autenticación
  const { is_authenticated, user, logout } = useAuth()
  const { activeBranch } = useBranch()
  
  // Consumimos citas (ahora vendrán del backend real)
  const { data: appointments = [], isLoading } = useAppointments()

  // 1. BLOQUEO DE SEGURIDAD:
  // Si NO está autenticado, mostramos Login y detenemos la renderización del dashboard.
  if (!is_authenticated) {
    return <LoginPage />
  }

  // 2. DASHBOARD (Solo visible si hay sesión):
  return (
    <main className="app-shell">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Agenda Cinco Estrellas</h1>
          <p className="subtitle">Bienvenido, {user?.nombre}</p>
        </div>
        <button 
          onClick={logout} 
          style={{ 
            padding: '0.5rem 1rem', 
            cursor: 'pointer',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          Salir
        </button>
      </header>

      {/* Sección de Selección de Sucursal */}
      <section className="panel" style={{ marginTop: '1rem' }}>
        <BranchSelector />
        {activeBranch ? (
          <p className="subtitle" style={{ marginTop: '0.5rem' }}>
            Operando en: <strong>{activeBranch.nombre}</strong>
          </p>
        ) : (
          <p className="subtitle">Cargando sucursales...</p>
        )}
      </section>

      <section className="panel">
        <h2>Citas por sucursal</h2>
        {isLoading ? (
          <p>Cargando citas...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{new Date(appointment.fechaHora).toLocaleString()}</td>
                    <td>{appointment.servicio}</td>
                    <td>{appointment.cliente}</td>
                    <td>{appointment.estado}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No hay citas registradas en esta sucursal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Modelo de inventario</h2>
        <InventoryForm />
      </section>
      <section className="panel">
        <h2>Agendar Cita</h2> 
        {/* Reemplazamos el InventoryForm por el nuevo formulario de citas */}
        <AppointmentForm />
      </section>
      
      {/* Opcional: Dejamos el InventoryForm en su propia sección por ahora */}
      <section className="panel">
        <h2>Modelo de inventario (Placeholder)</h2>
        <InventoryForm />
      </section>
    </main>
  )
}

export default App