import { useMemo } from 'react';
import { Modal } from '../ui/modal';
import './appointment_details.css';

/**
 * Definición del tipo de datos esperado para la visualización.
 * Este tipo es un subconjunto de lo que devuelve la API de Citas,
 * enfocado solo en lo que necesita este modal.
 */
type AppointmentSummary = {
  id: string;
  fechaHora: string;
  /** * String concatenado de servicios (ej. "Masaje, Facial").
   * @todo En el futuro, el backend devolverá un array de objetos detallado.
   */
  servicio: string;
  cliente: string;
  estado: string;
  /** El total puede ser opcional si el backend no lo ha calculado aún */
  total?: number;
};

type Props = {
  /** Controla si el modal es visible */
  isOpen: boolean;
  /** Función para cerrar el modal y limpiar la selección */
  onClose: () => void;
  /** Datos de la cita seleccionada (o null si no hay selección) */
  appointment: AppointmentSummary | null;
};

/**
 * Modal para visualizar los detalles técnicos y financieros de una cita.
 * * **Responsabilidades:**
 * - Formatear fechas y horas a la localidad (es-MX).
 * - Desglosar la lista de servicios (actualmente parseando un string).
 * - Mostrar totales y estados.
 * - Proveer puntos de entrada para futuras acciones (Editar/Cancelar).
 */
export const AppointmentDetailsModal = ({ isOpen, onClose, appointment }: Props) => {
  // Si no hay datos, no renderizamos nada (Protección contra nulos)
  if (!appointment) return null;

  // --- LÓGICA DE MEMOIZACIÓN (Performance) ---

  /** Formateo de fecha legible (ej. "Martes, 2 de Diciembre de 2025") */
  const fecha_formateada = useMemo(() => {
    return new Date(appointment.fechaHora).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [appointment.fechaHora]);

  /** Formateo de hora (ej. "05:30 PM") */
  const hora_formateada = useMemo(() => {
    return new Date(appointment.fechaHora).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [appointment.fechaHora]);

  /** * Parseo temporal de servicios.
   * Convierte "Servicio A, Servicio B" -> ["Servicio A", "Servicio B"]
   * para poder listarlos individualmente en la UI.
   */
  const lista_servicios = useMemo(() => {
    return appointment.servicio ? appointment.servicio.split(',').map((s) => s.trim()) : [];
  }, [appointment.servicio]);

  return (
    <Modal is_open={isOpen} on_close={onClose} title="">
      {/* HEADER: Título e ID */}
      <div className="details-header">
        <h2 className="details-title">Detalles de Cita</h2>
        <p className="details-subtitle">ID Referencia: {appointment.id}</p>
      </div>

      {/* GRILLA: Información Clave */}
      <div className="details-grid">
        <div className="info-group">
          <span className="info-label">Cliente</span>
          <span className="info-value">{appointment.cliente}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Estado Actual</span>
          {/* Reutilizamos las clases de badge existentes en index.css */}
          <span className={`badge-status status-${appointment.estado}`} style={{ width: 'fit-content' }}>
            {appointment.estado}
          </span>
        </div>
        <div className="info-group">
          <span className="info-label">Fecha Programada</span>
          <span className="info-value">{fecha_formateada}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Hora de Inicio</span>
          <span className="info-value">{hora_formateada}</span>
        </div>
      </div>

      {/* SECCIÓN: Servicios Contratados (Carrito) */}
      <div className="services-section">
        <h4
          style={{
            margin: '0 0 0.8rem 0',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
          }}
        >
          Servicios en la Orden
        </h4>

        <ul className="services-list">
          {lista_servicios.length > 0 ? (
            lista_servicios.map((item, idx) => (
              <li key={idx} className="service-item">
                <span>{item}</span>
                {/* Placeholder visual para precio individual (Backend pendiente) */}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Consultar Precio</span>
              </li>
            ))
          ) : (
            <li className="service-item" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Sin servicios registrados
            </li>
          )}
        </ul>

        {/* TOTALIZADOR */}
        {appointment.total !== undefined && (
          <div style={{ textAlign: 'right', marginTop: '1.2rem', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            Total Estimado: <strong>${appointment.total}</strong>
          </div>
        )}
      </div>

      {/* FOOTER: Botonera de Acciones */}
      <div className="details-actions">
        <button className="btn-secondary" onClick={onClose}>
          Cerrar Ventana
        </button>

        {/* Botón deshabilitado temporalmente (Feature Flag: EDIT_APPOINTMENT) */}
        <button
          className="btn-primary"
          disabled
          title="Funcionalidad en desarrollo para el Sprint 2"
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        >
          Editar Cita
        </button>
      </div>
    </Modal>
  );
};
