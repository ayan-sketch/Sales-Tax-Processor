import { create } from 'zustand'
import type {
  DocumentCategory,
  DocumentType,
  FilingStatus,
  SortField,
  SortOrder,
} from '../types/document'

interface FilterState {
  // Active filters
  searchQuery: string
  docCategories: DocumentCategory[]
  taxYear: number | null
  taxMonths: number[]
  clientIds: string[]
  filingStatus: FilingStatus | null
  fileType: DocumentType | null
  uploadDateFrom: string | null
  uploadDateTo: string | null
  isMissing: boolean

  // Sort
  sortBy: SortField
  sortOrder: SortOrder

  // Folder
  folderPath: string | null

  // UI state
  isFilterPanelOpen: boolean
  activeFilterCount: number

  // Actions
  setSearchQuery: (query: string) => void
  setDocCategories: (categories: DocumentCategory[]) => void
  toggleDocCategory: (category: DocumentCategory) => void
  setTaxYear: (year: number | null) => void
  setTaxMonths: (months: number[]) => void
  toggleTaxMonth: (month: number) => void
  setClientIds: (ids: string[]) => void
  toggleClientId: (id: string) => void
  setFilingStatus: (status: FilingStatus | null) => void
  setFileType: (type: DocumentType | null) => void
  setUploadDateRange: (from: string | null, to: string | null) => void
  setIsMissing: (missing: boolean) => void
  setSortBy: (field: SortField) => void
  setSortOrder: (order: SortOrder) => void
  setFolderPath: (path: string | null) => void
  setFilterPanelOpen: (open: boolean) => void

  // Compound actions
  resetFilters: () => void
  hasActiveFilters: () => boolean
  getActiveFilterCount: () => number
}

const initialState = {
  searchQuery: '',
  docCategories: [] as DocumentCategory[],
  taxYear: null as number | null,
  taxMonths: [] as number[],
  clientIds: [] as string[],
  filingStatus: null as FilingStatus | null,
  fileType: null as DocumentType | null,
  uploadDateFrom: null as string | null,
  uploadDateTo: null as string | null,
  isMissing: false,
  sortBy: 'upload_date' as SortField,
  sortOrder: 'desc' as SortOrder,
  folderPath: null as string | null,
  isFilterPanelOpen: false,
}

function countActiveFilters(state: typeof initialState): number {
  let count = 0
  if (state.searchQuery) count++
  if (state.docCategories.length > 0) count++
  if (state.taxYear !== null) count++
  if (state.taxMonths.length > 0) count++
  if (state.clientIds.length > 0) count++
  if (state.filingStatus !== null) count++
  if (state.fileType !== null) count++
  if (state.uploadDateFrom !== null || state.uploadDateTo !== null) count++
  if (state.isMissing) count++
  if (state.folderPath !== null) count++
  return count
}

export const useFilterStore = create<FilterState>((set, get) => ({
  ...initialState,
  activeFilterCount: 0,

  setSearchQuery: (query) =>
    set((state) => {
      const next = { ...state, searchQuery: query }
      return { searchQuery: query, activeFilterCount: countActiveFilters(next) }
    }),

  setDocCategories: (categories) =>
    set((state) => {
      const next = { ...state, docCategories: categories }
      return { docCategories: categories, activeFilterCount: countActiveFilters(next) }
    }),

  toggleDocCategory: (category) =>
    set((state) => {
      const categories = state.docCategories.includes(category)
        ? state.docCategories.filter((c) => c !== category)
        : [...state.docCategories, category]
      const next = { ...state, docCategories: categories }
      return { docCategories: categories, activeFilterCount: countActiveFilters(next) }
    }),

  setTaxYear: (year) =>
    set((state) => {
      const next = { ...state, taxYear: year }
      return { taxYear: year, activeFilterCount: countActiveFilters(next) }
    }),

  setTaxMonths: (months) =>
    set((state) => {
      const next = { ...state, taxMonths: months }
      return { taxMonths: months, activeFilterCount: countActiveFilters(next) }
    }),

  toggleTaxMonth: (month) =>
    set((state) => {
      const months = state.taxMonths.includes(month)
        ? state.taxMonths.filter((m) => m !== month)
        : [...state.taxMonths, month]
      const next = { ...state, taxMonths: months }
      return { taxMonths: months, activeFilterCount: countActiveFilters(next) }
    }),

  setClientIds: (ids) =>
    set((state) => {
      const next = { ...state, clientIds: ids }
      return { clientIds: ids, activeFilterCount: countActiveFilters(next) }
    }),

  toggleClientId: (id) =>
    set((state) => {
      const ids = state.clientIds.includes(id)
        ? state.clientIds.filter((i) => i !== id)
        : [...state.clientIds, id]
      const next = { ...state, clientIds: ids }
      return { clientIds: ids, activeFilterCount: countActiveFilters(next) }
    }),

  setFilingStatus: (status) =>
    set((state) => {
      const next = { ...state, filingStatus: status }
      return { filingStatus: status, activeFilterCount: countActiveFilters(next) }
    }),

  setFileType: (type) =>
    set((state) => {
      const next = { ...state, fileType: type }
      return { fileType: type, activeFilterCount: countActiveFilters(next) }
    }),

  setUploadDateRange: (from, to) =>
    set((state) => {
      const next = { ...state, uploadDateFrom: from, uploadDateTo: to }
      return {
        uploadDateFrom: from,
        uploadDateTo: to,
        activeFilterCount: countActiveFilters(next),
      }
    }),

  setIsMissing: (missing) =>
    set((state) => {
      const next = { ...state, isMissing: missing }
      return { isMissing: missing, activeFilterCount: countActiveFilters(next) }
    }),

  setSortBy: (field) => set({ sortBy: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFolderPath: (path) =>
    set((state) => {
      const next = { ...state, folderPath: path }
      return { folderPath: path, activeFilterCount: countActiveFilters(next) }
    }),

  setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

  resetFilters: () => set({ ...initialState, activeFilterCount: 0, isFilterPanelOpen: false }),

  hasActiveFilters: () => countActiveFilters(get()) > 0,

  getActiveFilterCount: () => countActiveFilters(get()),
}))