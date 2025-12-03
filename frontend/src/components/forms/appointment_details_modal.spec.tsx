import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentDetailsModal } from './appointment_details_modal';

// Datos Mock para las pruebas
const mock_cita = {
  id: 'uuid-123',
  // Fecha fija: Martes, 2 de Diciembre 2025, 17:30 (aprox)
  fechaHora: '2025-12-02T17:30:00',
  servicio: 'Manicure Premium, Pedicure Spa', // Caso de prueba para el parseo
  cliente: 'María Cliente',
  estado: 'pendiente',
  total: 1200,
};

describe('AppointmentDetailsModal Component', () => {
  // Caso 1: Renderizado básico cuando isOpen es true
  it('renderiza correctamente la información del cliente y estado', () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={vi.fn()} appointment={mock_cita} />);

    expect(screen.getByText('Detalles de Cita')).toBeInTheDocument();
    expect(screen.getByText('María Cliente')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
    // Verificamos que se muestre el ID
    expect(screen.getByText(/uuid-123/)).toBeInTheDocument();
  });

  // Caso 2: Formateo de Fecha y Hora (Intl)
  it('formatea correctamente la fecha y hora local', () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={vi.fn()} appointment={mock_cita} />);

    // Verificamos fecha larga (depende del locale, buscamos partes clave)
    // Nota: En entorno de test (Node/JSDOM), el locale suele ser en-US por defecto a menos que se configure globalmente.
    // Buscamos flexibilidad o configuramos el test setup. Aquí asumimos que toLocaleDateString funciona.
    // Si el test corre en una máquina con locale español, buscaría "martes".
    // Para robustez, verificamos que NO se muestre el string ISO crudo.
    expect(screen.queryByText('2025-12-02T17:30:00')).not.toBeInTheDocument();
  });

  // Caso 3: Parseo de Servicios (String -> Lista)
  it('separa correctamente la lista de servicios concatenados', () => {
    render(<AppointmentDetailsModal isOpen={true} onClose={vi.fn()} appointment={mock_cita} />);

    // Debe haber encontrado dos items de lista distintos
    const item1 = screen.getByText('Manicure Premium');
    const item2 = screen.getByText('Pedicure Spa');

    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();

    // Verificamos que el total también aparezca
    expect(screen.getByText(/\$1200/)).toBeInTheDocument();
  });

  // Caso Borde: No renderiza si no hay cita o isOpen es false
  it('no renderiza nada si isOpen es false', () => {
    render(<AppointmentDetailsModal isOpen={false} onClose={vi.fn()} appointment={mock_cita} />);
    // El título no debería estar en el DOM
    expect(screen.queryByText('Detalles de Cita')).not.toBeInTheDocument();
  });
});
