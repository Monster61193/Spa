import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';

/**
 * =============================================================================
 * MOCKS GLOBALES (Actualizados)
 * =============================================================================
 */

// 1. Contexto de Autenticación
vi.mock('./contexts/auth.context', () => ({
  useAuth: () => ({
    is_authenticated: true,
    user: { nombre: 'Admin Test', email: 'admin@test.com' },
    logout: vi.fn(),
  }),
}));

// 2. Contexto de Sucursal
vi.mock('./contexts/branch.context', () => ({
  useBranch: () => ({
    activeBranch: { id: 'branch-1', nombre: 'Sucursal Principal' },
    branches: [{ id: 'branch-1', nombre: 'Sucursal Principal' }],
    isLoading: false,
    setActiveBranch: vi.fn(),
  }),
}));

// 3. Cliente API (Axios)
vi.mock('./api/api_client', () => ({
  api_client: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// 4. Hooks de Negocio
vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({
    data: [
      {
        id: 'cita-test-1',
        fechaHora: '2025-10-25T10:00:00Z',
        servicio: 'Masaje Relajante',
        cliente: 'Juan Pérez',
        estado: 'pendiente',
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('./hooks/use_inventory', () => ({
  use_inventory: () => ({
    data: [],
    isLoading: false,
  }),
}));

// 5. Mocks de Componentes Hijos
// Mockeamos el Modal de Detalles para verificar que App le pasa las props correctas
vi.mock('./components/forms/appointment_details_modal', () => ({
  AppointmentDetailsModal: ({ isOpen, appointment, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-details-modal">
        <h2>Detalles Mock</h2>
        <p>ID: {appointment?.id}</p>
        <button onClick={onClose}>Cerrar Mock</button>
      </div>
    ) : null,
}));

// Otros mocks UI
vi.mock('./components/forms/appointment_form', () => ({
  AppointmentForm: () => <div>Formulario Cita Mock</div>,
}));
vi.mock('./components/layout/header', () => ({
  Header: () => <div>Header Admin</div>,
}));

/**
 * =============================================================================
 * SUITE DE PRUEBAS
 * =============================================================================
 */
describe('App Component - Flujos de Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Caso de Prueba: Abrir Modal de Detalles (Nota punto 4)
   */
  it('abre el modal de detalles con la información correcta al hacer clic en "Detalle"', async () => {
    render(<App />);

    // 1. Verificar que la cita está en la tabla
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

    // 2. Buscar el botón "Detalle" específico de esa fila
    // Usamos closest('tr') para asegurar contexto si hubiera más filas
    const btnDetalle = screen.getByText(/Detalle/i);
    fireEvent.click(btnDetalle);

    // 3. Verificar que el modal (mockeado) se abre y recibe el ID correcto
    await waitFor(() => {
      expect(screen.getByTestId('mock-details-modal')).toBeInTheDocument();
      expect(screen.getByText('ID: cita-test-1')).toBeInTheDocument();
    });
  });

  /**
   * Caso de Prueba: Cerrar Modal de Detalles (Nota punto 5)
   */
  it('cierra el modal de detalles y limpia la selección', async () => {
    render(<App />);

    // 1. Abrir modal
    const btnDetalle = screen.getByText(/Detalle/i);
    fireEvent.click(btnDetalle);
    expect(screen.getByTestId('mock-details-modal')).toBeInTheDocument();

    // 2. Cerrar modal (simulando clic en botón interno del mock)
    const btnCerrar = screen.getByText('Cerrar Mock');
    fireEvent.click(btnCerrar);

    // 3. Verificar que desaparece del DOM
    await waitFor(() => {
      expect(screen.queryByTestId('mock-details-modal')).not.toBeInTheDocument();
    });
  });
});
