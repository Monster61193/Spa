import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';

// --- MOCKS ---

// 1. Auth & Branch Contexts
vi.mock('./contexts/auth.context', () => ({
  useAuth: () => ({
    is_authenticated: true,
    user: { nombre: 'Admin' },
    logout: vi.fn(),
  }),
}));

vi.mock('./contexts/branch.context', () => ({
  useBranch: () => ({
    activeBranch: { id: 'suc-1', nombre: 'Principal' },
    branches: [{ id: 'suc-1', nombre: 'Principal' }],
    isLoading: false,
    setActiveBranch: vi.fn(),
  }),
}));

// 2. API Client (Para espiar las llamadas POST)
vi.mock('./api/api_client', () => ({
  api_client: {
    post: vi.fn(),
    get: vi.fn(), // Por si acaso
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// 3. Datos de Citas (Simulamos una cita pendiente)
vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({
    data: [
      {
        id: 'cita-pendiente-1',
        fechaHora: '2025-10-25T10:00:00Z',
        servicio: 'Masaje',
        cliente: 'Juan',
        estado: 'pendiente',
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// 4. Componentes Hijos (Para aislar App)
vi.mock('./components/forms/appointment_form', () => ({
  AppointmentForm: () => <div data-testid="appointment-form">Formulario Mock</div>,
}));
vi.mock('./components/forms/inventory_form', () => ({
  InventoryForm: () => <div>Inventario Mock</div>,
}));
vi.mock('./components/layout/header', () => ({
  Header: () => <div>Header Mock</div>,
}));

describe('App Component - Flujos Críticos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Muestra modal de nueva cita al hacer clic en el botón', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('+ Nueva Cita'));
    await waitFor(() => {
      expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
    });
  });

  it('Ejecuta el flujo completo de cierre de cita (Confirmación -> Éxito)', async () => {
    // Configurar el mock para que la API responda éxito
    (api_client.post as any).mockResolvedValueOnce({ data: { mensaje: 'Cierre exitoso' } });

    render(<App />);

    // 1. Buscar el botón de cerrar en la tabla (para la cita pendiente)
    const btnCerrar = screen.getByText('Cerrar / Cobrar');
    expect(btnCerrar).toBeInTheDocument();

    // 2. Clic en Cerrar -> Debe abrir Modal de Confirmación
    fireEvent.click(btnCerrar);

    // Buscamos texto clave del modal de confirmación
    expect(await screen.findByText('¿Estás seguro de cerrar esta cita?')).toBeInTheDocument();
    expect(screen.getByText('Sí, Confirmar')).toBeInTheDocument();

    // 3. Clic en Confirmar -> Debe llamar a la API
    fireEvent.click(screen.getByText('Sí, Confirmar'));

    await waitFor(() => {
      // Verificar que se llamó al endpoint correcto con el ID correcto
      expect(api_client.post).toHaveBeenCalledWith('/appointments/close', { citaId: 'cita-pendiente-1' });
    });

    // 4. Verificar que aparece el Modal de Feedback (Éxito)
    // El título que definimos en App.tsx para éxito
    expect(await screen.findByText('🎉 ¡Cita Cerrada!')).toBeInTheDocument();
  });
});
