import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface UploadDialogProps {
  onUpload: (formData: FormData) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  defaultClientId?: string;
  hideClientIdField?: boolean;
}

export function UploadDialog({ onUpload, onClose, isLoading, defaultClientId = '', hideClientIdField = false }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState(defaultClientId);
  const [documentType, setDocumentType] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedClientId = clientId || defaultClientId;
    if (!file || !resolvedClientId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', resolvedClientId);
    if (documentType) formData.append('document_type', documentType);
    await onUpload(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!hideClientIdField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter client UUID"
                className="input w-full"
                required
              />
            </div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document Type (optional)</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="input w-full"
            >
              <option value="">General Document</option>
              <option value="SALES_TAX">Sales Tax Return</option>
              <option value="236H">Withholding 236H</option>
              <option value="153">Withholding 153</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-primary-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">
                    <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, XLSX, XLS up to 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!file || !clientId || isLoading} className="btn-primary">
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}