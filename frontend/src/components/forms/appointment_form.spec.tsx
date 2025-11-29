import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppointmentForm } from './appointment_form'

// MOCKS: Simulamos todos los hooks externos para aislar el formulario
vi.mock('../../contexts/auth.context', () => ({
  useAuth: () => ({ user: { id: 'admin-1', nombre: 'Admin' } })
}))

vi.mock('../../contexts/branch.context', () => ({
  useBranch: () => ({ activeBranch: { id: 'suc-1', nombre: 'Principal' } })
}))

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 }],
    isLoading: false
  })
}))

vi.mock('../../hooks/use_clients', () => ({
  useClients: () => ({
    data: [{ id: 'cli-1', nombre: 'Juan Perez', email: 'juan@mail.com' }],
    isLoading: false
  })
}))

describe('AppointmentForm Component', () => {
  it('renderiza correctamente los selectores de cliente y servicio', async () => {
    // 1. Renderizar
    render(<AppointmentForm />)

    screen.debug()
    // 2. Verificar textos clave
    expect(await screen.findByText(/Agendar Nueva Cita/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cliente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Servicio/i)).toBeInTheDocument()
    
    // 3. Verificar que los datos mockeados aparecen en las opciones
    expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument()
    expect(screen.getByText(/Masaje/i)).toBeInTheDocument()
  })

  it('muestra errores de validación si se intenta enviar vacío', async () => {
    render(<AppointmentForm />)

    // 1. Buscar botón y clickear
    const boton = screen.getByRole('button', { name: /Agendar Cita/i })
    fireEvent.click(boton)

    // 2. Esperar errores de Zod (son asíncronos)
    const error_cliente = await screen.findByText(/Debes seleccionar un cliente/i)
    const error_servicio = await screen.findByText(/Debes seleccionar un servicio/i)

    expect(error_cliente).toBeInTheDocument()
    expect(error_servicio).toBeInTheDocument()
  })
})