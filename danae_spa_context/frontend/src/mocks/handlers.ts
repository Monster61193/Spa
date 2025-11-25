import { rest } from 'msw'
import { appointment_catalog, branches, inventory_snapshot, points_summary, promotions_board } from './data'

export const handlers = [
  rest.get('/api/branches/mine', (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ sucursales: branches }))
  ),

  rest.get('/api/appointments', (req, res, ctx) => {
    const branchId = req.headers.get('X-Branch-Id') ?? req.url.searchParams.get('sucursalId') ?? branches[0].id
    return res(ctx.status(200), ctx.json({ items: appointment_catalog[branchId] ?? [] }))
  }),

  rest.get('/api/inventory', (req, res, ctx) => {
    const branchId = req.headers.get('X-Branch-Id') ?? req.url.searchParams.get('sucursalId') ?? branches[0].id
    return res(ctx.status(200), ctx.json({ snapshot: inventory_snapshot[branchId] ?? [] }))
  }),

  rest.get('/api/promotions/active', (req, res, ctx) => {
    const branchId = req.headers.get('X-Branch-Id') ?? req.url.searchParams.get('sucursalId') ?? branches[0].id
    return res(ctx.status(200), ctx.json({ items: promotions_board[branchId] ?? [] }))
  }),

  rest.get('/api/points/balance', (req, res, ctx) => {
    const branchId = req.headers.get('X-Branch-Id') ?? req.url.searchParams.get('sucursalId') ?? branches[0].id
    return res(ctx.status(200), ctx.json({ saldo: points_summary[branchId] ?? [] }))
  })
]
