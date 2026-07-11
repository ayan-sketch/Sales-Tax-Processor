export interface Task {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  task_type: 'GENERAL' | 'SALES_TAX_FILING' | 'WITHHOLDING_PAYMENT' | 'DOCUMENT_UPLOAD' | 'CLIENT_REVIEW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  client_id?: string;
  task_type?: Task['task_type'];
  priority?: Task['priority'];
  due_date?: string;
  assigned_to?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  due_date?: string;
}

export interface TaskListResponse {
  success: boolean;
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  client_id?: string;
  task_type?: string;
  search?: string;
}

export const TASK_TYPE_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SALES_TAX_FILING', label: 'Sales Tax Filing' },
  { value: 'WITHHOLDING_PAYMENT', label: 'Withholding Payment' },
  { value: 'DOCUMENT_UPLOAD', label: 'Document Upload' },
  { value: 'CLIENT_REVIEW', label: 'Client Review' },
];

export const TASK_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-slate-100 text-slate-600' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];