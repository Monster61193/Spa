import './index.css'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './contexts/query_client'
import { BranchProvider } from './contexts/branch.context'
import { worker } from './mocks/browser'

if (import.meta.env.DEV) {
  void worker.start()
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <QueryClientProvider client={query_client}>
    <BranchProvider>
      <App />
    </BranchProvider>
  </QueryClientProvider>
)
