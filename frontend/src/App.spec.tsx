import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Importamos el ThemeProvider real o mockeado (el real es seguro porque es simple)
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

// 3. Hooks de Negocio (Datos Simulados)
vi.mock('./hooks/use_appointments', () => ({
  // Hook de lectura (usado por App.tsx)
  useAppointments: () => ({
    data: [
      {
        id: 'cita-1',
        fechaHora: '2025-10-25T18:00:00',
        servicio: 'Corte Caballero',
        cliente: 'Carlos Cliente',
        empleado: 'No asignado',
        empleado_id: null,
        estado: 'pendiente',
        total: 250,
        servicios_items: [{ id: 'srv-1', nombre: 'Corte', precio: 250 }],
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
  // Hooks de escritura (usados por AppointmentDetailsModal, hijo de App)
  useEditAppointment: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
  useCancelAppointment: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('./hooks/use_inventory', () => ({
  use_inventory: () => ({ data: [], isLoading: false }),
}));

vi.mock('./hooks/use_services', () => ({
  useServices: () => ({ data: [], isLoading: false }),
}));

// Mock de empleados para el selector del modal de cierre
vi.mock('./hooks/use_employees', () => ({
  useEmployees: () => ({
    data: [{ empleado_id: 'emp-1', nombre: 'Barbero Juan' }],
    isLoading: false,
  }),
}));

// Mocks de hijos complejos para simplificar (opcional, pero útil si no queremos testear sus internos)
// En este caso, queremos testear el flujo de cierre que vive en App.tsx, así que dejamos el Modal real.
vi.mock('./hooks/use_mutate_inventory', () => ({
  useMutateInventory: () => ({ create_material: {}, restock_material: {} }),
}));

// Helper para el QueryClient
const renderWithClient = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {' '}
        {/* <--- AÑADIDO: Proveedor de tema necesario para Header */}
        {component}
      </ThemeProvider>
    </QueryClientProvider>,
  );
};
describe('App Component - Flujos Críticos (Sprint 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Flow: Cerrar Cita con Asignación de Empleado (Ticket Check)', async () => {
    // ARRANGE
    (api_client.post as any).mockResolvedValue({
      data: { mensaje: 'Venta procesada con éxito' },
    });

    renderWithClient(<App />);

    // 1. Abrir Modal de Cierre
    const btnCerrar = screen.getByText('Cerrar');
    fireEvent.click(btnCerrar);

    // 2. Verificar que estamos en el Modal de Confirmación
    // Buscamos el título del modal primero para tener un ancla
    // --- CORRECCIÓN AQUÍ ---
    // En lugar de buscar en todo el documento, buscamos elementos visibles que correspondan al ticket.
    // Como hay duplicados (uno en la tabla de fondo y otro en el modal), usamos getAllByText
    // y verificamos que el texto esté presente en la UI.
    // Una forma robusta es verificar que el ticket se renderizó buscando su estructura.

    const clientesVisibles = screen.getAllByText(/Carlos Cliente/i);
    expect(clientesVisibles.length).toBeGreaterThanOrEqual(2); // Uno en tabla, uno en modal

    // Para el precio, también puede haber duplicados si la tabla muestra precios (no es el caso actual pero por seguridad)
    const precios = screen.getAllByText(/\$250/i);
    expect(precios.length).toBeGreaterThanOrEqual(1);

    // 4. VERIFICACIÓN DEL SELECTOR DE EMPLEADO (Nuevo Sprint 3)
    // Debe haber un select para asignar la comisión
    const selectComision = screen.getByLabelText(/Asignar Comisión a/i);
    expect(selectComision).toBeInTheDocument();

    // Simulamos seleccionar a "Barbero Juan"
    fireEvent.change(selectComision, { target: { value: 'emp-1' } });

    // 5. Confirmar Venta
    const btnConfirmar = screen.getByText('Confirmar Venta');
    fireEvent.click(btnConfirmar);

    // 6. ASSERT API Call
    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments/close',
        expect.objectContaining({
          citaId: 'cita-1',
          empleadoId: 'emp-1', // ¡Importante! Debe enviar el ID seleccionado
        }),
      );
    });

    // 7. Feedback
    expect(await screen.findByText('🎉 ¡Cita Cerrada!')).toBeInTheDocument();
  });
});
