export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingUpdate {
  key: string;
  value: string;
  category?: string;
  description?: string;
}

export interface SettingsListResponse {
  success: boolean;
  data: Setting[];
  total: number;
}