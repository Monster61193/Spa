import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useClients } from './use_clients'
import { api_client } from '../api/api_client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react' // A veces necesario en tests dependiendo de la config

// Mockeamos el cliente de API
vi.mock('../api/api_client')

const crear_wrapper = () => {
  const query_client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  // Al ser .tsx, ahora sí reconoce este JSX
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={query_client}>{children}</QueryClientProvider>
  )
}

describe('useClients Hook', () => {
  it('fetch_clients obtiene datos exitosamente', async () => {
    const clientes_mock = [{ id: '1', nombre: 'Cliente Test', email: 'test@test.com' }]
    ;(api_client.get as any).mockResolvedValue({ data: { items: clientes_mock } })

    const { result } = renderHook(() => useClients(), { wrapper: crear_wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(clientes_mock)
  })
})