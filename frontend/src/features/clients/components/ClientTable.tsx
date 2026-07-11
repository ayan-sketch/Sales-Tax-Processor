import type { Client } from '../types/client';
import { format } from 'date-fns';
import {
  Edit,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

function SortableHeader({
  columnId,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  columnId: string;
  label: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}) {
  if (!onSort) return <>{label}</>;
  return (
    <button
      type="button"
      onClick={() => onSort(columnId)}
      className="inline-flex items-center hover:text-primary-600 transition-colors"
    >
      {label}
      {sortBy === columnId && (
        sortOrder === 'asc'
          ? <ChevronUp className="h-3.5 w-3.5 ml-1" />
          : <ChevronDown className="h-3.5 w-3.5 ml-1" />
      )}
    </button>
  );
}

export function ClientTable({
  clients,
  onEdit,
  onDelete,
  onView,
  sortBy,
  sortOrder,
  onSort,
}: ClientTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <SortableHeader columnId="client_name" label="Client Name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <SortableHeader columnId="business_name" label="Business Name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <SortableHeader columnId="ntn" label="NTN" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">CNIC</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">STRN</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">City</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Sales Tax</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Withholding</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <SortableHeader columnId="created_at" label="Created" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                No clients found
              </td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onView(client)}
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{client.client_name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{client.business_name || '-'}</td>
                <td className="px-4 py-3 text-sm font-mono">{client.ntn || '-'}</td>
                <td className="px-4 py-3 text-sm font-mono">{client.cnic || '-'}</td>
                <td className="px-4 py-3 text-sm font-mono">{client.strn || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{client.city || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    client.sales_tax_registered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.sales_tax_registered ? 'Registered' : 'Not Registered'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    client.withholding_registered ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.withholding_registered ? 'Registered' : 'Not Registered'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    (client.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(client.is_active ?? true) ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(client)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="p-1.5 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(client)}
                      className="p-1.5 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
