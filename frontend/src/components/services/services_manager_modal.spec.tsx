import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServicesManagerModal } from './services_manager_modal';

// --- MOCKS ---
const mock_mutate = vi.fn();

vi.mock('../../hooks/use_services', () => ({
  useServices: () => ({
    data: [{ id: 'serv-1', nombre: 'Masaje Relax', precioBase: 500, duracionMinutos: 60 }],
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_mutate_service', () => ({
  useMutateService: () => ({
    mutate: mock_mutate,
    isLoading: false,
  }),
}));

vi.mock('../../hooks/use_inventory', () => ({
  use_inventory: () => ({
    data: [{ materialId: 'mat-1', material: 'Aceite', unidad: 'ml', stockActual: 100 }],
    isLoading: false,
  }),
}));

describe('ServicesManagerModal Component', () => {
  const handle_close = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la lista de servicios inicialmente', () => {
    render(<ServicesManagerModal is_open={true} on_close={handle_close} />);

    expect(screen.getByText('Catálogo de Servicios')).toBeInTheDocument();
    expect(screen.getByText('Masaje Relax')).toBeInTheDocument();
    expect(screen.getByText(/\$500/)).toBeInTheDocument();
  });

  it('permite navegar al formulario de creación y validar datos', async () => {
    render(<ServicesManagerModal is_open={true} on_close={handle_close} />);

    // 1. Clic en "Crear Nuevo"
    fireEvent.click(screen.getByText('+ Crear Nuevo'));

    // 2. Verificar cambio de título
    expect(screen.getByText('Nuevo Servicio')).toBeInTheDocument();

    // 3. Intentar guardar vacío (Validación Zod)
    fireEvent.click(screen.getByText('Guardar Servicio'));

    // Esperar mensaje de error del nombre (min 3 caracteres)
    expect(await screen.findByText(/Mínimo 3 caracteres/i)).toBeInTheDocument();

    // 4. Llenar formulario correctamente
    fireEvent.change(screen.getByLabelText(/Nombre del Servicio/i), { target: { value: 'Facial Oro' } });
    fireEvent.change(screen.getByLabelText(/Precio Base/i), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText(/Duración/i), { target: { value: '90' } });

    // 5. Guardar
    fireEvent.click(screen.getByText('Guardar Servicio'));

    // 6. Verificar payload
    await waitFor(() => {
      expect(mock_mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Facial Oro',
          precio_base: 1200,
          duracion_minutos: 90,
        }),
        expect.any(Object),
      );
    });
  });
});
