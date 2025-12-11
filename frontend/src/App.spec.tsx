import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/theme.context';

// --- MOCKS ---

// 1. Auth & Branch
vi.mock('./contexts/auth.context', () => ({
  useAuth: () => ({
    is_authenticated: true,
    user: { nombre: 'Admin', email: 'admin@test.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('./contexts/branch.context', () => ({
  useBranch: () => ({
    activeBranch: { id: 'branch-1', nombre: 'Sucursal Principal' },
    branches: [{ id: 'branch-1', nombre: 'Sucursal Principal' }],
    isLoading: false,
    setActiveBranch: vi.fn(),
  }),
}));

// 2. API Client
vi.mock('./api/api_client', () => ({
  api_client: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// 3. Hooks de Negocio (MOCK GLOBAL con 2 Citas)
vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({
    data: [
      // Cita 1: Carlos (Sin anticipo)
      {
        id: 'cita-1',
        fechaHora: '2025-10-25T18:00:00',
        servicio: 'Corte Caballero',
        cliente: 'Carlos Cliente',
        empleado: 'No asignado',
        empleado_id: null,
        estado: 'pendiente',
        total: 250,
        anticipo: 0,
        servicios_items: [{ id: 'srv-1', nombre: 'Corte', precio: 250 }],
      },
      // Cita 2: Lucía (Con anticipo)
      {
        id: 'cita-anticipo-1',
        fechaHora: '2025-10-26T10:00:00',
        servicio: 'Paquete Novia',
        cliente: 'Lucía Méndez',
        empleado: 'No asignado',
        empleado_id: null,
        estado: 'pendiente',
        total: 1000,
        anticipo: 200,
        servicios_items: [{ id: 'srv-2', nombre: 'Paquete Novia', precio: 1000 }],
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
  useEditAppointment: () => ({ mutate: vi.fn(), isLoading: false }),
  useCancelAppointment: () => ({ mutate: vi.fn(), isLoading: false }),
}));

vi.mock('./hooks/use_inventory', () => ({
  use_inventory: () => ({ data: [], isLoading: false }),
}));

vi.mock('./hooks/use_services', () => ({
  useServices: () => ({ data: [], isLoading: false }),
}));

vi.mock('./hooks/use_employees', () => ({
  useEmployees: () => ({
    data: [{ empleado_id: 'emp-1', nombre: 'Barbero Juan' }],
    isLoading: false,
  }),
}));

vi.mock('./hooks/use_mutate_inventory', () => ({
  useMutateInventory: () => ({ create_material: {}, restock_material: {} }),
}));

vi.mock('./hooks/use_promotions', () => ({
  usePromotions: () => ({
    data: [{ id: 'promo-1', nombre: 'Verano', descuento: 10, tipo_alcance: 'Global' }],
    isLoading: false,
  }),
}));

// Helper render
const renderWithClient = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{component}</ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('App Component - Flujos Críticos (Sprint 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * TEST 1: Cita Normal (Sin anticipo)
   */
  it('Flow: Cerrar Cita con Asignación de Empleado (Ticket Check)', async () => {
    // ARRANGE
    (api_client.post as any).mockResolvedValue({
      data: { mensaje: 'Venta procesada con éxito' },
    });

    renderWithClient(<App />);

    // 1. Abrir Modal de Cierre para "Carlos Cliente"
    const filaCarlos = screen.getByText('Carlos Cliente').closest('tr');
    expect(filaCarlos).toBeInTheDocument();

    const btnCerrar = within(filaCarlos as HTMLElement).getByText('Cerrar');
    fireEvent.click(btnCerrar);

    // 2. Verificar Modal
    const modalTitle = await screen.findByText('Confirmar Cierre de Venta');
    expect(modalTitle).toBeInTheDocument();

    const modalContent = modalTitle.closest('.modal-content') as HTMLElement;

    // 3. Verificar contenido del Ticket
    expect(within(modalContent).getByText(/Carlos Cliente/i)).toBeInTheDocument();

    // --- CORRECCIÓN AQUÍ ---
    // Usamos getAllByText porque el precio aparece en la lista de items y en el total
    const precios = within(modalContent).getAllByText(/\$250/i);
    expect(precios.length).toBeGreaterThan(0);
    expect(precios[0]).toBeInTheDocument();
    // -----------------------

    // 4. Seleccionar Empleado
    const selectComision = within(modalContent).getByLabelText(/Asignar Comisión a/i);
    fireEvent.change(selectComision, { target: { value: 'emp-1' } });

    // 5. Confirmar Venta
    const btnConfirmar = within(modalContent).getByText('Confirmar Venta');
    fireEvent.click(btnConfirmar);

    // 6. Verificar API
    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments/close',
        expect.objectContaining({
          citaId: 'cita-1',
          empleadoId: 'emp-1',
        }),
      );
    });

    // 7. Feedback
    expect(await screen.findByText('🎉 ¡Cita Cerrada!')).toBeInTheDocument();
  });

  /**
   * TEST 2: Cita con Anticipo
   */
  it('Flow: Cerrar Cita CON ANTICIPO (Verifica cálculo de resta en Ticket)', async () => {
    // ARRANGE
    (api_client.post as any).mockResolvedValue({
      data: { mensaje: 'Venta procesada con éxito' },
    });

    renderWithClient(<App />);

    // 1. Abrir Modal para "Lucía Méndez"
    const filaLucia = screen.getByText('Lucía Méndez').closest('tr');
    const btnCerrar = within(filaLucia as HTMLElement).getByText('Cerrar');
    fireEvent.click(btnCerrar);

    // 2. Esperar al modal
    const modalTitle = await screen.findByText('Confirmar Cierre de Venta');
    const modalContent = modalTitle.closest('.modal-content') as HTMLElement;

    // 3. VERIFICACIÓN MATEMÁTICA
    expect(within(modalContent).getByText('Anticipo / Seña')).toBeInTheDocument();
    expect(within(modalContent).getByText('-$200')).toBeInTheDocument();
    expect(within(modalContent).getByText('Restante a Cobrar')).toBeInTheDocument();
    expect(within(modalContent).getByText('$800')).toBeInTheDocument();

    // 4. Confirmar
    const btnConfirmar = within(modalContent).getByText('Confirmar Venta');
    expect(btnConfirmar).toBeEnabled();

    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments/close',
        expect.objectContaining({ citaId: 'cita-anticipo-1' }),
      );
    });
  });
});
