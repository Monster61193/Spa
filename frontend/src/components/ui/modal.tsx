import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Propiedades para controlar el Modal.
 */
type ModalProps = {
  is_open: boolean
  on_close: () => void
  children: ReactNode
  title?: string
}

/**
 * Componente Modal mejorado usando React Portals.
 * * Utiliza createPortal para renderizar el contenido directamente en el body,
 * evitando problemas de z-index y superposición con el layout principal.
 *
 * @param props - Configuración del modal.
 */
export const Modal = ({ is_open, on_close, children, title }: ModalProps) => {
  // Estado para asegurar que solo renderizamos en el cliente (evita errores de hidratación)
  const [mounted, set_mounted] = useState(false)

  useEffect(() => {
    set_mounted(true)
    return () => set_mounted(false)
  }, [])

  /**
   * Efecto para bloquear el scroll y escuchar la tecla Escape.
   */
  useEffect(() => {
    const handle_escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        on_close()
      }
    }
    
    if (is_open) {
      document.addEventListener('keydown', handle_escape)
      document.body.style.overflow = 'hidden' // Congela el fondo
    }

    return () => {
      document.removeEventListener('keydown', handle_escape)
      document.body.style.overflow = 'unset' // Libera el fondo
    }
  }, [is_open, on_close])

  // Si no está abierto o no se ha montado, no renderizamos nada
  if (!is_open || !mounted) return null

  // El contenido del modal (Overlay + Caja)
  const modal_content = (
    <div className="modal-overlay" onClick={on_close}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <button 
          className="modal-close" 
          onClick={on_close}
          aria-label="Cerrar modal"
        >
          &times;
        </button>
        
        {title && <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{title}</h2>}
        
        {children}
      </div>
    </div>
  )

  // MAGIA: En lugar de devolver el JSX, lo "teletransportamos" al body
  return createPortal(modal_content, document.body)
}