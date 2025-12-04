import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentDetailsModal } from './appointment_details_modal';
// Importamos el tipo para asegurar que el mock cumpla el contrato
import { Appointment } from '../../hooks/use_appointments';

// --- 1. MOCKS DE HOOKS ---
vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [
      { id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 },
      { id: 'srv-2', nombre: 'Facial', precioBase: 800, duracionMinutos: 45 },
    ],
  }),
}));

const mock_mutate_edit = vi.fn();
const mock_mutate_cancel = vi.fn();

vi.mock('../../hooks/use_appointments', () => ({
  useEditAppointment: () => ({
    mutate: mock_mutate_edit,
    isLoading: false,
  }),
  useCancelAppointment: () => ({
    mutate: mock_mutate_cancel,
    isLoading: false,
  }),
}));

// --- 2. DATA MOCK CORREGIDA ---
// Cumple estrictamente con la interfaz Appointment
const mock_cita: Appointment = {
  id: 'uuid-123',
  fechaHora: '2025-12-02T17:30:00',
  servicio: 'Masaje',
  cliente: 'María Cliente',
  estado: 'pendiente',
  total: 500,
  // Agregamos el campo faltante requerido por el tipo
  cliente_id: 'cli-001',
  servicios_items: [{ id: 'srv-1', nombre: 'Masaje', precio: 500 }],
};

describe('AppointmentDetailsModal (Sprint 2 Features)', () => {
  const handle_close = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- PRUEBAS DE VISUALIZACIÓN ---
  it('renderiza correctamente en modo lectura', () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={handle_close} appointment={mock_cita} />);

    expect(screen.getByText('Detalle de Cita')).toBeInTheDocument();
    expect(screen.getByText('María Cliente')).toBeInTheDocument();
    expect(screen.getByText('Editar Servicios')).toBeInTheDocument();
  });

  // --- PRUEBAS DE FLUJO DE EDICIÓN ---
  it('entra en modo edición y permite guardar cambios', async () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={handle_close} appointment={mock_cita} />);

    // 1. Entrar a edición
    fireEvent.click(screen.getByText('Editar Servicios'));

    // 2. Verificar cambio de UI
    expect(screen.getByText('Modificar Servicios')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Cambios')).toBeInTheDocument();

    // 3. Verificar precarga (Smart Editing)
    // El botón de eliminar debe estar presente para el servicio precargado
    const botones_eliminar = screen.getAllByTitle('Eliminar servicio');
    expect(botones_eliminar).toHaveLength(1);

    // 4. Guardar cambios
    fireEvent.click(screen.getByText('Confirmar Cambios'));

    // 5. Verificar llamada al hook
    await waitFor(() => {
      expect(mock_mutate_edit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-123',
          servicios_ids: ['srv-1'],
        }),
        expect.any(Object),
      );
    });
  });

  // --- PRUEBAS DE FLUJO DE CANCELACIÓN ---
  it('maneja el flujo de cancelación con validación de motivo', async () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={handle_close} appointment={mock_cita} />);

    // 1. Abrir modal de cancelación
    fireEvent.click(screen.getByText('Cancelar Cita'));

    // 2. Verificar que aparece el textarea (placeholder regex insensible a mayúsculas)
    const input_motivo = screen.getByPlaceholderText(/ej: el cliente no pudo/i);
    expect(input_motivo).toBeInTheDocument();

    // 3. Intentar confirmar vacío (Validación)
    const btn_confirmar = screen.getByText('Confirmar Cancelación');
    expect(btn_confirmar).toBeDisabled();

    // 4. Escribir motivo válido
    fireEvent.change(input_motivo, { target: { value: 'El cliente no se presentó' } });
    expect(btn_confirmar).not.toBeDisabled();

    // 5. Ejecutar cancelación
    fireEvent.click(btn_confirmar);

    // 6. Verificar llamada al hook
    await waitFor(() => {
      expect(mock_mutate_cancel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'uuid-123',
          motivo: 'El cliente no se presentó',
        }),
        expect.any(Object),
      );
    });
  });
});
