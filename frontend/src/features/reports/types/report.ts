export interface Report {
  id: string;
  title: string;
  report_type: 'SALES_TAX_SUMMARY' | 'WITHHOLDING_SUMMARY' | 'CLIENT_LIST' | 'TAX_CALENDAR' | 'CUSTOM';
  parameters: Record<string, any>;
  generated_by: string;
  file_path: string | null;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at: string | null;
}

export interface ReportCreate {
  title: string;
  report_type: Report['report_type'];
  parameters?: Record<string, any>;
}

export interface ReportListResponse {
  success: boolean;
  data: Report[];
  total: number;
}

export const REPORT_TYPE_OPTIONS = [
  { value: 'SALES_TAX_SUMMARY', label: 'Sales Tax Summary' },
  { value: 'WITHHOLDING_SUMMARY', label: 'Withholding Summary' },
  { value: 'CLIENT_LIST', label: 'Client List' },
  { value: 'TAX_CALENDAR', label: 'Tax Calendar' },
  { value: 'CUSTOM', label: 'Custom Report' },
];