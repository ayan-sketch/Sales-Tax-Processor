import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, Link2, MessageSquare, Plus } from 'lucide-react';
import { useSalesTaxRecords, useCreateSalesTaxRecord, useUpdateSalesTaxRecord, useDeleteSalesTaxRecord } from '../hooks/useSalesTax';
import { useClients } from '../../clients/hooks/useClients';
import { buildSalesTaxMasterSheetRows } from '../utils/salesTaxMasterSheet';
import type { SalesTaxStatus } from '../types/salesTax';
import type { SalesTaxRecordCreateFormData } from '../validations/salesTaxSchema';

const STATUS_OPTIONS: SalesTaxStatus[] = ['Not Filed', 'Pending', 'Filed', 'Overdue'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function SalesTaxPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showInlineEditor, setShowInlineEditor] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<SalesTaxStatus>('Not Filed');
  const [draftDate, setDraftDate] = useState('');
  const [draftRemarks, setDraftRemarks] = useState('');

  const { data, isLoading, refetch } = useSalesTaxRecords({ year: selectedYear, month: selectedMonth, limit: 200 });
  const { data: clientsData } = useClients({ limit: 1000, sales_tax_registered: true });
  const createMutation = useCreateSalesTaxRecord();
  const updateMutation = useUpdateSalesTaxRecord();
  const deleteMutation = useDeleteSalesTaxRecord();

  const clients = clientsData?.data || [];
  const records = data?.data || [];
  const rows = useMemo(
    () => buildSalesTaxMasterSheetRows(clients, records, selectedYear, selectedMonth),
    [clients, records, selectedYear, selectedMonth],
  );

  const openEditor = (row: (typeof rows)[number]) => {
    setShowInlineEditor(row.clientId);
    setDraftStatus(row.status);
    setDraftDate(row.filingDate || '');
    setDraftRemarks(row.remarks || '');
  };

  const closeEditor = () => {
    setShowInlineEditor(null);
    setDraftStatus('Not Filed');
    setDraftDate('');
    setDraftRemarks('');
  };

  const saveRow = async (row: (typeof rows)[number]) => {
    try {
      if (row.hasExistingRecord && row.recordId) {
        await updateMutation.mutateAsync({
          id: row.recordId,
          data: {
            status: draftStatus,
            filing_date: draftDate || null,
            remarks: draftRemarks || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          client_id: row.clientId,
          filing_year: row.year,
          filing_month: row.month,
          status: draftStatus,
          filing_date: draftDate || null,
          remarks: draftRemarks || null,
        } as SalesTaxRecordCreateFormData);
      }
      await refetch();
      closeEditor();
    } catch {
      // Keep the current editor open so the user can fix any issue.
    }
  };

  const removeRow = async (row: (typeof rows)[number]) => {
    if (!row.recordId || !window.confirm(`Remove the sales tax record for ${row.clientName}?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(row.recordId);
      await refetch();
    } catch {
      // noop
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sales Tax Master Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">Track monthly filing status for every client and link each entry to the client database.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="input py-2 min-w-[120px]">
            {Array.from({ length: 6 }, (_, index) => currentYear - 2 + index).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input py-2 min-w-[140px]">
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Clients</p>
          <p className="text-2xl font-semibold mt-1">{clients.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Filed</p>
          <p className="text-2xl font-semibold mt-1 text-green-600">{rows.filter((row) => row.status === 'Filed').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">{rows.filter((row) => row.status === 'Pending').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Not Filed</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">{rows.filter((row) => row.status === 'Not Filed').length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{MONTHS[selectedMonth - 1]} {selectedYear}</h2>
            <p className="text-sm text-slate-500">Each row represents one client and can be updated directly.</p>
          </div>
          <div className="text-sm text-slate-500">{rows.length} clients</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Filing Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Loading master sheet...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No clients available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.clientId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary-50 p-2 text-primary-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <Link to={`/clients/${row.clientId}`} className="font-medium text-slate-900 hover:text-primary-600 transition-colors">
                            {row.clientName}
                          </Link>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            Linked to client database
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {showInlineEditor === row.clientId ? (
                        <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as SalesTaxStatus)} className="input py-2">
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.status === 'Filed' ? 'bg-green-100 text-green-800' : row.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {showInlineEditor === row.clientId ? (
                        <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} className="input py-2" />
                      ) : (
                        <span className="text-sm text-slate-700">{row.filingDate ? new Date(row.filingDate).toLocaleDateString() : '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {showInlineEditor === row.clientId ? (
                        <textarea value={draftRemarks} onChange={(e) => setDraftRemarks(e.target.value)} rows={2} className="input py-2" placeholder="Add note or remarks" />
                      ) : (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-slate-400" />
                          <span className="line-clamp-2">{row.remarks || 'No notes yet'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {showInlineEditor === row.clientId ? (
                          <>
                            <button onClick={() => saveRow(row)} disabled={isMutating} className="btn-primary text-sm">
                              Save
                            </button>
                            <button onClick={closeEditor} className="btn-secondary text-sm">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEditor(row)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                              <CalendarDays className="h-4 w-4" />
                              Update
                            </button>
                            <button onClick={() => removeRow(row)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Plus className="h-4 w-4 rotate-45" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}