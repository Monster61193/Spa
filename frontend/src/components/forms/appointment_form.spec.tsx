import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentForm } from './appointment_form';
import { api_client } from '../../api/api_client';

// --- MOCKS ---
// Mantenemos los mocks igual que antes, ya que la infraestructura no cambió.
vi.mock('../../api/api_client', () => ({
  api_client: {
    post: vi.fn(),
  },
}));

vi.mock('../../contexts/auth.context', () => ({
  useAuth: () => ({ user: { id: 'admin-1', nombre: 'Admin' } }),
}));

vi.mock('../../contexts/branch.context', () => ({
  useBranch: () => ({ activeBranch: { id: 'suc-1', nombre: 'Principal' } }),
}));

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [
      { id: 'srv-1', nombre: 'Masaje', precioBase: 500, duracionMinutos: 60 },
      { id: 'srv-2', nombre: 'Facial', precioBase: 800, duracionMinutos: 45 },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_clients', () => ({
  useClients: () => ({
    data: [{ id: 'cli-1', nombre: 'Juan Perez', email: 'juan@mail.com' }],
    isLoading: false,
  }),
}));

describe('AppointmentForm Component', () => {
  it('permite agregar múltiples servicios al carrito y enviarlos', async () => {
    // ARRANGE
    (api_client.post as any).mockResolvedValue({ data: { id: 'cita-nueva' } });

    // Mock de window.location.reload para entorno de test (jsdom)
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
    window.alert = vi.fn(); // Silenciar alerts del navegador

    render(<AppointmentForm />);

    // 1. Verificar Título Actualizado
    // El test fallaba aquí porque buscaba "Agendar Nueva Cita"
    expect(await screen.findByRole('heading', { name: /Nueva Cita \(Carrito\)/i })).toBeInTheDocument();

    // 2. Seleccionar Cliente
    const selectCliente = screen.getByLabelText(/Cliente/i);
    fireEvent.change(selectCliente, { target: { value: 'cli-1' } });

    // 3. Agregar Primer Servicio (Masaje)
    // Buscamos el selector por su etiqueta asociada
    const selectServicio = screen.getByLabelText(/Agregar Servicios/i);
    fireEvent.change(selectServicio, { target: { value: 'srv-1' } });

    // Clic en el botón "+" para agregar al carrito
    const btnAgregar = screen.getByText('+');
    fireEvent.click(btnAgregar);

    // Verificar que se agregó a la lista visual y el total se actualizó
    expect(screen.getByText('Masaje')).toBeInTheDocument();
    // El total debe ser 500
    expect(
      screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'strong' && content.includes('$500');
      }),
    ).toBeInTheDocument();

    // 4. Agregar Segundo Servicio (Facial)
    fireEvent.change(selectServicio, { target: { value: 'srv-2' } });
    fireEvent.click(btnAgregar);

    // Verificar acumulado (500 + 800 = 1300)
    expect(screen.getByText('Facial')).toBeInTheDocument();
    // Buscamos el total acumulado
    expect(
      screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'strong' && content.includes('$1300');
      }),
    ).toBeInTheDocument();

    // 5. Llenar Fecha
    const inputFecha = screen.getByLabelText(/Fecha y Hora/i);
    // Usamos una fecha futura válida para pasar la validación HTML/Zod
    fireEvent.change(inputFecha, { target: { value: '2025-12-25T10:00' } });

    // ACT: Enviar formulario
    // El botón ahora dice "Confirmar Cita" y muestra el monto
    const btnSubmit = screen.getByRole('button', { name: /Confirmar Cita/i });
    fireEvent.click(btnSubmit);

    // ASSERT: Verificar payload al backend
    await waitFor(() => {
      expect(api_client.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({
          usuario_id: 'cli-1',
          servicios_ids: ['srv-1', 'srv-2'], // Array con ambos servicios
        }),
      );
    });
  });

  it('muestra error si no se agrega ningún servicio', async () => {
    render(<AppointmentForm />);

    // Esperamos renderizado inicial
    await screen.findByRole('heading', { name: /Nueva Cita \(Carrito\)/i });

    // Llenamos solo cliente y fecha
    const selectCliente = screen.getByLabelText(/Cliente/i);
    fireEvent.change(selectCliente, { target: { value: 'cli-1' } });

    const inputFecha = screen.getByLabelText(/Fecha y Hora/i);
    fireEvent.change(inputFecha, { target: { value: '2025-12-25T10:00' } });

    // Intentamos enviar sin servicios
    const btnSubmit = screen.getByRole('button', { name: /Confirmar Cita/i });
    fireEvent.click(btnSubmit);

    // Esperar mensaje de validación Zod (definido en AppointmentSchema)
    expect(await screen.findByText(/Debes agregar al menos un servicio/i)).toBeInTheDocument();
  });
});
