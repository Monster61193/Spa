export type BranchStoreShape = {
  activeBranchId: string | null
  setActiveBranchId: (id: string | null) => void
  getActiveBranchId: () => string | null
}

let activeBranch: string | null = null

export const branchStore: BranchStoreShape = {
  activeBranchId: activeBranch,
  setActiveBranchId(id) {
    activeBranch = id
    this.activeBranchId = id
  },
  getActiveBranchId() {
    return activeBranch
  }
}
