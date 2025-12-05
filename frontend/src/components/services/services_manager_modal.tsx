import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Modal } from '../ui/modal';
import { useServices } from '../../hooks/use_services';
import { useMutateService, ServicePayload } from '../../hooks/use_mutate_service';
import { use_inventory } from '../../hooks/use_inventory'; // Consumimos inventario para el select
import { Service } from '../../types/service.types';
import './services.css';

const ServiceSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  precio_base: z.coerce.number().min(0, 'Precio inválido'),
  duracion_minutos: z.coerce.number().min(5, 'Mínimo 5 minutos'),
});

type ServiceFormValues = z.infer<typeof ServiceSchema>;

// Tipo local para la receta en el frontend
type RecipeItem = {
  material_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
};

type Props = {
  is_open: boolean;
  on_close: () => void;
};

export const ServicesManagerModal = ({ is_open, on_close }: Props) => {
  const [view_mode, set_view_mode] = useState<'list' | 'form'>('list');
  const [editing_service, set_editing_service] = useState<Service | null>(null);

  // Hooks de datos
  const { data: services = [], isLoading } = useServices();
  const { mutate: save_service, isLoading: is_saving } = useMutateService();
  // Traemos el inventario para usarlo como catálogo de insumos
  const { data: inventory = [] } = use_inventory();

  // Estado local para la receta (Carrito de insumos)
  const [recipe, set_recipe] = useState<RecipeItem[]>([]);
  // Inputs temporales para agregar material
  const [selected_mat_id, set_selected_mat_id] = useState('');
  const [mat_qty, set_mat_qty] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(ServiceSchema),
  });

  useEffect(() => {
    if (view_mode === 'form') {
      if (editing_service) {
        setValue('nombre', editing_service.nombre);
        setValue('precio_base', editing_service.precioBase);
        setValue('duracion_minutos', editing_service.duracionMinutos);
        // TODO: En el futuro, cargar la receta existente del backend aquí
        set_recipe([]);
      } else {
        reset({ nombre: '', precio_base: 0, duracion_minutos: 60 });
        set_recipe([]);
      }
    }
  }, [view_mode, editing_service, reset, setValue]);

  // --- HANDLERS RECETA ---
  const add_material_to_recipe = () => {
    if (!selected_mat_id || !mat_qty) return;

    const material_info = inventory.find((i) => i.materialId === selected_mat_id);
    if (!material_info) return;

    // Evitar duplicados visuales (sumar cantidad o reemplazar)
    const new_item: RecipeItem = {
      material_id: selected_mat_id,
      nombre: material_info.material,
      unidad: material_info.unidad,
      cantidad: parseFloat(mat_qty),
    };

    set_recipe((prev) => [...prev.filter((i) => i.material_id !== selected_mat_id), new_item]);
    set_selected_mat_id('');
    set_mat_qty('');
  };

  const remove_material = (id: string) => {
    set_recipe((prev) => prev.filter((i) => i.material_id !== id));
  };

  // --- HANDLERS FORM ---
  const handle_back_to_list = () => {
    set_view_mode('list');
    set_editing_service(null);
  };

  const on_submit = (data: ServiceFormValues) => {
    // Construimos el payload final incluyendo la receta
    const payload: any = {
      // Usamos any temporalmente porque ServicePayload no tiene 'materiales' definido en el tipo TS aun
      ...data,
      id: editing_service?.id,
      materiales: recipe.map((r) => ({ material_id: r.material_id, cantidad: r.cantidad })),
    };

    save_service(payload, {
      onSuccess: () => handle_back_to_list(),
      onError: (err: any) => alert('Error: ' + err.response?.data?.message),
    });
  };

  // Encontramos el material seleccionado para mostrar su unidad
  const current_mat_unit = inventory.find((i) => i.materialId === selected_mat_id)?.unidad || '';

  return (
    // Inyectamos clase personalizada para el ancho
    <div className="services-modal-wrapper">
      <Modal is_open={is_open} on_close={on_close} maxWidth="800px">
        {/* Contenedor interno con el ancho forzado vía estilo en línea para sobreescribir el default del Modal si es necesario, 
          o mejor aún, confiamos en que editaste App.css o services.css */}
        <div style={{ minWidth: '100%' }}>
          <div className="services-manager-header">
            <h2 className="services-title">
              {view_mode === 'list' ? 'Catálogo de Servicios' : editing_service ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            {view_mode === 'list' ? (
              <button
                className="btn-create"
                onClick={() => {
                  set_editing_service(null);
                  set_view_mode('form');
                }}
              >
                + Crear Nuevo
              </button>
            ) : (
              <button className="btn-secondary-action" onClick={handle_back_to_list}>
                ← Volver
              </button>
            )}
          </div>

          {/* LISTA */}
          {view_mode === 'list' && (
            <div className="services-list-container">
              {isLoading ? (
                <p>Cargando...</p>
              ) : services.length === 0 ? (
                <p>Vacío</p>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="service-row">
                    <div className="service-info">
                      <h4>{service.nombre}</h4>
                      <div className="service-meta">
                        <span>⏱️ {service.duracionMinutos} min</span>
                        <span style={{ fontWeight: 'bold' }}>${service.precioBase}</span>
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        set_editing_service(service);
                        set_view_mode('form');
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* FORMULARIO */}
          {view_mode === 'form' && (
            <form onSubmit={handleSubmit(on_submit)} className="service-form">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  Nombre del Servicio
                </label>
                <input id="nombre" className="form-input" {...register('nombre')} autoFocus />
                {errors.nombre && <span className="error-message">{errors.nombre.message}</span>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="precio_base" className="form-label">
                    Precio Base ($)
                  </label>
                  <input id="precio_base" type="number" className="form-input" {...register('precio_base')} />
                </div>
                <div className="form-group">
                  <label htmlFor="duracion_minutos" className="form-label">
                    Duración (min)
                  </label>
                  <input id="duracion_minutos" type="number" className="form-input" {...register('duracion_minutos')} />
                </div>
              </div>

              {/* SECCIÓN DE RECETA (MATERIALES) */}
              <div className="recipe-section">
                <h4 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  🧪 Receta de Insumos (Consumo por servicio)
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Define qué materiales se descuentan automáticamente al cerrar la cita.
                </p>

                <div className="recipe-controls">
                  <div className="form-group">
                    <select
                      className="form-input"
                      value={selected_mat_id}
                      onChange={(e) => set_selected_mat_id(e.target.value)}
                    >
                      <option value="">-- Seleccionar Material --</option>
                      {inventory.map((item) => (
                        <option key={item.materialId} value={item.materialId}>
                          {item.material} (Disp: {item.stockActual} {item.unidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <input
                      type="number"
                      className="form-input"
                      placeholder={`Cant. (${current_mat_unit})`}
                      value={mat_qty}
                      onChange={(e) => set_mat_qty(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={add_material_to_recipe}
                    disabled={!selected_mat_id || !mat_qty}
                    style={{ height: '42px' }}
                  >
                    Agregar
                  </button>
                </div>

                {recipe.length > 0 && (
                  <ul className="recipe-list">
                    {recipe.map((item, idx) => (
                      <li key={idx} className="recipe-item">
                        <span>{item.nombre}</span>
                        <span style={{ fontWeight: 500 }}>
                          {item.cantidad} {item.unidad}
                        </span>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => remove_material(item.material_id)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" onClick={handle_back_to_list} disabled={is_saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={is_saving}>
                  {is_saving ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
