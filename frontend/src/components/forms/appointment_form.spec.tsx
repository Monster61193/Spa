import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentForm } from './appointment_form';

// MOCKS (Mantienen los mismos datos que antes)
vi.mock('../../contexts/auth.context', () => ({
  useAuth: () => ({ user: { id: 'admin-1', nombre: 'Admin' } }),
}));

vi.mock('../../contexts/branch.context', () => ({
  useBranch: () => ({ activeBranch: { id: 'suc-1', nombre: 'Principal' } }),
}));

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 }],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_clients', () => ({
  useClients: () => ({
    data: [{ id: 'cli-1', nombre: 'Juan Perez', email: 'juan@mail.com' }],
    isLoading: false,
  }),
}));

describe('AppointmentForm Component', () => {
  it('renderiza correctamente los selectores de cliente y servicio', async () => {
    render(<AppointmentForm />);

    // CORRECCIÓN CLAVE: Usamos findByRole en lugar de findByText.
    // Esto es inmune a los saltos de línea que Prettier agrega en el HTML.
    expect(await screen.findByRole('heading', { name: /Agendar Nueva Cita/i })).toBeInTheDocument();

    // Verificamos etiquetas
    expect(screen.getByLabelText(/Cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Servicio/i)).toBeInTheDocument();

    // Verificamos opciones
    expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
    expect(screen.getByText(/Masaje/i)).toBeInTheDocument();
  });

  it('muestra errores de validación si se intenta enviar vacío', async () => {
    render(<AppointmentForm />);

    // Esperamos a que cargue el formulario antes de interactuar
    await screen.findByRole('heading', { name: /Agendar Nueva Cita/i });

    const boton = screen.getByRole('button', { name: /Agendar Cita/i });
    fireEvent.click(boton);

    const error_cliente = await screen.findByText(/Debes seleccionar un cliente/i);
    const error_servicio = await screen.findByText(/Debes seleccionar un servicio/i);

    expect(error_cliente).toBeInTheDocument();
    expect(error_servicio).toBeInTheDocument();
  });
});
