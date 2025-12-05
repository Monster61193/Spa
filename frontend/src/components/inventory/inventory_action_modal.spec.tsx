import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryActionModal } from './inventory_action_modal';
import { InventoryItem } from '../../hooks/use_inventory';

// --- MOCKS ---
const mock_create = { mutate: vi.fn(), isLoading: false };
const mock_restock = { mutate: vi.fn(), isLoading: false };

vi.mock('../../hooks/use_mutate_inventory', () => ({
  useMutateInventory: () => ({
    create_material: mock_create,
    restock_material: mock_restock,
  }),
}));

// Datos dummy
const item_mock: InventoryItem = {
  materialId: 'mat-1',
  material: 'Aceite Esencial',
  unidad: 'ml',
  stockActual: 10,
  stockMinimo: 5,
  alerta: false,
};

describe('InventoryActionModal Component', () => {
  const handle_close = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- TEST MODO: CREAR ---
  it('renderiza formulario de creación y envía datos', async () => {
    render(<InventoryActionModal is_open={true} on_close={handle_close} mode="create" target_item={null} />);

    expect(screen.getByText('Nuevo Material')).toBeInTheDocument();

    // Llenar campos
    fireEvent.change(screen.getByLabelText(/Nombre del Material/i), { target: { value: 'Toallas Nuevas' } });
    fireEvent.change(screen.getByLabelText(/Unidad de Medida/i), { target: { value: 'pz' } });
    fireEvent.change(screen.getByLabelText(/Stock Inicial/i), { target: { value: '50' } });

    // Guardar
    fireEvent.click(screen.getByText('Registrar Material'));

    await waitFor(() => {
      expect(mock_create.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Toallas Nuevas',
          unidad: 'pz',
          stock_inicial: 50,
        }),
        expect.any(Object),
      );
    });
  });

  // --- TEST MODO: RESTOCK ---
  it('renderiza modo restock y muestra stock actual', async () => {
    render(<InventoryActionModal is_open={true} on_close={handle_close} mode="restock" target_item={item_mock} />);

    expect(screen.getByText('Reabastecer Inventario')).toBeInTheDocument();

    // Verificar que muestra la info del item
    const display = screen.getByTestId('stock-display');
    expect(display).toHaveTextContent('Stock Actual de Aceite Esencial');
    expect(display).toHaveTextContent('10 ml');

    // Ingresar cantidad
    fireEvent.change(screen.getByLabelText(/Cantidad a Ingresar/i), { target: { value: '20' } });

    // Confirmar
    fireEvent.click(screen.getByText('Confirmar Ingreso'));

    await waitFor(() => {
      expect(mock_restock.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          material_id: 'mat-1',
          cantidad: 20,
        }),
        expect.any(Object),
      );
    });
  });
});
