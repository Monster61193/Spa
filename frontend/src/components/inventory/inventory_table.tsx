import React from 'react';
import { InventoryItem } from '../../hooks/use_inventory';
import './inventory.css';

type InventoryTableProps = {
  data: InventoryItem[];
  loading: boolean;
  /** Callback al hacer clic en el botón de sumar stock (+) */
  onRestock?: (item: InventoryItem) => void;
};

export const InventoryTable = ({ data, loading, onRestock }: InventoryTableProps) => {
  const safeData = Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <div className="inventory-message">
        <p>🔄 Cargando inventario...</p>
      </div>
    );
  }

  if (safeData.length === 0) {
    return (
      <div className="inventory-empty">
        <div className="inventory-empty-icon">📦</div>
        <h3 className="inventory-empty-title">Sin existencias</h3>
        <p className="inventory-empty-text">Registra materiales para comenzar.</p>
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
            <th className="inventory-th">Stock</th>
            <th className="inventory-th">Mínimo</th>
            <th className="inventory-th">Estado</th>
            {/* Columna de acciones solo si hay handler */}
            {onRestock && <th className="inventory-th">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {safeData.map((item) => (
            <tr key={item.materialId} className="inventory-row">
              <td className="inventory-cell inventory-cell-name">{item.material}</td>
              <td className="inventory-cell inventory-cell-unit">{item.unidad}</td>
              <td className={`inventory-cell inventory-cell-stock ${item.alerta ? 'critical' : ''}`}>
                {item.stockActual}
              </td>
              <td className="inventory-cell inventory-cell-min">{item.stockMinimo}</td>
              <td className="inventory-cell" style={{ textAlign: 'center' }}>
                {item.alerta ? (
                  <span className="inventory-badge inventory-badge--warning">⚠️ Bajo</span>
                ) : (
                  <span className="inventory-badge inventory-badge--success">✅ OK</span>
                )}
              </td>

              {/* Botón Restock */}
              {onRestock && (
                <td className="inventory-cell" style={{ textAlign: 'center' }}>
                  <button
                    className="btn-icon-action"
                    onClick={() => onRestock(item)}
                    title="Reabastecer (Agregar Stock)"
                  >
                    +
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
