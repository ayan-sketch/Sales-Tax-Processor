-- ============================================================================
-- Settings Enhancement Migration
-- Adds value_type, options, is_encrypted columns to settings table
-- Seeds enhanced settings with proper categories
-- ============================================================================

-- Add new columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS category VARCHAR(50) NULL;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS value_type VARCHAR(20) NOT NULL DEFAULT 'string';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS options JSON NULL;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on category for faster grouping
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Update existing settings with categories
UPDATE settings SET category = 'company', value_type = 'string' WHERE key IN ('app.name', 'app.version', 'company.name', 'company.address', 'company.contact', 'company.email');
UPDATE settings SET category = 'company', value_type = 'string', is_encrypted = TRUE WHERE key IN ('company.ntn', 'company.strn');
UPDATE settings SET category = 'backup', value_type = 'string' WHERE key IN ('backup.enabled', 'backup.retention_days', 'backup.daily_time', 'backup.daily_count', 'backup.weekly_count', 'backup.monthly_count');
UPDATE settings SET category = 'backup', value_type = 'boolean' WHERE key = 'backup.enabled';
UPDATE settings SET category = 'notifications', value_type = 'boolean' WHERE key LIKE 'notification.%';
UPDATE settings SET category = 'notifications', value_type = 'number' WHERE key = 'notification.advance_days';
UPDATE settings SET category = 'sales_tax', value_type = 'number' WHERE key = 'sales_tax.due_day';
UPDATE settings SET category = 'withholding', value_type = 'number' WHERE key = 'withholding.due_day';

-- Clear existing settings and re-seed with full set
DELETE FROM settings;

-- ============================================================================
-- 1. COMPANY & BRANDING
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, description, is_public, is_encrypted) VALUES
    (gen_random_uuid(), 'app.name', 'Tax Compliance Management System', 'company', 'string', 'Application display name', TRUE, FALSE),
    (gen_random_uuid(), 'app.version', '1.0.0', 'company', 'string', 'Current application version', TRUE, FALSE),
    (gen_random_uuid(), 'company.name', 'Your Firm Name', 'company', 'string', 'Company name for reports', TRUE, FALSE),
    (gen_random_uuid(), 'company.address', '', 'company', 'textarea', 'Full company address', TRUE, FALSE),
    (gen_random_uuid(), 'company.phone', '', 'company', 'string', 'Company contact number', TRUE, FALSE),
    (gen_random_uuid(), 'company.email', '', 'company', 'email', 'Company email address', TRUE, FALSE),
    (gen_random_uuid(), 'company.ntn', '', 'company', 'string', 'Company NTN (masked on UI)', FALSE, TRUE),
    (gen_random_uuid(), 'company.strn', '', 'company', 'string', 'Company STR Number', FALSE, TRUE),
    (gen_random_uuid(), 'company.logo', '', 'company', 'image', 'Company logo for reports (PNG/JPG, max 2MB)', TRUE, FALSE),
    (gen_random_uuid(), 'company.report_footer', '', 'company', 'textarea', 'Custom text displayed in report footer', TRUE, FALSE),
    (gen_random_uuid(), 'company.tax_invoice_notes', '', 'company', 'textarea', 'Default notes on tax invoices', TRUE, FALSE);

-- ============================================================================
-- 2. BACKUP & DATA
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, options, description, is_public) VALUES
    (gen_random_uuid(), 'backup.enabled', 'true', 'backup', 'boolean', NULL, 'Enable automatic backups', FALSE),
    (gen_random_uuid(), 'backup.frequency', 'daily', 'backup', 'select', '["daily","weekly","monthly"]', 'Backup frequency schedule', FALSE),
    (gen_random_uuid(), 'backup.time', '02:00', 'backup', 'time', NULL, 'Scheduled backup time (24h)', FALSE),
    (gen_random_uuid(), 'backup.retention.daily', '7', 'backup', 'number', NULL, 'Number of daily backups to retain', FALSE),
    (gen_random_uuid(), 'backup.retention.weekly', '4', 'backup', 'number', NULL, 'Number of weekly backups to retain', FALSE),
    (gen_random_uuid(), 'backup.retention.monthly', '12', 'backup', 'number', NULL, 'Number of monthly backups to retain', FALSE),
    (gen_random_uuid(), 'backup.location', '', 'backup', 'string', NULL, 'Custom backup directory path', FALSE),
    (gen_random_uuid(), 'backup.include_uploads', 'true', 'backup', 'boolean', NULL, 'Include uploaded documents in backups', FALSE),
    (gen_random_uuid(), 'backup.auto_cleanup', 'true', 'backup', 'boolean', NULL, 'Auto-delete old backups per retention policy', FALSE),
    (gen_random_uuid(), 'data.export_format', 'Excel', 'backup', 'select', '["Excel","CSV","PDF"]', 'Default export format for data exports', FALSE);

