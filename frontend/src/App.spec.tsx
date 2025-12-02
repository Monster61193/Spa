import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { api_client } from './api/api_client';

/**
 * =============================================================================
 * MOCKS GLOBALES
 * =============================================================================
 * Simulamos todos los módulos externos para aislar el componente <App />.
 * Esto convierte a la prueba en un "Test de Integración de UI" puro,
 * validando que la interfaz reaccione correctamente a los datos (sin backend real).
 */

// 1. Contexto de Autenticación
// Simulamos un usuario "Admin" logueado para saltarnos la pantalla de Login.
vi.mock('./contexts/auth.context', () => ({
  useAuth: () => ({
    is_authenticated: true,
    user: { nombre: 'Admin Test', email: 'admin@test.com' },
    logout: vi.fn(),
  }),
}));

// 2. Contexto de Sucursal
// Simulamos que ya existe una sucursal activa seleccionada.
vi.mock('./contexts/branch.context', () => ({
  useBranch: () => ({
    activeBranch: { id: 'branch-1', nombre: 'Sucursal Principal' },
    branches: [{ id: 'branch-1', nombre: 'Sucursal Principal' }],
    isLoading: false,
    setActiveBranch: vi.fn(),
  }),
}));

// 3. Cliente API (Axios)
// Espiamos las llamadas POST para verificar que el botón "Cerrar" envíe los datos correctos.
vi.mock('./api/api_client', () => ({
  api_client: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// 4. Hooks de Negocio (Datos)
// Mockeamos los datos que alimentan las tablas para no depender del backend.

vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({
    data: [
      {
        id: 'cita-test-1',
        fechaHora: '2025-10-25T10:00:00Z',
        servicio: 'Masaje Relajante',
        cliente: 'Juan Pérez',
        estado: 'pendiente', // Estado crítico para habilitar el botón de cierre
      },
    ],
    isLoading: false,
    refetch: vi.fn(), // Espía para verificar si la tabla se recarga tras una acción
  }),
}));

// ¡IMPORTANTE! Mock del nuevo hook de inventario
// Si olvidamos esto, el test fallaría al intentar renderizar <InventoryTable />
vi.mock('./hooks/use_inventory', () => ({
  use_inventory: () => ({
    data: [
      {
        materialId: 'mat-1',
        material: 'Aceite Esencial',
        unidad: 'ml',
        stockActual: 10,
        stockMinimo: 20,
        alerta: true, // Forzamos una alerta para verificar que la UI la muestre
      },
    ],
    isLoading: false,
  }),
}));

// 5. Componentes Hijos Complejos
// "Apagamos" los formularios internos para no probar su lógica de validación aquí.
// Nos interesa probar la orquestación de App.tsx, no el detalle del formulario.
vi.mock('./components/forms/appointment_form', () => ({
  AppointmentForm: () => <div data-testid="mock-appointment-form">Formulario Cita Mock</div>,
}));

vi.mock('./components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header Admin</div>,
}));

/**
 * =============================================================================
 * SUITE DE PRUEBAS
 * =============================================================================
 */
describe('App Component - Flujos de Integración', () => {
  /**
   * Limpieza antes de cada test para evitar contaminación de estado (ej. llamadas previas a spies).
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Caso de Prueba 1: Renderizado Inicial
   * Verifica que el dashboard cargue las secciones principales y los datos mockeados.
   */
  it('debe renderizar el dashboard con la tabla de citas e inventario', async () => {
    // ARRANGE (Preparación)
    render(<App />);

    // ASSERT (Verificación)
    // 1. Verificar Header y Bienvenida
    expect(screen.getByText('Header Admin')).toBeInTheDocument();
    expect(screen.getByText(/Bienvenido al Panel/i)).toBeInTheDocument();

    // 2. Verificar Datos de Citas (Mock)
    expect(screen.getByText('Masaje Relajante')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

    // 3. Verificar Datos de Inventario (Mock)
    // Esto confirma que use_inventory se integró correctamente
    expect(screen.getByText('Aceite Esencial')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Stock actual
  });

  /**
   * Caso de Prueba 2: Apertura de Modal
   * Verifica la interacción usuario-interfaz para iniciar procesos.
   */
  it('debe abrir el modal de "Nueva Cita" al hacer clic en el botón', async () => {
    // ARRANGE
    render(<App />);
    const boton_nueva_cita = screen.getByText('+ Nueva Cita');

    // ACT (Acción)
    fireEvent.click(boton_nueva_cita);

    // ASSERT
    // Esperamos a que el modal (y su contenido mockeado) aparezca en el DOM
    await waitFor(() => {
      expect(screen.getByTestId('mock-appointment-form')).toBeInTheDocument();
    });
  });

  /**
   * Caso de Prueba 3: Flujo Crítico de Cierre de Cita
   * Simula el "Happy Path": Clic en cerrar -> Confirmar en Modal -> Éxito.
   */
  it('debe ejecutar el cierre de cita tras confirmar en el modal de seguridad', async () => {
    // ARRANGE
    // Simulamos que el backend responde éxito al endpoint de cierre
    (api_client.post as any).mockResolvedValueOnce({
      data: { mensaje: 'Operación exitosa' },
    });

    render(<App />);

    // 1. Localizar el botón de acción en la fila de la cita pendiente
    const boton_cerrar = screen.getByText('Cerrar / Cobrar');
    expect(boton_cerrar).toBeInTheDocument();

    // ACT - Paso 1: Solicitar cierre
    fireEvent.click(boton_cerrar);

    // ASSERT - Paso 1
    // El modal de confirmación debe aparecer (NO el alert nativo)
    expect(await screen.findByText('Confirmar Acción')).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de cerrar esta cita?/i)).toBeInTheDocument();

    // ACT - Paso 2: Confirmar acción
    const boton_confirmar = screen.getByText('Sí, Confirmar');
    fireEvent.click(boton_confirmar);

    // ASSERT - Paso 2
    // Verificamos que se llamó a la API con los parámetros correctos
    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith('/appointments/close', { citaId: 'cita-test-1' });
    });

    // Verificamos que aparece el Modal de Feedback (Éxito)
    expect(await screen.findByText('🎉 ¡Cita Cerrada!')).toBeInTheDocument();
  });
});
