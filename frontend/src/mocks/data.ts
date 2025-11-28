export const branches = [
  { id: 'branch-principal', nombre: 'Principal' },
  { id: 'branch-norte', nombre: 'Norte' }
]

export const appointment_catalog: Record<string, { id: string; fechaHora: string; servicio: string; cliente: string; estado: string }[]> = {
  'branch-principal': [
    { id: 'a-1', fechaHora: '2025-10-02T11:00:00Z', servicio: 'Manicure premium', cliente: 'Martina', estado: 'pendiente' },
    { id: 'a-2', fechaHora: '2025-10-03T14:30:00Z', servicio: 'Facial hidratante', cliente: 'Lucía', estado: 'confirmada' }
  ],
  'branch-norte': [
    { id: 'a-12', fechaHora: '2025-10-05T10:00:00Z', servicio: 'Pedicure spa', cliente: 'Daniel', estado: 'pendiente' }
  ]
}

export const inventory_snapshot: Record<string, { material: string; stockActual: number; stockMinimo: number }[]> = {
  'branch-principal': [
    { material: 'Esponjas termales', stockActual: 56, stockMinimo: 10 },
    { material: 'Gel uñas', stockActual: 34, stockMinimo: 15 }
  ],
  'branch-norte': [
    { material: 'Mascarilla arcilla', stockActual: 18, stockMinimo: 20 }
  ]
}

export const promotions_board: Record<string, { nombre: string; descuento: number; vigente: boolean }[]> = {
  'branch-principal': [
    { nombre: 'Lunes zen', descuento: 12, vigente: true }
  ],
  'branch-norte': [
    { nombre: 'Norte VIP', descuento: 15, vigente: true }
  ]
}

export const points_summary: Record<string, { cliente: string; puntos: number }[]> = {
  'branch-principal': [
    { cliente: 'Martina', puntos: 350 }
  ],
  'branch-norte': [
    { cliente: 'Daniel', puntos: 120 }
  ]
}
