import { useQuery } from '@tanstack/react-query';
// CORRECCIÓN DE RUTA: Apuntamos a la carpeta 'api' real
import { api_client } from '../api/api_client';
// CORRECCIÓN DE RUTA Y NOMBRE: Apuntamos a 'contexts' y usamos el hook 'useBranch' que exportas ahí
import { useBranch } from '../contexts/branch.context';

// --- TIPOS ---

/**
 * DTO (Data Transfer Object) que representa un ítem de inventario en el frontend.
 * Esta estructura debe coincidir exactamente con la respuesta del endpoint `/inventory`
 * del Backend (InventoryService).
 */
export type InventoryItem = {
  /** ID único del material (ej. "branch-principal-gel") */
  materialId: string;
  /** Nombre legible del material (ej. "Gel Uñas") */
  material: string;
  /** Unidad de medida (ej. "ml", "pz") */
  unidad: string;
  /** Cantidad física actual en la sucursal */
  stockActual: number;
  /** Cantidad mínima antes de generar alerta */
  stockMinimo: number;
  /** Bandera calculada en backend: true si stockActual <= stockMinimo */
  alerta: boolean;
};

// --- HOOK ---

/**
 * Hook personalizado para gestionar la obtención de datos de inventario.
 *
 * **Funcionalidad:**
 * - Se suscribe a los cambios de la sucursal activa (`branch_id`).
 * - Ejecuta la petición GET al backend automáticamente.
 * - Gestiona la caché y el re-fetching usando React Query.
 *
 * @returns Objeto de React Query con { data, isLoading, error, ... }
 */
export const use_inventory = () => {
  // Accedemos al contexto para saber qué sucursal consultar.
  // Nota: En tu archivo branch.context.tsx exportas 'useBranch', no 'use_branch_context'.
  const { activeBranch } = useBranch();

  // Extraemos el ID de manera segura (puede ser null al inicio)
  const branch_id = activeBranch?.id;

  return useQuery({
    // KEY DE CACHÉ:
    // Incluimos 'branch_id' en la key. Esto es CRUCIAL.
    // Significa: "Si cambia la sucursal, considera los datos viejos como inválidos y recarga".
    queryKey: ['inventory', branch_id],

    // FUNCIÓN DE FETCH:
    queryFn: async () => {
      // Validación defensiva: Si no hay sucursal, no intentamos llamar a la API
      if (!branch_id) return [];

      // Llamada Axios. El interceptor en api_client.ts se encargará de inyectar
      // el header X-Branch-Id, pero el query param ayuda al cacheo del navegador.
      const response = await api_client.get<{ snapshot: InventoryItem[] }>('/inventory', {
        params: { sucursalId: branch_id },
      });

      return response.data.snapshot;
    },

    // CONFIGURACIÓN:
    // Solo ejecutamos la query si tenemos un branch_id válido
    enabled: Boolean(branch_id),
    // Evitamos recargas innecesarias al cambiar de ventana para ahorrar datos
    refetchOnWindowFocus: false,
  });
};
