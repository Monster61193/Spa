import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Modal } from '../ui/modal';
import { useMutateInventory } from '../../hooks/use_mutate_inventory';
import { InventoryItem } from '../../hooks/use_inventory';
import './inventory.css';

// --- ESQUEMAS ZOD ---
const CreateSchema = z.object({
  nombre: z.string().min(3, 'El nombre es requerido'),
  unidad: z.string().min(1, 'Unidad requerida (ej. ml)'),
  stock_inicial: z.coerce.number().min(0),
  stock_minimo: z.coerce.number().min(0),
});

const RestockSchema = z.object({
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
});

type CreateFormValues = z.infer<typeof CreateSchema>;
type RestockFormValues = z.infer<typeof RestockSchema>;

type Props = {
  is_open: boolean;
  on_close: () => void;
  /** Si mode='restock', este item es obligatorio */
  target_item: InventoryItem | null;
  mode: 'create' | 'restock';
};

/**
 * Modal polimórfico para acciones de inventario.
 */
export const InventoryActionModal = ({ is_open, on_close, target_item, mode }: Props) => {
  const { create_material, restock_material } = useMutateInventory();

  // Hooks de formularios separados para evitar conflictos de tipos
  const formCreate = useForm<CreateFormValues>({ resolver: zodResolver(CreateSchema) });
  const formRestock = useForm<RestockFormValues>({ resolver: zodResolver(RestockSchema) });

  // Resetear formularios al abrir/cerrar
  useEffect(() => {
    if (is_open) {
      formCreate.reset({ stock_inicial: 0, stock_minimo: 5 });
      formRestock.reset({ cantidad: 0 });
    }
  }, [is_open, mode, formCreate, formRestock]);

  // --- HANDLERS ---

  const handleCreate = (data: CreateFormValues) => {
    create_material.mutate(data, {
      onSuccess: () => on_close(),
      onError: (err: any) => alert('Error: ' + err.response?.data?.message),
    });
  };

  const handleRestock = (data: RestockFormValues) => {
    if (!target_item) return;
    restock_material.mutate(
      {
        material_id: target_item.materialId,
        cantidad: data.cantidad,
      },
      {
        onSuccess: () => on_close(),
        onError: (err: any) => alert('Error: ' + err.response?.data?.message),
      },
    );
  };

  const is_loading = create_material.isLoading || restock_material.isLoading;

  return (
    <Modal
      is_open={is_open}
      on_close={on_close}
      title={mode === 'create' ? 'Nuevo Material' : 'Reabastecer Inventario'}
    >
      {/* MODO: CREAR NUEVO MATERIAL */}
      {mode === 'create' && (
        <form onSubmit={formCreate.handleSubmit(handleCreate)} className="inventory-form">
          <p className="inventory-info-text">Registra un nuevo insumo en el catálogo global.</p>

          <div className="form-group">
            <label htmlFor="nombre" className="form-label">
              Nombre del Material
            </label>
            <input
              id="nombre"
              className="form-input"
              {...formCreate.register('nombre')}
              placeholder="Ej. Aceite de Masaje"
              autoFocus
            />
            {formCreate.formState.errors.nombre && (
              <span className="error-message">{formCreate.formState.errors.nombre.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="unidad" className="form-label">
              Unidad de Medida
            </label>
            <input id="unidad" className="form-input" {...formCreate.register('unidad')} placeholder="Ej. ml, pz, gr" />
            {formCreate.formState.errors.unidad && (
              <span className="error-message">{formCreate.formState.errors.unidad.message}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="stock_inicial" className="form-label">
                Stock Inicial
              </label>
              <input
                id="stock_inicial"
                type="number"
                className="form-input"
                {...formCreate.register('stock_inicial')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="stock_minimo" className="form-label">
                Stock Mínimo (Alerta)
              </label>
              <input id="stock_minimo" type="number" className="form-input" {...formCreate.register('stock_minimo')} />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN (Restaurados) */}
          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={on_close} disabled={is_loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={is_loading}>
              {is_loading ? 'Guardando...' : 'Registrar Material'}
            </button>
          </div>
        </form>
      )}

      {/* MODO: REABASTECER (RESTOCK) */}
      {mode === 'restock' && target_item && (
        <form onSubmit={formRestock.handleSubmit(handleRestock)} className="inventory-form">
          <div className="current-stock-display" data-testid="stock-display">
            <small>Stock Actual de {target_item.material}:</small>
            <span>
              {target_item.stockActual} {target_item.unidad}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="cantidad" className="form-label">
              Cantidad a Ingresar (+)
            </label>
            <input id="cantidad" type="number" className="form-input" {...formRestock.register('cantidad')} autoFocus />
            {formRestock.formState.errors.cantidad && (
              <span className="error-message">{formRestock.formState.errors.cantidad.message}</span>
            )}
          </div>

          {/* BOTONES DE ACCIÓN (Restaurados) */}
          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={on_close} disabled={is_loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={is_loading}>
              {is_loading ? 'Procesando...' : 'Confirmar Ingreso'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
