import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InventoryTable } from './inventory_table';
import { InventoryItem } from '../../hooks/use_inventory';

// Datos Mock para las pruebas
const mockData: InventoryItem[] = [
  {
    materialId: '1',
    material: 'Gel Uñas',
    unidad: 'ml',
    stockActual: 5,
    stockMinimo: 10,
    alerta: true, // Caso Crítico
  },
  {
    materialId: '2',
    material: 'Toallas',
    unidad: 'pz',
    stockActual: 50,
    stockMinimo: 10,
    alerta: false, // Caso Sano
  },
];

describe('InventoryTable Component', () => {
  it('Muestra mensaje de carga cuando loading es true', () => {
    render(<InventoryTable data={[]} loading={true} />);
    expect(screen.getByText(/Actualizando inventario/i)).toBeInTheDocument();
  });

  it('Muestra mensaje de vacío cuando no hay datos', () => {
    render(<InventoryTable data={[]} loading={false} />);
    expect(screen.getByText(/Sin existencias/i)).toBeInTheDocument();
    expect(screen.getByText(/No se encontraron materiales/i)).toBeInTheDocument();
  });

  it('Renderiza la tabla con datos correctamente', () => {
    render(<InventoryTable data={mockData} loading={false} />);

    // Verificar que los nombres de materiales están ahí
    expect(screen.getByText('Gel Uñas')).toBeInTheDocument();
    expect(screen.getByText('Toallas')).toBeInTheDocument();

    // Verificar valores numéricos
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('Muestra badge de ALERTA (Bajo) para items críticos', () => {
    render(<InventoryTable data={mockData} loading={false} />);

    // El item 1 tiene alerta=true, debe mostrar "Bajo"
    const alertaBadge = screen.getByText(/Bajo/i);
    expect(alertaBadge).toBeInTheDocument();
    // Opcional: Verificar color (aunque es mejor confiar en la clase CSS)
    // expect(alertaBadge).toHaveStyle({ backgroundColor: '#fee2e2' });
  });

  it('Muestra badge de OK para items sanos', () => {
    render(<InventoryTable data={mockData} loading={false} />);

    // El item 2 tiene alerta=false, debe mostrar "OK"
    const okBadge = screen.getByText(/OK/i);
    expect(okBadge).toBeInTheDocument();
  });
});
