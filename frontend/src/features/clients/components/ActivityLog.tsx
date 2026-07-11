import { format } from 'date-fns';
import { Clock, UserPlus, Edit, FileText, DollarSign, Trash2, Archive, Upload, Download } from 'lucide-react';
import type { ClientActivity } from '../types/client';

interface ActivityLogProps {
  activities: ClientActivity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  created: <UserPlus className="h-4 w-4 text-green-600" />,
  updated: <Edit className="h-4 w-4 text-blue-600" />,
  deleted: <Trash2 className="h-4 w-4 text-red-600" />,
  sales_tax_filed: <FileText className="h-4 w-4 text-primary-600" />,
  withholding_filed: <DollarSign className="h-4 w-4 text-primary-600" />,
  document_uploaded: <Upload className="h-4 w-4 text-purple-600" />,
  document_downloaded: <Download className="h-4 w-4 text-cyan-600" />,
  archived: <Archive className="h-4 w-4 text-amber-600" />,
};

const activityLabels: Record<string, string> = {
  created: 'Client Created',
  updated: 'Client Updated',
  deleted: 'Client Deleted',
  sales_tax_filed: 'Sales Tax Filed',
  withholding_filed: 'Withholding Filed',
  document_uploaded: 'Document Uploaded',
  document_downloaded: 'Document Downloaded',
  archived: 'Client Archived',
};

export function ActivityLog({ activities }: ActivityLogProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-6">
        {activities.map((activity, index) => (
          <li key={activity.id || index} className="relative pb-6">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="p-1.5 rounded-full bg-slate-100">
                  {(activity.action_type && activityIcons[activity.action_type]) || (
                    <Clock className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {(activity.action_type && activityLabels[activity.action_type]) || activity.action || activity.action_type || 'Activity'}
                </p>
                {activity.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {activity.description}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {activity.created_at
                    ? format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')
                    : 'Unknown time'}
                </p>
              </div>

              {/* Performed by */}
              {activity.performed_by && (
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {activity.performed_by}
                </span>
              )}
            </div>

            {/* Connector line */}
            {index < activities.length - 1 && (
              <div className="absolute left-5 top-8 -bottom-0 w-px bg-slate-200" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}