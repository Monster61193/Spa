import { useAuth } from '../../contexts/auth.context'
import { ThemeToggle } from '../ui/theme_toggle'

/**
 * Componente Header estilo "Admin Dashboard".
 * Incluye navegación izquierda, búsqueda y notificaciones a la derecha.
 */
export const Header = () => {
  const { logout } = useAuth()

  return (
    <header className="admin-header">
      {/* SECCIÓN IZQUIERDA: Menú y Links */}
      <div className="header-left">
        <button className="icon-btn" title="Menú">
          ☰ {/* Icono de hamburguesa */}
        </button>
        <span className="nav-link">Home</span>
        <span className="nav-link">Contact</span>
      </div>

      {/* SECCIÓN DERECHA: Herramientas y Perfil */}
      <div className="header-right">
        
        {/* Búsqueda */}
        <button className="icon-btn" title="Buscar">
          🔍
        </button>

        {/* Chat / Mensajes */}
        <button className="icon-btn" title="Mensajes">
          💬
          <span className="badge badge-danger">3</span>
        </button>

        {/* Notificaciones */}
        <button className="icon-btn" title="Notificaciones">
          🔔
          <span className="badge">15</span>
        </button>

        {/* Pantalla completa (Simulado) */}
        <button className="icon-btn" title="Pantalla Completa">
          ⛶
        </button>

        {/* Separador visual */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

        {/* Toggle de Tema (Nuestra funcionalidad personalizada) */}
        <ThemeToggle />

        {/* Botón Salir */}
        <button 
          onClick={logout}
          style={{
            fontSize: '0.9rem',
            color: '#ef4444',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Salir
        </button>
      </div>
    </header>
  )
}