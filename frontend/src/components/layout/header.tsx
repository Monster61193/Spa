import { useAuth } from '../../contexts/auth.context';
import { ThemeToggle } from '../ui/theme_toggle';
import { BranchSelector } from '../branch_selector/branch_selector';

/**
 * Header con navegación, selector de sucursal centralizado y controles de usuario.
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

      {/* CENTRO: Selector de Sucursal */}
      {/* Usamos flex para centrar y alinear el texto con el select */}
      <div
        className="header-center"
        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}
      >
        {/* Texto Informativo */}
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            whiteSpace: 'nowrap', // Evita saltos de línea en pantallas pequeñas
          }}
        >
          Sucursal activa:
        </span>

        {/* Selector */}
        <div style={{ maxWidth: '250px', width: '100%' }}>
          <BranchSelector compact={true} />
        </div>
      </div>

      {/* DERECHA: Usuario y Controles */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.nombre || 'Administrador'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
        </div>

        <div
          className="header-separator"
          style={{ width: '1px', height: '20px', backgroundColor: 'var(--text-secondary)' }}
        ></div>

        <ThemeToggle />

        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="btn-logout"
          style={{
            fontSize: '0.9rem',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid transparent',
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
