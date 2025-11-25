import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const inventorySchema = z.object({
  cantidad: z.preprocess((value) => Number(value), z.number().positive()),
  precioUnitario: z.preprocess((value) => Number(value), z.number().min(0))
})

type InventoryFormValues = z.infer<typeof inventorySchema>

/**
 * Formulario RHF + Zod que convierte cadenas a número usando z.preprocess().
 */
export const InventoryForm = () => {
  const { register, handleSubmit, formState } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema)
  })

  const onSubmit: SubmitHandler<InventoryFormValues> = (values) => {
    console.log('Guardar inventario', values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="inventory-form">
      <label>
        Cantidad
        <input type="number" step="0.01" {...register('cantidad')} />
      </label>
      <label>
        Precio unitario
        <input type="number" step="0.01" {...register('precioUnitario')} />
      </label>
      <button type="submit" disabled={formState.isSubmitting}>Guardar</button>
    </form>
  )
}
