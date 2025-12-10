import { ChangeEvent } from 'react';
import { useBranch } from '../../contexts/branch.context';

// 1. Definimos los tipos de las props
type Props = {
  compact?: boolean; // Opcional, por defecto será false
};

// 2. Recibimos las props y desestructuramos 'compact' con un valor por defecto
export const BranchSelector = ({ compact = false }: Props) => {
  const { branches, activeBranch, setActiveBranch, isLoading } = useBranch();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveBranch(event.target.value);
  };

  // Estilo condicional: Si es 'compact', ocupa todo el ancho disponible
  const containerStyle = compact ? { width: '100%' } : { marginBottom: '1rem' };

  // Estilo del select: Si es 'compact', le damos un fondo que contraste con el header
  const selectStyle = compact
    ? { padding: '0.4rem', fontSize: '0.9rem', borderRadius: '4px', backgroundColor: 'var(--bg-body)' }
    : {};

  return (
    <div style={containerStyle} className="branch-selector">
      {/* Solo mostramos el label si NO es modo compacto */}
      {!compact && (
        <label htmlFor="branch-select" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Sucursal activa
        </label>
      )}

      <select
        id="branch-select"
        value={activeBranch?.id ?? ''}
        onChange={handleChange}
        disabled={isLoading}
        style={selectStyle}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};
