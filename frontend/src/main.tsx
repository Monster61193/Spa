import './index.css'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './contexts/query_client'
import { BranchProvider } from './contexts/branch.context'
import { AuthProvider } from './contexts/auth.context'
import { ThemeProvider } from './contexts/theme.context'

// NOTA: Comentamos los mocks para que el frontend hable con tu backend real en localhost:3000
// import { worker } from './mocks/browser'
// if (import.meta.env.DEV) {
//   void worker.start()
// }

createRoot(document.getElementById('root') as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <BranchProvider>
        <App />
      </BranchProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
)