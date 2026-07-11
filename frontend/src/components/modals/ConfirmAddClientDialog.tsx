import React from 'react';
import { AlertTriangle, User, FileText, CreditCard } from 'lucide-react';

export interface PendingClient {
  client_name: string;
  ntn?: string | null;
  cnic?: string | null;
}

interface ConfirmAddClientDialogProps {
  clients: PendingClient[];
  onConfirm: (approvedClients: PendingClient[]) => void;
  onCancel: () => void;
}

export function ConfirmAddClientDialog({ clients, onConfirm, onCancel }: ConfirmAddClientDialogProps) {
  const [selectedClients, setSelectedClients] = React.useState<Set<number>>(
    new Set(clients.map((_, idx) => idx))
  );

  const toggleClient = (index: number) => {
    const newSet = new Set(selectedClients);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedClients(newSet);
  };

  const handleConfirm = () => {
    const approved = clients.filter((_, idx) => selectedClients.has(idx));
    onConfirm(approved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                New Clients Detected
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                The following {clients.length === 1 ? 'person was' : `${clients.length} people were`} not found in your client database. 
                Select which ones you want to add automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {clients.map((client, idx) => (
              <label
                key={idx}
                className={`block p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedClients.has(idx)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(idx)}
                    onChange={() => toggleClient(idx)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">
                        {client.client_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">NTN:</span>
                        <span className="font-mono">{client.ntn || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">CNIC:</span>
                        <span className="font-mono">{client.cnic || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {selectedClients.size} of {clients.length} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel Import
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedClients.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedClients.size > 0 ? `${selectedClients.size} ` : ''}Client{selectedClients.size !== 1 ? 's' : ''} & Import
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
