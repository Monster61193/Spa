import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentForm } from './appointment_form';
import { api_client } from '../../api/api_client';

// --- MOCKS ---
vi.mock('../../api/api_client', () => ({
  api_client: { post: vi.fn() },
}));

vi.mock('../../contexts/auth.context', () => ({
  useAuth: () => ({ user: { id: 'admin-1' } }),
}));

vi.mock('../../contexts/branch.context', () => ({
  useBranch: () => ({ activeBranch: { id: 'suc-1' } }),
}));

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 }],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_clients', () => ({
  useClients: () => ({
    data: [{ id: 'cli-1', nombre: 'Juan' }],
    isLoading: false,
  }),
}));

describe('AppointmentForm Component (IoC Pattern)', () => {
  it('ejecuta onSuccess() en lugar de recargar la página al guardar', async () => {
    // ARRANGE
    const on_success_mock = vi.fn();
    (api_client.post as any).mockResolvedValue({ data: { ok: true } });

    render(<AppointmentForm onSuccess={on_success_mock} />);

    // 1. Llenar formulario
    fireEvent.change(screen.getByLabelText(/Cliente/i), { target: { value: 'cli-1' } });

    // Agregar servicio al carrito
    fireEvent.change(screen.getByLabelText(/Agregar Servicios/i), { target: { value: 'srv-1' } });
    fireEvent.click(screen.getByText('+'));

    // Fecha
    fireEvent.change(screen.getByLabelText(/Fecha y Hora/i), { target: { value: '2025-12-25T10:00' } });

    // ACT
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Cita/i }));

    // ASSERT
    await waitFor(() => {
      // Verificamos que se llamó a la API
      expect(api_client.post).toHaveBeenCalled();
      // Verificamos que se disparó el callback del padre (Inversión de Control)
      expect(on_success_mock).toHaveBeenCalled();
    });
  });
});