-- ============================================================================
-- 3. NOTIFICATIONS
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, options, description, is_public) VALUES
    (gen_random_uuid(), 'notification.due_returns', 'true', 'notifications', 'boolean', NULL, 'Enable due return notifications', TRUE),
    (gen_random_uuid(), 'notification.task_reminders', 'true', 'notifications', 'boolean', NULL, 'Enable task reminder notifications', TRUE),
    (gen_random_uuid(), 'notification.overdue_alerts', 'true', 'notifications', 'boolean', NULL, 'Enable overdue return alerts', TRUE),
    (gen_random_uuid(), 'notification.advance_days', '7', 'notifications', 'number', NULL, 'Days in advance to send due return notifications', TRUE),
    (gen_random_uuid(), 'notification.client_onboarding', 'true', 'notifications', 'boolean', NULL, 'Alerts when new clients are added', TRUE),
    (gen_random_uuid(), 'notification.backup_status', 'true', 'notifications', 'boolean', NULL, 'Backup success/failure notifications', FALSE),
    (gen_random_uuid(), 'notification.email_smtp_host', '', 'notifications', 'string', NULL, 'SMTP server host for email notifications', FALSE),
    (gen_random_uuid(), 'notification.email_smtp_port', '587', 'notifications', 'number', NULL, 'SMTP server port', FALSE),
    (gen_random_uuid(), 'notification.email_smtp_user', '', 'notifications', 'string', NULL, 'SMTP username', FALSE, TRUE),
    (gen_random_uuid(), 'notification.email_smtp_password', '', 'notifications', 'string', NULL, 'SMTP password', FALSE, TRUE),
    (gen_random_uuid(), 'notification.email_from', '', 'notifications', 'email', NULL, 'From email address for notifications', TRUE),
    (gen_random_uuid(), 'notification.sms_enabled', 'false', 'notifications', 'boolean', NULL, 'Enable SMS notifications (future)', TRUE);

-- ============================================================================
-- 4. DOCUMENTS & STORAGE
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, options, description, is_public) VALUES
    (gen_random_uuid(), 'storage.max_upload_size', '10', 'documents', 'number', NULL, 'Maximum file upload size in MB', FALSE),
    (gen_random_uuid(), 'storage.allowed_types', '["PDF","XLSX","XLS","JPG","PNG","DOC","DOCX"]', 'documents', 'multi_select', NULL, 'Allowed file types for upload', FALSE),
    (gen_random_uuid(), 'storage.client_folder_format', '{name}', 'documents', 'select', '["{name}","{ntn}_{name}","{code}_{name}"]', 'Naming convention for client folders', FALSE),
    (gen_random_uuid(), 'storage.auto_rename', 'true', 'documents', 'boolean', NULL, 'Auto-rename uploaded files per naming rules', FALSE),
    (gen_random_uuid(), 'storage.overwrite_behavior', 'version', 'documents', 'select', '["overwrite","version","skip"]', 'Behavior when uploaded file already exists', FALSE),
    (gen_random_uuid(), 'document.retention_years', '5', 'documents', 'number', NULL, 'Number of years to retain documents', FALSE),
    (gen_random_uuid(), 'document.auto_delete', 'false', 'documents', 'boolean', NULL, 'Auto-delete documents after retention period', FALSE);

