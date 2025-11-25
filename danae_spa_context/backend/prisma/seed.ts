import { PrismaClient } from '@prisma/client'
import {
  branches,
  services_catalog,
  services_overrides,
  promotions_catalog,
  inventory_snapshot
} from '../src/common/mocks/sample-data'

const prisma = new PrismaClient()

async function main() {
  await prisma.$transaction(
    branches.map((branch) =>
      prisma.sucursal.upsert({
        where: { id_sucursal: branch.id_sucursal },
        update: {},
        create: {
          id_sucursal: branch.id_sucursal,
          nombre: branch.nombre,
          zona_horaria: branch.zona_horaria
        }
      })
    )
  )

  await prisma.$transaction(
    services_catalog.map((service) =>
      prisma.servicio.upsert({
        where: { id_servicio: service.id_servicio },
        update: {},
        create: {
          id_servicio: service.id_servicio,
          nombre: service.nombre,
          precio_base: service.precio_base,
          duracion_minutos: service.duracion_minutos
        }
      })
    )
  )

  await prisma.$transaction(
    services_overrides.map((override) =>
      prisma.servicioSucursal.upsert({
        where: {
          id_servicio_id_sucursal: {
            id_servicio: override.id_servicio,
            id_sucursal: override.id_sucursal
          }
        },
        update: {},
        create: {
          id_servicio: override.id_servicio,
          id_sucursal: override.id_sucursal,
          precio: override.precio,
          duracion_minutos: override.duracion_minutos
        }
      })
    )
  )

  await prisma.$transaction(
    promotions_catalog.map((promo) =>
      prisma.promocion.upsert({
        where: { id_promocion: promo.id_promocion },
        update: {},
        create: {
          id_promocion: promo.id_promocion,
          nombre: promo.nombre,
          descuento: promo.descuento,
          fecha_inicio: new Date(),
          fecha_fin: new Date('2026-12-31'),
          tipo: 'general'
        }
      })
    )
  )

  const material_names = new Map<string, { nombre: string; unidad: string }>()
  Object.entries(inventory_snapshot).forEach(([id_sucursal, rows]) => {
    rows.forEach((row) => {
      const material_id = `${id_sucursal}-${row.material}`
      material_names.set(material_id, { nombre: row.material, unidad: 'unidad' })
    })
  })

  await prisma.$transaction(
    Array.from(material_names.entries()).map(([id_material, info]) =>
      prisma.material.upsert({
        where: { id_material },
        update: {},
        create: {
          id_material,
          nombre: info.nombre,
          unidad: info.unidad,
          costo_unitario: 0
        }
      })
    )
  )

  await prisma.$transaction(
    Object.entries(inventory_snapshot).flatMap(([id_sucursal, rows]) =>
      rows.map((row) =>
        prisma.existencias.upsert({
          where: {
            id_sucursal_id_material: {
              id_sucursal,
              id_material: `${id_sucursal}-${row.material}`
            }
          },
          update: {},
          create: {
            id_sucursal,
            id_material: `${id_sucursal}-${row.material}`,
            stock_actual: row.stock_actual,
            stock_minimo: row.stock_minimo
          }
        })
      )
    )
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Seeds aplicadas')
  })
  .catch(async (error) => {
    console.error('Error en seeds', error)
    await prisma.$disconnect()
    process.exit(1)
  })
