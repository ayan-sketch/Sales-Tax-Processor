import { useState } from 'react';
import { X } from 'lucide-react';
import { TASK_TYPE_OPTIONS, TASK_PRIORITY_OPTIONS } from '../types/task';
import type { TaskCreate, Task } from '../types/task';

interface TaskFormProps {
  onSubmit: (data: TaskCreate) => Promise<void>;
  onClose: () => void;
  initialData?: Task;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, onClose, initialData, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [clientId, setClientId] = useState(initialData?.client_id || '');
  const [taskType, setTaskType] = useState<'GENERAL' | 'SALES_TAX_FILING' | 'WITHHOLDING_PAYMENT' | 'DOCUMENT_UPLOAD' | 'CLIENT_REVIEW'>(initialData?.task_type || 'GENERAL');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>(initialData?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(initialData?.due_date?.split('T')[0] || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description: description || undefined,
      client_id: clientId || undefined,
      task_type: taskType as TaskCreate['task_type'],
      priority: priority as TaskCreate['priority'],
      due_date: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialData ? 'Edit Task' : 'Create Task'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value as typeof taskType)} className="input w-full">
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="input w-full">
                {TASK_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input w-full"
              placeholder="Optional client UUID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!title || isLoading} className="btn-primary">
              {isLoading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}