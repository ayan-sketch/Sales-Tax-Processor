export type SalesTaxStatus = 'Filed' | 'Pending' | 'Not Filed' | 'Overdue';

export interface SalesTaxRecord {
  id: string;
  client_id: string;
  client_name?: string;
  filing_year: number;
  filing_month: number;
  status: SalesTaxStatus;
  filing_date: string | null;
  remarks: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesTaxRecordCreate {
  client_id: string;
  filing_year: number;
  filing_month: number;
  status?: SalesTaxStatus;
  filing_date?: string | null;
  remarks?: string | null;
}

export interface SalesTaxRecordUpdate {
  status?: SalesTaxStatus;
  filing_date?: string | null;
  remarks?: string | null;
}

export interface SalesTaxListResponse {
  success: boolean;
  data: SalesTaxRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesTaxFilters {
  page?: number;
  limit?: number;
  client_id?: string;
  year?: number;
  month?: number;
  status?: SalesTaxStatus;
  sales_tax_registered_only?: boolean;
}

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const STATUS_COLORS: Record<SalesTaxStatus, string> = {
  Filed: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  'Not Filed': 'bg-red-100 text-red-800',
  Overdue: 'bg-red-100 text-red-800',
};

export const STATUS_LABELS: Record<SalesTaxStatus, string> = {
  Filed: 'Filed',
  Pending: 'Pending',
  'Not Filed': 'Not Filed',
  Overdue: 'Overdue',
};