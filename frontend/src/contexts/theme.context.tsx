import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggle_theme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Proveedor de Tema.
 * Gestiona el cambio de modo oscuro/claro y persiste la preferencia en localStorage.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Inicializamos leyendo de localStorage o preferencia del sistema
  const [theme, set_theme] = useState<Theme>(() => {
    const saved = localStorage.getItem('danae_theme')
    if (saved === 'dark' || saved === 'light') return saved
    // Si no hay guardado, miramos la preferencia del sistema operativo
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  /**
   * Efecto que aplica la clase al DOM real cuando cambia el estado.
   */
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('danae_theme', theme)
  }, [theme])

  const toggle_theme = () => {
    set_theme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle_theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook para consumir el tema actual.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}