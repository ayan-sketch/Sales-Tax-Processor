-- ============================================================================
-- Tax Compliance Management System - Seed Data
-- PostgreSQL 15+
-- ============================================================================

-- ============================================================================
-- DEFAULT SETTINGS
-- ============================================================================
INSERT INTO settings (key, value, description, is_public) VALUES
    ('app.name', 'Tax Compliance Management System', 'Application display name', true),
    ('app.version', '1.0.0', 'Current application version', true),
    ('company.name', 'Your Firm Name', 'Company name for reports', true),
    ('company.ntn', '', 'Company NTN for reports', false),
    ('company.strn', '', 'Company STR Number for reports', false),
    ('company.address', '', 'Company address for reports', false),
    ('company.contact', '', 'Company contact number', true),
    ('company.email', '', 'Company email address', true),
    ('sales_tax.due_day', '15', 'Day of month sales tax returns are due', true),
    ('withholding.due_day', '10', 'Day of month withholding returns are due', true),
    ('backup.enabled', 'true', 'Enable automatic backups', false),
    ('backup.retention_days', '30', 'Number of days to retain backups', false),
    ('backup.daily_time', '02:00', 'Daily backup time (24h format)', false),
    ('backup.daily_count', '7', 'Number of daily backups to retain', false),
    ('backup.weekly_count', '4', 'Number of weekly backups to retain', false),
    ('backup.monthly_count', '12', 'Number of monthly backups to retain', false),
    ('notification.due_returns', 'true', 'Enable due return notifications', true),
    ('notification.task_reminders', 'true', 'Enable task reminder notifications', true),
    ('notification.overdue_alerts', 'true', 'Enable overdue return alerts', true),
    ('notification.advance_days', '7', 'Days in advance to send due return notifications', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEFAULT USER (password: zk@123 -- bcrypt hash)
-- ============================================================================
INSERT INTO users (id, full_name, username, password_hash, email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Zain Khan',
    'zainkhan',
    '$2b$12$Kuh9bDX6qBXC/C7yFIG/7ujRQ1bRKyLbA3TDJXmWyv.nIMlPmKDYW',
    'zain@example.com',
    true
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- SAMPLE CLIENTS
-- ============================================================================
INSERT INTO clients (id, client_name, business_name, cnic, ntn, strn, contact_number, email, address, sales_tax_registered, withholding_registered)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Ahmed Traders', 'Ahmed Trading Company', '12345-6789012-3', 'NTN-001-2024', 'STRN-001-2024', '+92-300-1234567', 'ahmed@example.com', '123 Main Street, Lahore, Punjab', true, true),
    ('10000000-0000-0000-0000-000000000002', 'Bashir & Sons', 'Bashir Enterprises', '12345-6789012-4', 'NTN-002-2024', NULL, '+92-321-7654321', 'bashir@example.com', '456 Mall Road, Karachi, Sindh', true, false),
    ('10000000-0000-0000-0000-000000000003', 'Global Tech Pakistan', 'Global Tech (Pvt) Ltd', '12345-6789012-5', 'NTN-003-2024', 'STRN-003-2024', '+92-333-9876543', 'info@globaltech.pk', '789 Civic Center, Islamabad', true, true),
    ('10000000-0000-0000-0000-000000000004', 'Zahid Medical Store', 'Zahid Pharma', '12345-6789012-6', 'NTN-004-2024', NULL, '+92-345-1112233', 'zahid@example.com', '321 Hospital Road, Faisalabad, Punjab', false, false)
ON CONFLICT (ntn) DO NOTHING;

-- ============================================================================
-- SAMPLE SALES TAX RECORDS
-- ============================================================================
INSERT INTO sales_tax_records (client_id, filing_year, filing_month, status, filing_date, remarks)
SELECT
    c.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::int,
    m.month,
    CASE
        WHEN m.month < EXTRACT(MONTH FROM CURRENT_DATE)::int THEN 'Filed'::filing_status
        WHEN m.month = EXTRACT(MONTH FROM CURRENT_DATE)::int THEN 'Pending'::filing_status
        ELSE 'Not Filed'::filing_status
    END,
    CASE
        WHEN m.month < EXTRACT(MONTH FROM CURRENT_DATE)::int THEN (CURRENT_DATE - INTERVAL '1 day')::date
        ELSE NULL
    END,
    'Auto-generated seed record'
FROM clients c
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6)) AS m(month)
WHERE c.sales_tax_registered = true
  AND c.ntn IN ('NTN-001-2024', 'NTN-003-2024')
ON CONFLICT (client_id, filing_year, filing_month) DO NOTHING;

-- ============================================================================
-- SAMPLE WITHHOLDING RECORDS
-- ============================================================================
INSERT INTO withholding_records (client_id, section_type, period, challan_number, amount, payment_date, remarks)
SELECT
    c.id,
    '236H'::withholding_type,
    TO_CHAR(d.gen_date, 'YYYY-MM') AS period,
    'CH-' || TO_CHAR(d.gen_date, 'YYYYMM') || '-' || c.id::text,
    50000.00 + (random() * 100000)::numeric(18,2),
    d.gen_date,
    'Auto-generated seed record'
FROM clients c
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE, INTERVAL '1 month') AS d(gen_date)
WHERE c.withholding_registered = true
  AND c.ntn = 'NTN-001-2024';

-- ============================================================================
-- SAMPLE TASKS
-- ============================================================================
INSERT INTO tasks (title, description, client_id, assigned_user, due_date, priority, status)
VALUES
    ('File June 2026 Sales Tax Return', 'File monthly sales tax return for June 2026', (SELECT id FROM clients WHERE ntn = 'NTN-001-2024'), '00000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '15 days', 'high', 'pending'),
    ('Review Withholding Statements', 'Review quarterly withholding tax statements', (SELECT id FROM clients WHERE ntn = 'NTN-003-2024'), '00000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '30 days', 'medium', 'pending'),
    ('Update Client Contact Information', 'Reach out to client for updated contact details', (SELECT id FROM clients WHERE ntn = 'NTN-004-2024'), '00000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '7 days', 'low', 'pending');

-- ============================================================================
-- SAMPLE NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (user_id, notification_type, priority, title, message, is_read, link, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'System Message', 'Low', 'Welcome to TCMS', 'Tax Compliance Management System is ready. Start by adding your clients.', false, '/clients', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000001', 'Due Return', 'High', 'Sales Tax Return Due Soon', 'Ahmed Traders has a sales tax return due in 7 days.', false, '/sales-tax', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000001', 'Task Reminder', 'Medium', 'Task Deadline Approaching', 'Task "File June 2026 Sales Tax Return" is due in 15 days.', false, '/tasks', CURRENT_TIMESTAMP);