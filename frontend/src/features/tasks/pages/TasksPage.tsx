import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { TaskForm } from '../components/TaskForm';
import { Plus, RefreshCw } from 'lucide-react';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '../types/task';
import type { Task, TaskCreate, TaskFilters } from '../types/task';

export function TasksPage() {
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, limit: 50 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { data, isLoading, error, refetch } = useTasks(filters);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const tasks = data?.data || [];

  const handleCreate = async (formData: TaskCreate) => {
    await createMutation.mutateAsync(formData);
    setIsFormOpen(false);
  };

  const handleUpdate = async (formData: TaskCreate) => {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, data: { ...formData } });
      setEditingTask(null);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    await updateMutation.mutateAsync({ id: task.id, data: { status: newStatus } });
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      await deleteMutation.mutateAsync(task.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const opt = TASK_STATUS_OPTIONS.find((o) => o.value === status);
    return opt ? `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${opt.color}` : '';
  };

  const getPriorityBadge = (priority: string) => {
    const opt = TASK_PRIORITY_OPTIONS.find((o) => o.value === priority);
    return opt ? `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${opt.color}` : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track compliance tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isLoading} className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </button>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            className="input text-sm"
          >
            <option value="">All Statuses</option>
            {TASK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.priority || ''}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))}
            className="input text-sm"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={filters.task_type || ''}
            onChange={(e) => setFilters((f) => ({ ...f, task_type: e.target.value || undefined }))}
            className="input text-sm"
          >
            <option value="">All Types</option>
            {TASK_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-danger-500">
            <p>Failed to load tasks.</p>
            <button onClick={() => refetch()} className="mt-2 text-primary-600 hover:underline">Retry</button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No tasks found</p>
            <p className="text-sm mt-1">Create your first task to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task: Task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{task.title}</h3>
                      <span className={getPriorityBadge(task.priority)}>{task.priority}</span>
                      <span className={getStatusBadge(task.status)}>{task.status.replace('_', ' ')}</span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-600 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {task.task_type && <span>{TASK_TYPE_OPTIONS.find(o => o.value === task.task_type)?.label}</span>}
                      {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                      {task.client_name && <span>Client: {task.client_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                      className="text-xs border border-slate-200 rounded px-2 py-1"
                    >
                      {TASK_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setEditingTask(task); setIsFormOpen(true); }}
                      className="p-1.5 text-slate-400 hover:text-primary-600 rounded text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-1.5 text-slate-400 hover:text-danger-600 rounded text-xs"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {isFormOpen && (
        <TaskForm
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={() => { setIsFormOpen(false); setEditingTask(null); }}
          initialData={editingTask || undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}