-- ============================================================================
-- 5. REPORTING
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, options, description, is_public) VALUES
    (gen_random_uuid(), 'report.default_format', 'PDF', 'reports', 'select', '["PDF","Excel","HTML"]', 'Default report output format', TRUE),
    (gen_random_uuid(), 'report.include_logo', 'true', 'reports', 'boolean', NULL, 'Include company logo in reports', TRUE),
    (gen_random_uuid(), 'report.page_size', 'A4', 'reports', 'select', '["A4","Legal","Letter"]', 'Report page size', TRUE),
    (gen_random_uuid(), 'report.show_ntn', 'true', 'reports', 'boolean', NULL, 'Show company NTN on reports', TRUE),
    (gen_random_uuid(), 'report.show_strn', 'true', 'reports', 'boolean', NULL, 'Show company STRN on reports', TRUE),
    (gen_random_uuid(), 'report.date_format', 'DD-MM-YYYY', 'reports', 'select', '["DD-MM-YYYY","MM-DD-YYYY","YYYY-MM-DD"]', 'Date format used in reports', TRUE),
    (gen_random_uuid(), 'report.auto_generate', 'false', 'reports', 'boolean', NULL, 'Auto-generate monthly reports', FALSE),
    (gen_random_uuid(), 'report.email_on_generate', 'false', 'reports', 'boolean', NULL, 'Email reports when auto-generated', FALSE);

-- ============================================================================
-- 6. USER & ACCESS CONTROL
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, description, is_public) VALUES
    (gen_random_uuid(), 'auth.session_timeout', '60', 'auth', 'number', 'Session timeout in minutes (0 = no timeout)', FALSE),
    (gen_random_uuid(), 'auth.max_login_attempts', '5', 'auth', 'number', 'Max failed login attempts before account lockout', FALSE),
    (gen_random_uuid(), 'auth.password_expiry_days', '90', 'auth', 'number', 'Force password reset after N days (0 = never)', FALSE),
    (gen_random_uuid(), 'auth.two_factor', 'false', 'auth', 'boolean', 'Require two-factor authentication', FALSE),
    (gen_random_uuid(), 'auth.single_session', 'true', 'auth', 'boolean', 'Allow only one active session per user', FALSE),
    (gen_random_uuid(), 'audit.log_retention_days', '365', 'auth', 'number', 'Retain audit logs for N days', FALSE),
    (gen_random_uuid(), 'audit.log_all_actions', 'false', 'auth', 'boolean', 'Log every CRUD operation (may impact performance)', FALSE);

-- ============================================================================
-- 7. IMPORT / OCR (for withholding challan/statement import)
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, options, description, is_public) VALUES
    (gen_random_uuid(), 'import.ocr_enabled', 'false', 'import', 'boolean', NULL, 'Enable OCR for scanned PDF documents', FALSE),
    (gen_random_uuid(), 'import.ocr_language', 'eng', 'import', 'select', '["eng","urd","eng+urd"]', 'OCR language(s) for text recognition', FALSE),
    (gen_random_uuid(), 'import.auto_create_client', 'true', 'import', 'boolean', NULL, 'Auto-create client record when not found during import', FALSE),
    (gen_random_uuid(), 'import.duplicate_handling', 'update', 'import', 'select', '["skip","update","warn"]', 'How to handle duplicate withholding records on import', FALSE),
    (gen_random_uuid(), 'import.default_section', 'auto', 'import', 'select', '["auto","236H","153"]', 'Default withholding section for import (auto = detect from file)', FALSE),
    (gen_random_uuid(), 'import.confidence_threshold', '70', 'import', 'number', NULL, 'Minimum confidence percentage to auto-accept parsed fields', FALSE);

-- ============================================================================
-- 8. SALES TAX & WITHHOLDING (basic, no rates)
-- ============================================================================
INSERT INTO settings (id, key, value, category, value_type, description, is_public) VALUES
    (gen_random_uuid(), 'sales_tax.due_day', '15', 'sales_tax', 'number', 'Day of month sales tax returns are due', TRUE),
    (gen_random_uuid(), 'withholding.due_day', '10', 'withholding', 'number', 'Day of month withholding returns are due', TRUE);