import React, { useState, useCallback } from 'react';
import { useImportChallan, useImportPreview } from '../hooks/useWithholding';
import type { ImportChallanResponse, ImportPreviewResponse, PendingClient } from '../types/withholding';
import { ImportResultCard } from './ImportResultCard';
import { ConfirmAddClientDialog } from '../../../components/modals/ConfirmAddClientDialog';

interface Props {
  onSuccess?: (result: ImportChallanResponse) => void;
}

export const ChallanImportPanel: React.FC<Props> = ({ onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sectionType, setSectionType] = useState<string>('auto');
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportChallanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);

  const importChallan = useImportChallan();
  const previewMutation = useImportPreview();

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      setError(null);
      setResult(null);
      if (droppedFiles.length === 1) handlePreview(droppedFiles[0]);
    } else {
      setError('Please drop one or more PDF files');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setError(null);
      setResult(null);
      if (selectedFiles.length === 1) handlePreview(selectedFiles[0]);
    } else {
      setError('Please select valid PDF file(s)');
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
    if (files.length === 0) return;
    setError(null);
    setShowConfirmDialog(false);

    if (files.length === 1) {
      // Single file import
      try {
        const res = await importChallan.mutateAsync({
          file: files[0],
          sectionType: sectionType !== 'auto' ? sectionType : undefined,
        });
        setResult(res);
        setPreview(null);
        setPendingClients([]);
        onSuccess?.(res);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Import failed');
      }
    } else {
      // Bulk import - process each file sequentially
      const results: ImportChallanResponse[] = [];
      const errors: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const res = await importChallan.mutateAsync({
            file: files[i],
            sectionType: sectionType !== 'auto' ? sectionType : undefined,
          });
          results.push(res);
        } catch (err: any) {
          errors.push(`File ${files[i].name}: ${err?.response?.data?.detail || err?.message || 'Failed'}`);
        }
      }
      if (results.length > 0) {
        // Combine results - use last successful result for display
        const combinedResult = results[results.length - 1];
        if (errors.length > 0) {
          combinedResult.warnings.push(...errors);
        }
        setResult(combinedResult);
        setPreview(null);
        setPendingClients([]);
        onSuccess?.(combinedResult);
      } else if (errors.length > 0) {
        setError(errors.join('\n'));
      }
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
    setFiles([]);
    setPreview(null);
    setResult(null);
    setError(null);
    setSectionType('auto');
  };

  const regNo = preview?.fields?.ntn || preview?.fields?.cnic || null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Challan (236H / 153)</h3>

      {!result ? (
        <>
          {/* Section Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
            <select
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value)}
              className="w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="auto">Auto-detect</option>
              <option value="236H">236H</option>
              <option value="153">153</option>
            </select>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => document.getElementById('challan-file-input')?.click()}
          >
            <input
              id="challan-file-input"
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {files.length > 0 ? (
              <div>
                {files.length === 1 ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">{files[0].name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(files[0].size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">{files.length} files selected</p>
                    <p className="text-xs text-gray-500 mt-1">{(files.reduce((a, f) => a + f.size, 0) / 1024).toFixed(1)} KB total</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Drag & drop 236H/153 challan PDF(s) here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Select one or multiple challan PDFs (236H or 153)</p>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && preview.fields && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Data</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-gray-500">Section</dt><dd className="font-medium">{preview.fields.section_type}</dd></div>
                <div><dt className="text-gray-500">Client</dt><dd className="font-medium">{preview.fields.client_name}</dd></div>
                <div><dt className="text-gray-500">Registration No.</dt><dd className="font-medium">{regNo || '—'}</dd></div>
                <div><dt className="text-gray-500">Period</dt><dd className="font-medium">{preview.fields.period || '—'}</dd></div>
                <div><dt className="text-gray-500">Amount</dt><dd className="font-medium">{preview.fields.amount || '—'}</dd></div>
                <div><dt className="text-gray-500">Challan#</dt><dd className="font-medium">{preview.fields.challan_number || '—'}</dd></div>
                <div><dt className="text-gray-500">Payment Date</dt><dd className="font-medium">{preview.fields.payment_date || '—'}</dd></div>
                <div><dt className="text-gray-500">Payment Section</dt><dd className="font-medium">{preview.fields.payment_section || '—'}</dd></div>
                <div><dt className="text-gray-500">Section Code</dt><dd className="font-medium">{preview.fields.payment_section_code || '—'}</dd></div>
                <div className="col-span-2"><dt className="text-gray-500">Description</dt><dd className="font-medium">{preview.fields.payment_description || '—'}</dd></div>
              </dl>
              {preview.confidence && Object.values(preview.confidence).some(v => !v) && (
                <p className="mt-2 text-xs text-amber-600">
                  ⚠ Some fields could not be confidently extracted. Check PDF quality.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm whitespace-pre-line">{error}</div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleImport()}
              disabled={files.length === 0 || importChallan.isPending}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importChallan.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : `Save Data${files.length > 1 ? ` (${files.length} files)` : ''}`}
            </button>
            {files.length > 0 && (
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
