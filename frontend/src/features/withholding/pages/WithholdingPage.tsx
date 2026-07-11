import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWithholdingRecords, useCreateWithholdingRecord, useUpdateWithholdingRecord, useDeleteWithholdingRecord } from '../hooks/useWithholding';
import { useClients } from '../../clients/hooks/useClients';
import { WithholdingTable } from '../components/WithholdingTable';
import { WithholdingForm } from '../components/WithholdingForm';
import { ChallanImportPanel } from '../components/ChallanImportPanel';
import { StatementImportPanel } from '../components/StatementImportPanel';
import { buildMasterSheetData } from '../utils/masterSheet';
import type { WithholdingRecord, WithholdingFilters } from '../types/withholding';
import type { WithholdingRecordCreateFormData } from '../validations/withholdingSchema';

export function WithholdingPage() {
  const [page, setPage] = useState(1);
  const [filters] = useState<WithholdingFilters>({ page, limit: 25 });
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<WithholdingRecord | null>(null);
  const [showImport, setShowImport] = useState<'challan' | 'statement' | null>(null);

  const { data, isLoading, refetch: refetchPageData } = useWithholdingRecords({ ...filters, page });
  const { data: allRecordsData, refetch: refetchAllRecords } = useWithholdingRecords({ page: 1, limit: 1000, withholding_registered_only: false });
  const { data: clientsData } = useClients({ limit: 1000 });
  const { data: withholdingClientsData, refetch: refetchWithholdingClients } = useClients({ limit: 1000, withholding_registered: true });
  const createMutation = useCreateWithholdingRecord();
  const updateMutation = useUpdateWithholdingRecord();
  const deleteMutation = useDeleteWithholdingRecord();

  const clients = clientsData?.data || [];
  const withholdingClients = withholdingClientsData?.data || [];
  const masterSheetDate = new Date();
  const fiscalYearStart = masterSheetDate.getMonth() + 1 >= 7 ? masterSheetDate.getFullYear() : masterSheetDate.getFullYear() - 1;
  const fiscalYearLabel = `${fiscalYearStart}-${String(fiscalYearStart + 1).slice(-2)}`;
  const masterSheetData = useMemo(() => buildMasterSheetData(
    withholdingClients.map((client: { id: string; client_name: string }) => ({ id: client.id, client_name: client.client_name })),
    (allRecordsData?.data || []).map((record: WithholdingRecord) => ({
      client_id: record.client_id,
      section_type: record.section_type,
      period: record.period,
      challan_number: record.challan_number,
      payment_date: record.payment_date,
      remarks: record.remarks,
    })),
    masterSheetDate,
  ), [withholdingClients, allRecordsData?.data, masterSheetDate]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const downloadMasterSheet = () => {
    const heading = ['Client'];
    masterSheetData[0]?.months.forEach((month) => {
      heading.push(`${month.label} Filed`, `${month.label} Notes`);
    });

    const rows = masterSheetData.map((row) => [
      row.clientName,
      ...row.months.flatMap((month) => [
        month.status === 'completed' ? 'Yes' : 'No',
        month.record?.remarks || (month.status === 'pending' ? 'Pending' : ''),
      ]),
    ]);

    const csv = [heading, ...rows].map((line) =>
      line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `withholding-master-sheet-${fiscalYearLabel}.csv`);
  };

  const refreshMasterSheet = async () => {
    await Promise.all([refetchPageData(), refetchAllRecords(), refetchWithholdingClients()]);
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleCreate = () => {
    setEditRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: WithholdingRecord) => {
    setEditRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this withholding record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = async (formData: WithholdingRecordCreateFormData) => {
    try {
      const payload = {
        client_id: formData.client_id,
        section_type: formData.section_type ?? '236H',
        period: formData.period ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        challan_number: formData.challan_number ?? null,
        amount: formData.amount ?? null,
        payment_date: formData.payment_date || null,
        remarks: formData.remarks || null,
      };

      if (editRecord) {
        await updateMutation.mutateAsync({
          id: editRecord.id,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      // Only close form on success
      setShowForm(false);
      setEditRecord(null);
    } catch {
      // Form stays open on error to allow correction
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditRecord(null);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Withholding Tax Records</h1>
          <p className="text-sm text-gray-500 mt-1">Manage withholding tax records for clients</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(showImport === 'challan' ? null : 'challan')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              showImport === 'challan' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Import Challan
          </button>
          <button
            onClick={() => setShowImport(showImport === 'statement' ? null : 'statement')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              showImport === 'statement' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Import Statement
          </button>
          <button onClick={handleCreate} className="btn-primary" disabled={showForm}>
            + New Record
          </button>
        </div>
      </div>

      {/* Import Panels */}
      {showImport === 'challan' && (
        <ChallanImportPanel
          onSuccess={() => setShowImport(null)}
        />
      )}
      {showImport === 'statement' && (
        <StatementImportPanel
          onSuccess={() => setShowImport(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-semibold mt-1">{data?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Section 236H</p>
          <p className="text-2xl font-semibold mt-1 text-primary-600">
            {data?.data?.filter((r: WithholdingRecord) => r.section_type === '236H').length || 0}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Section 153</p>
          <p className="text-2xl font-semibold mt-1 text-amber-600">
            {data?.data?.filter((r: WithholdingRecord) => r.section_type === '153').length || 0}
          </p>
        </div>
      </div>

      {/* Registered Withholding Clients */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Registered Withholding Clients</h2>
            <p className="text-sm text-gray-500">Clients from the database with withholding registration and preparation status.</p>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Client</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">236H Applied</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">236H Prepared By Us</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">153 Applicable</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">153 Prepared By Us</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {withholdingClients.length > 0 ? (
              withholdingClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-primary-600 transition-colors">
                      {client.client_name}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={client.withholding_236_applied} readOnly className="h-3 w-3 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={client.withholding_236_prepared_by_us} readOnly className="h-3 w-3 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={client.withholding_153_applicable} readOnly className="h-3 w-3 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" checked={client.withholding_153_prepared_by_us} readOnly className="h-3 w-3 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No withholding-registered clients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editRecord ? 'Edit Withholding Record' : 'New Withholding Record'}
            </h2>
            <WithholdingForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              clients={clients.map((c: { id: string; client_name: string }) => ({
                id: c.id,
                client_name: c.client_name,
              }))}
              editRecord={editRecord}
              loading={isMutating}
            />
          </div>
        </div>
      )}

      <div className="card p-4 overflow-x-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Withholding Master Sheet</h2>
            <p className="text-sm text-gray-500">Tax year {fiscalYearLabel} (July to June) — showing withholding-registered clients only</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button onClick={refreshMasterSheet} className="btn-secondary text-sm inline-flex items-center gap-2">
              <span>Refresh</span>
            </button>
            <button onClick={downloadMasterSheet} className="btn-primary text-sm inline-flex items-center gap-2">
              <span>Download CSV</span>
            </button>
            <button onClick={handleCreate} className="btn-secondary text-sm inline-flex items-center gap-2">
              <span>New Withholding Record</span>
            </button>
          </div>
        </div>

        <div className="min-w-[900px] overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <th className="border border-slate-200 px-3 py-2 text-left">Client / Business</th>
                {masterSheetData[0]?.months.map((month) => (
                  <th key={`${month.period}-month`} className="border border-slate-200 px-3 py-2 text-center">{month.label}</th>
                ))}
              </tr>
              </thead>
            <tbody>
              {masterSheetData.map((row) => (
                <tr key={row.clientId} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-3">
                    <Link to={`/clients/${row.clientId}`} className="font-medium text-slate-900 hover:text-primary-600 transition-colors">
                      {row.clientName}
                    </Link>
                  </td>
                  {row.months.map((month) => {
                    const isCompleted = month.status === 'completed';
                    const isPending = month.status === 'pending';
                    const cellClasses = isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isPending
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500';

                    return (
                      <td key={`${row.clientId}-${month.period}`} className={`border px-3 py-3 text-center ${cellClasses}`}>
                        <div className="flex flex-col items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-sm font-semibold">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              readOnly
                              className={`h-4 w-4 rounded-sm border ${isCompleted ? 'border-emerald-500 bg-emerald-500' : isPending ? 'border-amber-400 bg-amber-100' : 'border-slate-300 bg-slate-100'}`}
                            />
                            {isCompleted ? 'Filed' : isPending ? 'Pending' : 'Not filed'}
                          </label>
                          <span className="text-[11px] text-slate-600 max-w-[120px] break-words">
                            {month.record?.remarks || (month.status === 'pending' ? 'Awaiting challan or statement' : '')}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table */}
      <WithholdingTable
        data={data?.data || []}
        page={page}
        pageSize={filters.limit || 25}
        total={data?.total || 0}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />
    </div>
  );
}
