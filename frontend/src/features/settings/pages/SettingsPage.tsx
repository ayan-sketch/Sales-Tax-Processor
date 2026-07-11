import { useState } from 'react';
import { useSettings, useUpdateSetting } from '../hooks/useSettings';
import { useSyncConfig, useSyncStatus, useUpdateSyncConfig, useTriggerSync } from '@/features/sync/hooks/useSync';
import { Save, RefreshCw, FolderSync, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import type { Setting } from '../types/settings';

const SETTING_GROUPS = [
  {
    title: 'System Configuration',
    description: 'General system settings and configurations',
    keys: ['company_name', 'company_address', 'company_phone', 'company_email'],
  },
  {
    title: 'Tax Defaults',
    description: 'Default tax rates and configurations',
    keys: ['default_sales_tax_rate', 'default_withholding_rate', 'tax_year_start', 'tax_year_end'],
  },
  {
    title: 'Notifications',
    description: 'Notification and alert preferences',
    keys: ['due_date_reminder_days', 'email_notifications_enabled', 'auto_backup_enabled', 'backup_frequency'],
  },
  {
    title: 'Compliance',
    description: 'Compliance related settings',
    keys: ['late_filing_penalty_rate', 'max_retroactive_months', 'audit_retention_years'],
  },
];

const SETTING_LABELS: Record<string, { label: string; type: string; placeholder: string }> = {
  company_name: { label: 'Company Name', type: 'text', placeholder: 'Enter company name' },
  company_address: { label: 'Company Address', type: 'text', placeholder: 'Enter company address' },
  company_phone: { label: 'Company Phone', type: 'text', placeholder: '+92 300 1234567' },
  company_email: { label: 'Company Email', type: 'email', placeholder: 'info@example.com' },
  default_sales_tax_rate: { label: 'Default Sales Tax Rate (%)', type: 'number', placeholder: '16' },
  default_withholding_rate: { label: 'Default Withholding Rate (%)', type: 'number', placeholder: '7.5' },
  tax_year_start: { label: 'Tax Year Start (MM-DD)', type: 'text', placeholder: '07-01' },
  tax_year_end: { label: 'Tax Year End (MM-DD)', type: 'text', placeholder: '06-30' },
  due_date_reminder_days: { label: 'Due Date Reminder (days before)', type: 'number', placeholder: '7' },
  email_notifications_enabled: { label: 'Email Notifications Enabled', type: 'checkbox', placeholder: '' },
  auto_backup_enabled: { label: 'Auto Backup Enabled', type: 'checkbox', placeholder: '' },
  backup_frequency: { label: 'Backup Frequency', type: 'text', placeholder: 'daily/weekly/monthly' },
  late_filing_penalty_rate: { label: 'Late Filing Penalty Rate (%)', type: 'number', placeholder: '2' },
  max_retroactive_months: { label: 'Max Retroactive Months', type: 'number', placeholder: '6' },
  audit_retention_years: { label: 'Audit Retention (years)', type: 'number', placeholder: '5' },
};

export function SettingsPage() {
  const { data, isLoading, error, refetch } = useSettings();
  const updateMutation = useUpdateSetting();
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const settings = data?.data || [];
  const settingsMap = new Map(settings.map((s) => [s.key, s]));

  const handleSave = async (setting: Setting) => {
    try {
      await updateMutation.mutateAsync({
        key: setting.key,
        data: { value: setting.value },
      });
      setSavedKey(setting.key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const handleToggle = async (setting: Setting) => {
    const newValue = setting.value === 'true' ? 'false' : 'true';
    await updateMutation.mutateAsync({
      key: setting.key,
      data: { value: newValue },
    });
  };

  const handleInputChange = async (key: string, value: string) => {
    await updateMutation.mutateAsync({
      key,
      data: { value },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-danger-500">
        <p>Failed to load settings. Please try again.</p>
        <button onClick={() => refetch()} className="mt-2 text-primary-600 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system configuration and preferences</p>
        </div>
        <button onClick={() => refetch()} disabled={isLoading} className="btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </button>
      </div>

      {SETTING_GROUPS.map((group) => {
        const groupSettings = group.keys
          .map((key) => settingsMap.get(key))
          .filter(Boolean) as Setting[];

        if (groupSettings.length === 0) return null;

        return (
          <div key={group.title} className="card">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{group.description}</p>
            </div>
            <div className="p-6 space-y-6">
              {groupSettings.map((setting) => {
                const meta = SETTING_LABELS[setting.key];
                if (!meta) return null;

                const isCheckbox = meta.type === 'checkbox';
                const isSaving = updateMutation.isPending && savedKey !== setting.key;

                return (
                  <div key={setting.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {meta.label}
                      </label>
                      {setting.description && (
                        <p className="text-xs text-slate-500 mb-2">{setting.description}</p>
                      )}
                      {isCheckbox ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={setting.value === 'true'}
                            onChange={() => handleToggle(setting)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-600">Enabled</span>
                        </label>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type={meta.type}
                            value={setting.value || ''}
                            onChange={(e) => {
                              setting.value = e.target.value;
                              handleInputChange(setting.key, e.target.value);
                            }}
                            onBlur={() => handleSave(setting)}
                            placeholder={meta.placeholder}
                            className="input flex-1 max-w-md"
                          />
                          {savedKey === setting.key && (
                            <span className="text-xs text-green-600 font-medium">Saved!</span>
                          )}
                          {isSaving && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" />
                          )}
                        </div>
                      )}
                    </div>
                    {!isCheckbox && (
                      <button
                        onClick={() => handleSave(setting)}
                        disabled={updateMutation.isPending}
                        className="btn-secondary p-2 mt-6"
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Desktop Sync Section */}
      <DesktopSyncSection />
    </div>
  );
}

function DesktopSyncSection() {
  const { data: syncConfig, isLoading: configLoading } = useSyncConfig();
  const { data: syncStatus, isLoading: statusLoading } = useSyncStatus();
  const updateConfig = useUpdateSyncConfig();
  const triggerSync = useTriggerSync();
  const [desktopPath, setDesktopPath] = useState('');

  // Update local state when config loads
  useState(() => {
    if (syncConfig) {
      setDesktopPath(syncConfig.desktop_base_path || '');
    }
  });

  const handleToggleEnabled = async () => {
    if (!syncConfig) return;
    await updateConfig.mutateAsync({ enabled: !syncConfig.enabled });
  };

  const handleToggleAutoSyncUpload = async () => {
    if (!syncConfig) return;
    await updateConfig.mutateAsync({ auto_sync_on_upload: !syncConfig.auto_sync_on_upload });
  };

  const handleToggleAutoSyncDelete = async () => {
    if (!syncConfig) return;
    await updateConfig.mutateAsync({ auto_sync_on_delete: !syncConfig.auto_sync_on_delete });
  };

  const handleUpdatePath = async () => {
    if (!desktopPath) return;
    await updateConfig.mutateAsync({ desktop_base_path: desktopPath });
  };

  const handleSyncNow = async () => {
    await triggerSync.mutateAsync({ force: true });
  };

  const handleBrowse = async () => {
    // Get desktop path from Electron
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getDesktopPath) {
      const path = await electronAPI.getDesktopPath();
      if (path) {
        setDesktopPath(`${path}\\SaleTaxSoftware`);
      }
    }
  };

  if (configLoading || statusLoading) {
    return (
      <div className="card">
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <FolderSync className="h-6 w-6 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Desktop Sync</h2>
            <p className="text-sm text-slate-500 mt-1">
              Automatically sync documents to your Desktop for easy File Explorer access
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable Sync Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Enable Desktop Sync
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Sync all documents to Desktop/SaleTaxSoftware folder
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncConfig?.enabled || false}
                onChange={handleToggleEnabled}
                disabled={updateConfig.isPending}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">Enabled</span>
            </label>
          </div>
        </div>

        {/* Desktop Path */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Desktop Base Path
            </label>
            <p className="text-xs text-slate-500 mb-2">
              The folder on your Desktop where files will be synced
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={desktopPath}
                onChange={(e) => setDesktopPath(e.target.value)}
                placeholder="C:\Users\YourName\Desktop\SaleTaxSoftware"
                className="input flex-1"
              />
              <button
                onClick={handleBrowse}
                className="btn-secondary whitespace-nowrap"
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Browse
              </button>
              <button
                onClick={handleUpdatePath}
                disabled={updateConfig.isPending || !desktopPath}
                className="btn-secondary p-2"
                title="Save Path"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Sync Options */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Auto-Sync on Upload
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Automatically sync new documents when uploaded
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncConfig?.auto_sync_on_upload || false}
                onChange={handleToggleAutoSyncUpload}
                disabled={updateConfig.isPending}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">Enabled</span>
            </label>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Auto-Sync on Delete
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Automatically remove from Desktop when deleted from software
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncConfig?.auto_sync_on_delete || false}
                onChange={handleToggleAutoSyncDelete}
                disabled={updateConfig.isPending}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">Enabled</span>
            </label>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Sync Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Total Documents:</span>
              <span className="ml-2 font-medium text-slate-900">{syncStatus?.total_documents || 0}</span>
            </div>
            <div>
              <span className="text-slate-500">Synced:</span>
              <span className="ml-2 font-medium text-green-600">{syncStatus?.synced_documents || 0}</span>
            </div>
            <div>
              <span className="text-slate-500">Pending:</span>
              <span className="ml-2 font-medium text-orange-600">{syncStatus?.pending_sync || 0}</span>
            </div>
            <div>
              <span className="text-slate-500">Last Sync:</span>
              <span className="ml-2 font-medium text-slate-900">
                {syncStatus?.last_sync_at 
                  ? format(new Date(syncStatus.last_sync_at), 'MMM dd, yyyy HH:mm')
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Now Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSyncNow}
            disabled={triggerSync.isPending || !syncConfig?.enabled}
            className="btn-primary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
            {triggerSync.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {triggerSync.isSuccess && (
          <div className="text-sm text-green-600 text-center">
            ✓ Sync completed successfully!
          </div>
        )}
        {triggerSync.isError && (
          <div className="text-sm text-red-600 text-center">
            ✗ Sync failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
