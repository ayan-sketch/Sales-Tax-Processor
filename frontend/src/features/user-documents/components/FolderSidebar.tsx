import { useState, useEffect, useCallback } from 'react'
import { Folder, FolderPlus, FolderOpen, ChevronRight, ChevronDown, MoreHorizontal, Pencil, Trash2, Plus, Loader2, FileText } from 'lucide-react'
import { userDocumentService } from '../services/userDocumentService'
import type { FolderNode } from '../types/userDocument'

interface FolderSidebarProps {
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
  onRefresh: () => void
}

function FolderTreeNode({
  node,
  depth,
  selectedFolderId,
  onSelectFolder,
  onRename,
  onDelete,
  onAddChild,
}: {
  node: FolderNode
  depth: number
  selectedFolderId: string | null
  onSelectFolder: (id: string) => void
  onRename: (folder: FolderNode) => void
  onDelete: (folder: FolderNode) => void
  onAddChild: (parentId: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = node.children.length > 0
  const isSelected = selectedFolderId === node.id

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors ${
          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelectFolder(node.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="p-0.5 rounded hover:bg-gray-200 shrink-0"
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
        </button>
        {isSelected ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-blue-500" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-gray-400" />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id) }}
            className="p-0.5 rounded hover:bg-gray-200"
            title="Add subfolder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRename(node) }}
            className="p-0.5 rounded hover:bg-gray-200"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node) }}
            className="p-0.5 rounded hover:bg-red-100 text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderSidebar({ selectedFolderId, onSelectFolder, onRefresh }: FolderSidebarProps) {
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [loading, setLoading] = useState(true)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userDocumentService.getFolderTree()
      setFolders(data)
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await userDocumentService.createFolder(newFolderName.trim(), parentIdForNew ?? undefined)
      setNewFolderName('')
      setShowNewInput(false)
      setParentIdForNew(null)
      await loadFolders()
      onRefresh()
    } catch { }
  }

  const handleRename = async (id: string) => {
    if (!renaming || !renaming.name.trim()) return
    try {
      await userDocumentService.renameFolder(id, renaming.name.trim())
      setRenaming(null)
      await loadFolders()
    } catch { }
  }

  const handleDelete = async (folder: FolderNode) => {
    if (!window.confirm(`Delete folder "${folder.name}" and all its contents?`)) return
    try {
      await userDocumentService.deleteFolder(folder.id)
      if (selectedFolderId === folder.id) onSelectFolder(null)
      await loadFolders()
      onRefresh()
    } catch { }
  }

  const handleAddChild = (parentId: string) => {
    setParentIdForNew(parentId)
    setShowNewInput(true)
  }

  return (
    <div className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          My Folders
        </h2>
        <button
          onClick={() => { setParentIdForNew(null); setShowNewInput(true) }}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="New folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {showNewInput && (
        <div className="px-3 py-2 border-b border-gray-100">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') { setShowNewInput(false); setNewFolderName(''); setParentIdForNew(null) }
            }}
            placeholder={parentIdForNew ? 'Subfolder name...' : 'Folder name...'}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : folders.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No folders yet</p>
          </div>
        ) : (
          <div>
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg cursor-pointer transition-colors mx-2 ${
                selectedFolderId === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => onSelectFolder(null)}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">All Documents</span>
            </div>
            <div className="mt-1">
              {folders.map((folder) => (
                <FolderTreeNode
                  key={folder.id}
                  node={folder}
                  depth={0}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onRename={(f) => setRenaming({ id: f.id, name: f.name })}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {renaming && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setRenaming(null)}>
          <div className="bg-white rounded-xl p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Rename Folder</h3>
            <input
              autoFocus
              value={renaming.name}
              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(renaming.id)
                if (e.key === 'Escape') setRenaming(null)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenaming(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleRename(renaming.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
