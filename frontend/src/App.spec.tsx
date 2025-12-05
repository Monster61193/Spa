import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * =============================================================================
 * MOCKS GLOBALES
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
// Simulamos una cita PENDIENTE para que aparezca el botón "Cerrar"
vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({
    data: [
      {
        id: 'cita-test-1',
        fechaHora: '2025-10-25T10:00:00Z',
        servicio: 'Masaje Relajante',
        cliente: 'Juan Pérez',
        estado: 'pendiente', // Vital para que se renderice el botón de cerrar
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

vi.mock('./hooks/use_services', () => ({
  useServices: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('./hooks/use_mutate_inventory', () => ({
  useMutateInventory: () => ({
    create_material: { mutate: vi.fn() },
    restock_material: { mutate: vi.fn() },
  }),
}));

// 5. Mocks de Componentes Hijos (para aislar App.tsx)
vi.mock('./components/forms/appointment_details_modal', () => ({
  AppointmentDetailsModal: () => <div data-testid="mock-details-modal" />,
}));

vi.mock('./components/forms/appointment_form', () => ({
  AppointmentForm: () => <div>Formulario Cita Mock</div>,
}));

vi.mock('./components/layout/header', () => ({
  Header: () => <div>Header Admin</div>,
}));

/**
 * =============================================================================
 * SUITE DE PRUEBAS DE INTEGRACIÓN
 * =============================================================================
 */

// Función helper para envolver el componente
const renderWithClient = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('App Component - Flujos Críticos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test existente (Apertura de detalles)
  it('abre el modal de detalles al hacer clic en "Detalle"', async () => {
    renderWithClient(<App />);
    const btnDetalle = screen.getByText(/Detalle/i);
    fireEvent.click(btnDetalle);
    expect(await screen.findByTestId('mock-details-modal')).toBeInTheDocument();
  });

  // --- NUEVO TEST CRÍTICO: CIERRE DE VENTA ---
  it('ejecuta el flujo completo de cierre de cita: Confirmación -> API -> Feedback', async () => {
    // ARRANGE: Simulamos respuesta exitosa del backend
    (api_client.post as any).mockResolvedValue({
      data: { mensaje: 'Venta procesada con éxito' },
    });

    renderWithClient(<App />);

    // 1. Identificar cita pendiente y hacer clic en "Cerrar"
    // Nota: El botón puede tener texto "Cerrar" o "..." si estuviera cargando, buscamos por texto inicial
    const btnCerrar = screen.getByText('Cerrar');
    expect(btnCerrar).toBeInTheDocument();

    fireEvent.click(btnCerrar);

    // 2. Verificar que aparece el Modal de Confirmación (Zona de seguridad)
    // Buscamos por el título del modal
    expect(await screen.findByText('Confirmar Acción')).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de cerrar esta cita?/i)).toBeInTheDocument();

    // 3. Confirmar la acción
    const btnConfirmar = screen.getByText('Sí, Confirmar');
    fireEvent.click(btnConfirmar);

    // 4. Verificar llamada a la API (Transacción)
    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments/close',
        expect.objectContaining({ citaId: 'cita-test-1' }),
      );
    });

    // 5. Verificar Modal de Feedback (Éxito)
    // El título cambia a "¡Cita Cerrada!" según tu lógica en App.tsx
    expect(await screen.findByText('🎉 ¡Cita Cerrada!')).toBeInTheDocument();

    // 6. Cerrar feedback
    const btnEntendido = screen.getByText('Entendido');
    fireEvent.click(btnEntendido);

    // El modal debe desaparecer
    await waitFor(() => {
      expect(screen.queryByText('🎉 ¡Cita Cerrada!')).not.toBeInTheDocument();
    });
  });
});
