import { useAuth } from '../../contexts/auth.context';
import { ThemeToggle } from '../ui/theme_toggle';

/**
 * Header simplificado con información de usuario y tema.
 */
export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      {/* IZQUIERDA: Menú y Título */}
      <div className="header-left">
        <button className="icon-btn" title="Menú">
          ☰
        </button>
        <span className="nav-link" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
          DANAE SPA
        </span>
      </div>

      {/* DERECHA: Usuario y Controles (Eliminados Buscar y Pantalla Completa) */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Información del Usuario (Añadido) */}
        <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.nombre || 'Administrador'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
        </div>

        {/* Separador */}
        <div
          className="header-separator"
          style={{ width: '1px', height: '20px', backgroundColor: 'var(--text-secondary)' }}
        ></div>

        {/* Toggle Tema */}
        <ThemeToggle />

        {/* Logout */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="btn-logout" // Usar una clase para styling en CSS
          style={{
            fontSize: '0.9rem',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginLeft: '0.5rem',
          }}
        >
          Salir
        </button>
      </div>
    </header>
  );
};
