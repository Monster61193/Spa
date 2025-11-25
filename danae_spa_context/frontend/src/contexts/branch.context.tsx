import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/api_client'
import { branchStore } from './branch_store'

type Branch = {
  id: string
  nombre: string
}

type BranchContextShape = {
  branches: Branch[]
  activeBranch: Branch | null
  setActiveBranch: (branchId: string) => void
  isLoading: boolean
}

const BranchContext = createContext<BranchContextShape | undefined>(undefined)

const fetchBranches = async () => {
  const response = await apiClient.get('/branches/mine')
  return response.data.sucursales as Branch[]
}

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { data: branches = [], isLoading } = useQuery(['branch', 'branches'], fetchBranches)
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!activeBranch && branches.length > 0) {
      setActiveBranchState(branches[0])
    }
  }, [branches, activeBranch])

  useEffect(() => {
    branchStore.setActiveBranchId(activeBranch?.id ?? null)
    queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'branch' })
  }, [activeBranch, queryClient])

  const value = useMemo(
    () => ({
      branches,
      activeBranch,
      setActiveBranch: (branchId: string) => {
        const target = branches.find((branch) => branch.id === branchId)
        if (target) {
          setActiveBranchState(target)
        }
      },
      isLoading: isLoading
    }),
    [branches, activeBranch, isLoading, setActiveBranchState]
  )

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}

export const useBranch = () => {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}
