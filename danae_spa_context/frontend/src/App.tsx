import { BranchSelector } from './components/branch_selector/branch_selector'
import { InventoryForm } from './components/forms/inventory_form'
import { useAppointments } from './hooks/use_appointments'
import { useBranch } from './contexts/branch.context'

/**
 * Vista inicial con selector de sucursal e información clave de citas.
 */
export const App = () => {
  const { activeBranch } = useBranch()
  const { data: appointments = [], isLoading } = useAppointments()

  return (
    <main className="app-shell">
      <header>
        <h1>Agenda Cinco Estrellas</h1>
        <BranchSelector />
        {activeBranch ? (
          <p className="subtitle">Sucursal activa: {activeBranch.nombre}</p>
        ) : (
          <p className="subtitle">Cargando sucursal...</p>
        )}
      </header>

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
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{new Date(appointment.fechaHora).toLocaleString()}</td>
                  <td>{appointment.servicio}</td>
                  <td>{appointment.cliente}</td>
                  <td>{appointment.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Modelo de inventario</h2>
        <InventoryForm />
      </section>
    </main>
  )
}

export default App
