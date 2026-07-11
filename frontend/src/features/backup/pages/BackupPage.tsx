import { useState } from 'react';
import { useBackups, useCreateBackup, useRestoreBackup, useDeleteBackup } from '../hooks/useBackups';
import { RefreshCw, Upload, Download, Trash2, RotateCcw, HardDrive } from 'lucide-react';
import type { Backup } from '../types/backup';

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BackupPage() {
  const { data: backups, isLoading, error, refetch } = useBackups();
  const createMutation = useCreateBackup();
  const restoreMutation = useRestoreBackup();
  const deleteMutation = useDeleteBackup();
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    try {
      await createMutation.mutateAsync();
    } catch (err) {
      console.error('Failed to create backup:', err);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      setRestoreConfirmId(null);
      alert('System restored successfully!');
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handleDelete = async (backup: Backup) => {
    if (window.confirm(`Delete backup "${backup.backup_name}"? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(backup.id);
      } catch (err) {
        console.error('Failed to delete backup:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Backup & Restore</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage system backups</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isLoading} className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={createMutation.isPending}
            className="btn-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Backups</p>
              <p className="text-2xl font-bold text-slate-900">{backups?.length || 0}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {backups?.filter((b: Backup) => b.status === 'success').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Failed</p>
              <p className="text-2xl font-bold text-danger-600">
                {backups?.filter((b: Backup) => b.status === 'failed').length || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Latest Backup</p>
              <p className="text-sm font-semibold text-slate-900">
                {backups && backups.length > 0
                  ? formatDate(backups[0].backup_date)
                  : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <HardDrive className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Backup History</h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-danger-500">
              <p>Failed to load backups. Please try again.</p>
              <button onClick={() => refetch()} className="mt-2 text-primary-600 hover:underline">Retry</button>
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-400">No backups yet</p>
              <p className="text-sm mt-1">Create your first backup to protect your data</p>
              <button onClick={handleCreateBackup} disabled={createMutation.isPending} className="btn-primary mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Create Backup
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup: Backup) => (
                    <tr key={backup.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{backup.backup_name}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(backup.backup_date)}</td>
                      <td className="py-3 px-4 text-slate-600">{formatSize(backup.backup_size)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          backup.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : backup.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status.charAt(0).toUpperCase() + backup.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {restoreConfirmId === backup.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-danger-600">Confirm restore?</span>
                              <button
                                onClick={() => handleRestore(backup.id)}
                                disabled={restoreMutation.isPending}
                                className="btn-danger text-xs px-2 py-1"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setRestoreConfirmId(null)}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setRestoreConfirmId(backup.id)}
                                className="text-primary-600 hover:text-primary-800 p-1"
                                title="Restore"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(backup)}
                                className="text-danger-500 hover:text-danger-700 p-1"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}