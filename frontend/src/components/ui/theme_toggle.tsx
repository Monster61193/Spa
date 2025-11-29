import { useTheme } from '../../contexts/theme.context'

/**
 * Botón para alternar entre modo claro y oscuro.
 */
export const ThemeToggle = () => {
  const { theme, toggle_theme } = useTheme()

  return (
    <button
      onClick={toggle_theme}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        fontSize: '1.2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: '1rem',
        color: 'var(--text-primary)',
        transition: 'all 0.2s ease'
      }}
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}