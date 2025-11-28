import { ChangeEvent } from 'react'
import { useBranch } from '../../contexts/branch.context'

/**
 * Selector de sucursal activa con invalidación automática de queries por branch.
 */
export const BranchSelector = () => {
  const { branches, activeBranch, setActiveBranch, isLoading } = useBranch()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveBranch(event.target.value)
  }

  return (
    <fieldset className="branch-selector">
      <label htmlFor="branch-select">Sucursal activa</label>
      <select id="branch-select" value={activeBranch?.id ?? ''} onChange={handleChange} disabled={isLoading}>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.nombre}
          </option>
        ))}
      </select>
    </fieldset>
  )
}
