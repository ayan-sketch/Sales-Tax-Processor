export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  client_id: string | null;
  task_id: string | null;
  created_at: string;
}