import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// 1. MOCK AUTH: Simulamos usuario logueado
vi.mock('./contexts/auth.context', () => ({
  useAuth: () => ({
    is_authenticated: true,
    user: { nombre: 'Admin' },
    logout: vi.fn(),
  }),
}));

// 2. MOCK BRANCH: ¡Corregido! Agregamos 'branches: []' para que no falle el map
vi.mock('./contexts/branch.context', () => ({
  useBranch: () => ({
    activeBranch: { nombre: 'Principal' },
    branches: [], // <--- ESTO FALTABA
    isLoading: false,
  }),
}));

// 3. MOCK APPOINTMENTS: Datos vacíos
vi.mock('./hooks/use_appointments', () => ({
  useAppointments: () => ({ data: [], isLoading: false }),
}));

// 4. MOCK COMPONENTES HIJOS COMPLEJOS
// Esto es clave: "Apagamos" los componentes que no estamos probando para aislar App.

// Evitamos que se renderice el formulario real (ya tiene sus propios tests)
vi.mock('./components/forms/appointment_form', () => ({
  AppointmentForm: () => <div data-testid="appointment-form">Formulario Mock</div>,
}));

// Evitamos el error de ThemeProvider mockeando el Header entero
vi.mock('./components/layout/header', () => ({
  Header: () => <div data-testid="mock-header">Header Admin</div>,
}));

// Evitamos problemas internos del selector de sucursales (opcional, pero seguro)
vi.mock('./components/branch_selector/branch_selector', () => ({
  BranchSelector: () => <div>Selector Sucursal</div>,
}));

describe('App Component', () => {
  it('abre el modal al hacer clic en Nueva Cita', async () => {
    render(<App />);

    // 1. Verificar que el modal NO está visible al inicio (buscamos el contenido mockeado)
    expect(screen.queryByTestId('appointment-form')).not.toBeInTheDocument();

    // 2. Hacer clic en el botón "+ Nueva Cita"
    // Nota: Buscamos por el texto exacto que pusimos en el botón
    const boton = screen.getByText('+ Nueva Cita');
    fireEvent.click(boton);

    // 3. Verificar que el modal (y su contenido) ahora SÍ está visible
    await waitFor(() => {
      expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
    });
  });
});
