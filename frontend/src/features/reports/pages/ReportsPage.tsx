import { useState } from 'react';
import { useReports, useGenerateReport, useDeleteReport } from '../hooks/useReports';
import { RefreshCw, Plus, Download, Trash2 } from 'lucide-react';
import { REPORT_TYPE_OPTIONS } from '../types/report';
import { reportService } from '../services/reportService';
import type { Report, ReportCreate } from '../types/report';

export function ReportsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data, isLoading, error, refetch } = useReports();
  const generateMutation = useGenerateReport();
  const deleteMutation = useDeleteReport();

  const reports = data?.data || [];

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await generateMutation.mutateAsync({
      title: formData.get('title') as string,
      report_type: formData.get('report_type') as ReportCreate['report_type'],
    });
    setIsFormOpen(false);
  };

  const handleDownload = async (report: Report) => {
    try {
      const blob = await reportService.download(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.${report.file_path?.split('.').pop() || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      GENERATING: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and download compliance reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isLoading} className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </button>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />Generate Report
          </button>
        </div>
      </div>

      {/* Generate Report Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsFormOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Report</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input type="text" name="title" required className="input w-full" placeholder="Report title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Type *</label>
                <select name="report_type" required className="input w-full">
                  {REPORT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={generateMutation.isPending} className="btn-primary">
                  {generateMutation.isPending ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-danger-500">
            <p>Failed to load reports.</p>
            <button onClick={() => refetch()} className="mt-2 text-primary-600 hover:underline">Retry</button>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No reports yet</p>
            <p className="text-sm mt-1">Generate your first report</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report: Report) => (
              <div key={report.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{report.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {REPORT_TYPE_OPTIONS.find(o => o.value === report.report_type)?.label}
                    </p>
                    <span className={getStatusBadge(report.status)}>{report.status}</span>
                    <p className="text-xs text-slate-400 mt-2">
                      Created: {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {report.status === 'COMPLETED' && (
                      <button onClick={() => handleDownload(report)} className="btn-secondary p-2">
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => {
                      if (window.confirm(`Delete report "${report.title}"?`)) {
                        deleteMutation.mutate(report.id);
                      }
                    }} className="btn-secondary p-2 text-danger-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}