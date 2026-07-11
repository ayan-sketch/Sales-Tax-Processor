import React from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { useDocumentStore } from '../stores/useDocumentStore'
import type { ViewMode } from '../types/document'

const options: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'list', icon: <List className="h-4 w-4" />, label: 'List view' },
  { value: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: 'Grid view' },
]

export function ViewToggle() {
  const viewMode = useDocumentStore((s) => s.viewMode)
  const setViewMode = useDocumentStore((s) => s.setViewMode)

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          title={opt.label}
          onClick={() => setViewMode(opt.value)}
          className={`
            inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150
            ${viewMode === opt.value
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }
          `}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}