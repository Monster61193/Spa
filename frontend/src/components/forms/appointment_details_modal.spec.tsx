import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentDetailsModal } from './appointment_details_modal';
import { Appointment } from '../../hooks/use_appointments';

// --- MOCKS ---
vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 }],
  }),
}));

vi.mock('../../hooks/use_employees', () => ({
  useEmployees: () => ({
    data: [
      { empleado_id: 'emp-1', nombre: 'Ana Estilista' },
      { empleado_id: 'emp-2', nombre: 'Pedro Masajista' },
    ],
  }),
}));

const mock_mutate_edit = vi.fn();
const mock_mutate_cancel = vi.fn();

vi.mock('../../hooks/use_appointments', () => ({
  useEditAppointment: () => ({ mutate: mock_mutate_edit, isLoading: false }),
  useCancelAppointment: () => ({ mutate: mock_mutate_cancel, isLoading: false }),
}));

// Mock Data
const mock_cita: Appointment = {
  id: 'uuid-123',
  fechaHora: '2025-12-02T17:30:00',
  servicio: 'Masaje',
  cliente: 'María Cliente',
  empleado: 'No asignado', // Estado inicial
  empleado_id: null,
  estado: 'pendiente',
  total: 500,
  anticipo: 0,
  cliente_id: 'cli-001',
  servicios_items: [{ id: 'srv-1', nombre: 'Masaje', precio: 500 }],
  restante: 0
};

describe('AppointmentDetailsModal (Sprint 3 UI)', () => {
  const handle_close = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Modo Lectura: Muestra campo "Atendido por"', () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={handle_close} appointment={mock_cita} />);

    // Verificar labels
    expect(screen.getByText('Atendido por')).toBeInTheDocument();
    // Verificar valor por defecto
    expect(screen.getByText('No asignado')).toBeInTheDocument();
  });

  it('Modo Edición: Permite cambiar Empleado (Inline Edit)', async () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={handle_close} appointment={mock_cita} />);

    // 1. Entrar a edición
    // Nota: El botón cambió de "Editar Servicios" a "Editar Cita" o "Modificar Cita"
    // Buscamos el botón principal que habilita la edición
    const btnEditar = screen.getByRole('button', { name: /Editar Cita/i });
    fireEvent.click(btnEditar);

    // 2. Verificar que aparece el SELECTOR de empleado
    const selectEmpleado = screen.getByLabelText('Atendido por');

    expect(selectEmpleado).toBeInTheDocument();

    // 3. Cambiar empleado
    fireEvent.change(selectEmpleado, { target: { value: 'emp-2' } });

    // 4. Guardar cambios
    fireEvent.click(screen.getByText('Confirmar Cambios'));

    // 5. Verificar Payload
    await waitFor(() => {
      expect(mock_mutate_edit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-123',
          empleado_id: 'emp-2', // <--- Se envía el nuevo empleado
          servicios_ids: ['srv-1'], // Se mantienen los servicios
        }),
        expect.any(Object),
      );
    });
  });
});
