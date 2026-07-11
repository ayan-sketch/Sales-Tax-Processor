import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { salesTaxRecordCreateSchema, type SalesTaxRecordCreateFormData } from '../validations/salesTaxSchema';
import type { SalesTaxRecord } from '../types/salesTax';
import { MONTHS } from '../types/salesTax';

interface SalesTaxFormProps {
  onSubmit: (data: SalesTaxRecordCreateFormData) => void;
  onCancel: () => void;
  clients: { id: string; client_name: string }[];
  editRecord?: SalesTaxRecord | null;
  presetYear?: number;
  presetMonth?: number;
  loading?: boolean;
}

export function SalesTaxForm({ onSubmit, onCancel, clients, editRecord, presetYear, presetMonth, loading }: SalesTaxFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesTaxRecordCreateFormData>({
    resolver: zodResolver(salesTaxRecordCreateSchema),
    defaultValues: {
      client_id: '',
      filing_year: new Date().getFullYear(),
      filing_month: new Date().getMonth() + 1,
      status: 'Not Filed',
      filing_date: null,
      remarks: null,
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (editRecord?.id) {
      reset({
        client_id: editRecord.client_id,
        filing_year: editRecord.filing_year,
        filing_month: editRecord.filing_month,
        status: editRecord.status,
        filing_date: editRecord.filing_date || null,
        remarks: editRecord.remarks || null,
      });
    } else if (presetYear || presetMonth) {
      reset({
        client_id: clients[0]?.id || '',
        filing_year: presetYear || new Date().getFullYear(),
        filing_month: presetMonth || new Date().getMonth() + 1,
        status: 'Not Filed',
        filing_date: null,
        remarks: null,
      });
    }
  }, [editRecord, presetYear, presetMonth, clients, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('sales-tax-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFormSubmit = (data: SalesTaxRecordCreateFormData) => {
    // Attach file to form data if selected
    const formDataWithFile = { ...data, file: selectedFile };
    onSubmit(formDataWithFile as any);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="label">Client</label>
        <select {...register('client_id')} className="input">
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client_name}
            </option>
          ))}
        </select>
        {errors.client_id && <p className="text-sm text-red-500 mt-1">{errors.client_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Year</label>
          <select {...register('filing_year', { valueAsNumber: true })} className="input">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {errors.filing_year && <p className="text-sm text-red-500 mt-1">{errors.filing_year.message}</p>}
        </div>
        <div>
          <label className="label">Month</label>
          <select {...register('filing_month', { valueAsNumber: true })} className="input">
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          {errors.filing_month && <p className="text-sm text-red-500 mt-1">{errors.filing_month.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Status</label>
        <select {...register('status')} className="input">
          <option value="Not Filed">Not Filed</option>
          <option value="Pending">Pending</option>
          <option value="Filed">Filed</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      <div>
        <label className="label">Filing Date</label>
        <input type="date" {...register('filing_date')} className="input" />
      </div>

      <div>
        <label className="label">Remarks</label>
        <textarea {...register('remarks')} rows={3} className="input" placeholder="Optional remarks..." />
      </div>

      {/* File Upload Section */}
      <div>
        <label className="label">Supporting Document (Optional)</label>
        <div className="mt-1">
          {!selectedFile ? (
            <label
              htmlFor="sales-tax-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-slate-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">Click to upload PDF or Excel</p>
                <p className="text-xs text-slate-400 mt-1">PDF, XLSX, or XLS files accepted</p>
              </div>
              <input
                id="sales-tax-file"
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
                <span className="text-xs text-slate-400">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Upload return form, challan, or other supporting documents
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : editRecord ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
}
