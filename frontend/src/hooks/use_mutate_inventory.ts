import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api_client } from '../api/api_client';
import { useBranch } from '../contexts/branch.context';

/**
 * Payload para crear un material nuevo.
 */
export type CreateMaterialPayload = {
  nombre: string;
  unidad: string;
  stock_inicial: number;
  stock_minimo: number;
  costo_unitario?: number;
};

/**
 * Payload para reabastecer (Restock).
 */
export type RestockPayload = {
  material_id: string;
  cantidad: number;
  costo_compra?: number;
};

/**
 * Hook para operaciones de escritura en Inventario (CUD).
 */
export const useMutateInventory = () => {
  const query_client = useQueryClient();
  const { activeBranch } = useBranch();

  // 1. Crear Material
  const create_material = useMutation({
    mutationFn: async (data: CreateMaterialPayload) => {
      const response = await api_client.post('/inventory', data);
      return response.data;
    },
    onSuccess: () => {
      // Refrescamos la lista de inventario de la sucursal actual
      query_client.invalidateQueries(['inventory', activeBranch?.id]);
    },
  });

  // 2. Reabastecer (Restock)
  const restock_material = useMutation({
    mutationFn: async ({ material_id, cantidad, costo_compra }: RestockPayload) => {
      const response = await api_client.post(`/inventory/${material_id}/restock`, {
        cantidad,
        costo_compra,
      });
      return response.data;
    },
    onSuccess: () => {
      query_client.invalidateQueries(['inventory', activeBranch?.id]);
    },
  });

  return {
    create_material,
    restock_material,
  };
};
