import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentForm } from './appointment_form';
import { api_client } from '../../api/api_client';

/**
 * =============================================================================
 * SECCIÓN DE MOCKS (Simulacros)
 * =============================================================================
 * Simulamos todas las dependencias externas del componente para aislar la prueba.
 * Esto garantiza que probamos la lógica del formulario y no la red o la base de datos.
 */

// 1. Mock de la API (Axios): Evitamos llamadas reales al backend.
vi.mock('../../api/api_client', () => ({
  api_client: { post: vi.fn() },
}));

// 2. Mock de Contextos: Simulamos un usuario logueado y una sucursal activa.
vi.mock('../../contexts/auth.context', () => ({
  useAuth: () => ({ user: { id: 'admin-1' } }),
}));

vi.mock('../../contexts/branch.context', () => ({
  useBranch: () => ({ activeBranch: { id: 'suc-1' } }),
}));

// 3. Mock de Hooks de Negocio (Datos):
// Simulamos la respuesta de los catálogos para llenar los selectores.

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 }],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_clients', () => ({
  useClients: () => ({
    data: [{ id: 'cli-1', nombre: 'Juan Cliente' }],
    isLoading: false,
  }),
}));

// --- NUEVO MOCK (Sprint 3): Empleados ---
// Necesario para renderizar el selector "Atiende (Opcional)"
vi.mock('../../hooks/use_employees', () => ({
  useEmployees: () => ({
    data: [
      { empleado_id: 'emp-1', nombre: 'Ana Estilista' },
      { empleado_id: 'emp-2', nombre: 'Pedro Masajista' },
    ],
    isLoading: false,
  }),
}));

/**
 * =============================================================================
 * SUITE DE PRUEBAS: AppointmentForm
 * =============================================================================
 */
describe('AppointmentForm Component (Sprint 3 Update)', () => {
  // Limpiamos los espías (spies) antes de cada test para evitar contaminación entre pruebas.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * CASO DE PRUEBA 1: Flujo Completo con Asignación de Empleado.
   * Verifica que si el usuario selecciona un empleado, este ID se envíe al backend.
   */
  it('permite seleccionar un empleado y lo envía en el payload junto con onSuccess', async () => {
    // ARRANGE (Preparación)
    const on_success_mock = vi.fn(); // Espía para el callback de éxito
    // Simulamos que el backend responde OK (201 Created)
    (api_client.post as any).mockResolvedValue({ data: { ok: true } });

    render(<AppointmentForm onSuccess={on_success_mock} />);

    // ACT (Acciones del Usuario)

    // 1. Seleccionar Cliente
    // Buscamos por el texto del label asociado al select (accesibilidad)
    fireEvent.change(screen.getByLabelText(/Cliente/i), { target: { value: 'cli-1' } });

    // 2. Agregar Servicio al Carrito
    // Primero seleccionamos el servicio en el dropdown
    fireEvent.change(screen.getByLabelText(/Agregar Servicios/i), { target: { value: 'srv-1' } });
    // Luego hacemos clic en el botón "+" para agregarlo a la lista visual
    fireEvent.click(screen.getByText('+'));

    // 3. Definir Fecha y Hora
    fireEvent.change(screen.getByLabelText(/Fecha y Hora/i), { target: { value: '2025-12-25T10:00' } });

    // 4. Seleccionar Empleado (NUEVO SPRINT 3)
    // Buscamos el selector por su etiqueta visual "Atiende (Opcional)"
    const select_empleado = screen.getByLabelText(/Atiende/i);
    expect(select_empleado).toBeInTheDocument(); // Verificación visual
    // Simulamos la selección de "Ana Estilista" (ID: emp-1)
    fireEvent.change(select_empleado, { target: { value: 'emp-1' } });

    // 5. Enviar Formulario
    const btn_confirmar = screen.getByRole('button', { name: /Confirmar Cita/i });
    fireEvent.click(btn_confirmar);

    // ASSERT (Verificaciones)
    // Usamos waitFor porque la llamada a la API es asíncrona dentro del componente
    await waitFor(() => {
      // A. Verificamos que se llamó a la ruta correcta con el payload correcto
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({
          usuario_id: 'cli-1',
          servicios_ids: ['srv-1'],
          // Verificación CRÍTICA: El empleado seleccionado debe estar presente
          empleado_id: 'emp-1',
        }),
      );

      // B. Verificamos que se ejecutó la inversión de control (IoC)
      expect(on_success_mock).toHaveBeenCalled();
    });
  });

  /**
   * CASO DE PRUEBA 2: Flujo sin Asignación de Empleado (Opcional).
   * Verifica que el sistema sea robusto y permita crear citas sin asignar responsable.
   */
  it('envía payload sin empleado (undefined) si se deja la opción por defecto', async () => {
    // ARRANGE
    (api_client.post as any).mockResolvedValue({ data: { ok: true } });
    render(<AppointmentForm />); // Renderizamos sin onSuccess para probar el caso base

    // ACT (Llenado de datos mínimos requeridos)
    fireEvent.change(screen.getByLabelText(/Cliente/i), { target: { value: 'cli-1' } });
    fireEvent.change(screen.getByLabelText(/Agregar Servicios/i), { target: { value: 'srv-1' } });
    fireEvent.click(screen.getByText('+'));
    fireEvent.change(screen.getByLabelText(/Fecha y Hora/i), { target: { value: '2025-12-25T10:00' } });

    // NOTA: Intencionalmente omitimos interactuar con el selector de Empleado
    // para dejarlo en su valor por defecto ("-- Cualquiera --" -> valor vacío).

    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Cita/i }));

    // ASSERT
    await waitFor(() => {
      // Verificamos que el payload se construye correctamente incluso sin empleado
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({
          usuario_id: 'cli-1',
          // Al ser opcional en el schema Zod y undefined en la lógica,
          // el backend debe recibirlo así o no recibir la key.
          // Aquí esperamos 'undefined' que es lo que enviamos en el onSubmit.
          empleado_id: undefined,
        }),
      );
    });
  });
});
