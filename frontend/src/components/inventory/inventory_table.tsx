import React from 'react';
import { InventoryItem } from '../../hooks/use_inventory';
import './inventory.css'; // <--- Importamos los estilos aquí

type InventoryTableProps = {
  data: InventoryItem[];
  loading: boolean;
};

/**
 * Componente de presentación para el Inventario en Tiempo Real.
 * Utiliza clases CSS definidas en 'inventory.css' para mantener el código limpio.
 */
export const InventoryTable = ({ data, loading }: InventoryTableProps) => {
  // GUARD CLASUE: Protección extra
  // Verificamos que 'data' sea realmente un array antes de intentar usar .map
  const safeData = Array.isArray(data) ? data : [];
  if (loading) {
    return (
      <div className="inventory-message">
        <p style={{ fontSize: '1.1rem' }}>🔄 Actualizando inventario...</p>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="inventory-empty">
        <div className="inventory-empty-icon">📦</div>
        <h3 className="inventory-empty-title">Sin existencias</h3>
        <p className="inventory-empty-text">No se encontraron materiales registrados en esta sucursal.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="inventory-table">
        <thead>
          <tr className="inventory-header-row">
            <th className="inventory-th text-left">Material</th>
            <th className="inventory-th">Unidad</th>
            <th className="inventory-th">Stock Actual</th>
            <th className="inventory-th">Mínimo</th>
            <th className="inventory-th">Estado</th>
          </tr>
        </thead>

        <tbody>
          {safeData.map((item) => {
            const es_critico = item.alerta;

            return (
              <tr key={item.materialId} className="inventory-row">
                <td className="inventory-cell inventory-cell-name">{item.material}</td>

                <td className="inventory-cell inventory-cell-unit">{item.unidad}</td>

                {/* Stock: Aplicamos clase 'critical' si es bajo */}
                <td className={`inventory-cell inventory-cell-stock ${es_critico ? 'critical' : ''}`}>
                  {item.stockActual}
                </td>

                <td className="inventory-cell inventory-cell-min">{item.stockMinimo}</td>

                <td className="inventory-cell" style={{ textAlign: 'center' }}>
                  {es_critico ? (
                    <span
                      className="inventory-badge inventory-badge--warning"
                      title="Es necesario reabastecer este material pronto"
                    >
                      ⚠️ Bajo
                    </span>
                  ) : (
                    <span className="inventory-badge inventory-badge--success">✅ OK</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
