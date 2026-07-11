import React, { useState, useCallback } from 'react';
import { useImportStatement, useImportPreview } from '../hooks/useWithholding';
import type { ImportStatementResponse, ImportPreviewResponse, PendingClient } from '../types/withholding';
import { ImportResultCard } from './ImportResultCard';
import { ConfirmAddClientDialog } from '../../../components/modals/ConfirmAddClientDialog';

interface Props {
  onSuccess?: (result: ImportStatementResponse) => void;
}

export const StatementImportPanel: React.FC<Props> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportStatementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);

  const importStatement = useImportStatement();
  const previewMutation = useImportPreview();

  const acceptedTypes = '.pdf,.xlsx,.xls,.csv';

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
        handlePreview(droppedFile);
      } else {
        setError('Please drop a valid PDF or Excel file');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'xlsx', 'xls', 'csv'].includes(ext || '')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
        handlePreview(selectedFile);
      } else {
        setError('Please select a valid PDF or Excel file');
      }
    }
  }, []);

  const handlePreview = async (f: File) => {
    try {
      const res = await previewMutation.mutateAsync(f);
      setPreview(res);
      
      // Check for pending clients
      if (res.pending_clients && res.pending_clients.length > 0) {
        setPendingClients(res.pending_clients);
        setShowConfirmDialog(true);
      }
    } catch (err: any) {
      setPreview(null);
    }
  };

  const handleImport = async (_approvedClients?: PendingClient[]) => {
    if (!file) return;
    setError(null);
    setShowConfirmDialog(false);
    
    try {
      // Backend auto-creates approved clients during import
      const res = await importStatement.mutateAsync(file);
      setResult(res);
      setPreview(null);
      setPendingClients([]);
      onSuccess?.(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Import failed');
    }
  };

  const handleConfirmClients = (approved: PendingClient[]) => {
    handleImport(approved);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingClients([]);
    reset();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Withholding Statement</h3>

      {!result ? (
        <>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => document.getElementById('statement-file-input')?.click()}
          >
            <input
              id="statement-file-input"
              type="file"
              accept={acceptedTypes}
              className="hidden"
              onChange={handleFileSelect}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Drag & drop a statement file here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, Excel (.xlsx, .xls), or CSV</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && preview.rows && preview.rows.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Preview — {preview.parsed_rows} rows detected
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1 pr-2">#</th>
                      <th className="text-left py-1 pr-2">NTN</th>
                      <th className="text-left py-1 pr-2">Name</th>
                      <th className="text-left py-1 pr-2">Section</th>
                      <th className="text-left py-1 pr-2">Period</th>
                      <th className="text-right py-1 pr-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-1 pr-2 text-gray-500">{row.line_number}</td>
                        <td className="py-1 pr-2 font-mono">{row.ntn || '—'}</td>
                        <td className="py-1 pr-2">{row.client_name || '—'}</td>
                        <td className="py-1 pr-2">{row.section_type || '—'}</td>
                        <td className="py-1 pr-2">{row.period || '—'}</td>
                        <td className="py-1 pr-2 text-right">{row.amount || '—'}</td>
                      </tr>
                    ))}
                    {(preview.rows.length || 0) > 10 && (
                      <tr>
                        <td colSpan={6} className="py-2 text-center text-gray-400">
                          ... and {(preview.rows.length || 0) - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {preview.errors && preview.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-amber-600 text-xs">Parse warnings:</p>
                  <ul className="list-disc list-inside text-amber-600 text-xs">
                    {preview.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleImport()}
              disabled={!file || importStatement.isPending}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importStatement.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </span>
              ) : 'Import Statement'}
            </button>
            {file && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      ) : (
        <ImportResultCard result={result} onReset={reset} />
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingClients.length > 0 && (
        <ConfirmAddClientDialog
          clients={pendingClients}
          onConfirm={handleConfirmClients}
          onCancel={handleCancelConfirm}
        />
      )}
    </div>
  );
};