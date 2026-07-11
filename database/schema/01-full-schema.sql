-- ============================================================================
-- Tax Compliance Management System - Full Database Schema
-- PostgreSQL 15+
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE filing_status AS ENUM ('filed', 'pending', 'not_filed', 'overdue');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE withholding_type AS ENUM ('236H', '153');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'consultant', 'compliance_officer', 'data_entry');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('PDF', 'Excel');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE backup_status AS ENUM ('Success', 'Failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('Due Return', 'Task Reminder', 'Overdue Alert', 'System Message', 'Backup Complete');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    cnic VARCHAR(20) UNIQUE,
    ntn VARCHAR(50) UNIQUE,
    strn VARCHAR(50) UNIQUE,
    contact_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    client_password TEXT,
    sales_tax_registered BOOLEAN NOT NULL DEFAULT false,
    withholding_registered BOOLEAN NOT NULL DEFAULT false,
    sales_tax_material_status VARCHAR(10) NOT NULL DEFAULT 'NIL',
    withholding_236_applied BOOLEAN NOT NULL DEFAULT false,
    withholding_236_prepared_by_us BOOLEAN NOT NULL DEFAULT false,
    withholding_153_applicable BOOLEAN NOT NULL DEFAULT false,
    withholding_153_prepared_by_us BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    file_type document_type NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Sales Tax Records
CREATE TABLE IF NOT EXISTS sales_tax_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    filing_year INTEGER NOT NULL,
    filing_month INTEGER NOT NULL,
    status filing_status NOT NULL DEFAULT 'not_filed',
    filing_date DATE,
    remarks TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_client_year_month UNIQUE (client_id, filing_year, filing_month)
);

-- Withholding Records
CREATE TABLE IF NOT EXISTS withholding_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    section_type withholding_type NOT NULL,
    period VARCHAR(50) NOT NULL,
    challan_number VARCHAR(100),
    amount NUMERIC(18,2) NOT NULL,
    payment_date DATE,
    remarks TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    assigned_user UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name TEXT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_path TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Backups
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_name TEXT NOT NULL,
    backup_path TEXT NOT NULL,
    backup_size BIGINT,
    backup_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status backup_status NOT NULL DEFAULT 'Success'
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    priority notification_priority NOT NULL DEFAULT 'Medium',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    link VARCHAR(500),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Client search indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_clients_ntn ON clients(ntn);
CREATE INDEX IF NOT EXISTS idx_clients_cnic ON clients(cnic);
CREATE INDEX IF NOT EXISTS idx_clients_strn ON clients(strn);
CREATE INDEX IF NOT EXISTS idx_clients_sales_tax_registered ON clients(sales_tax_registered);
CREATE INDEX IF NOT EXISTS idx_clients_withholding_registered ON clients(withholding_registered);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin (client_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_ntn_trgm ON clients USING gin (ntn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_cnic_trgm ON clients USING gin (cnic gin_trgm_ops);

-- Sales tax indexes
CREATE INDEX IF NOT EXISTS idx_sales_tax_client_id ON sales_tax_records(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_tax_year_month ON sales_tax_records(filing_year, filing_month);
CREATE INDEX IF NOT EXISTS idx_sales_tax_status ON sales_tax_records(status);
CREATE INDEX IF NOT EXISTS idx_sales_tax_filing_date ON sales_tax_records(filing_date);

-- Withholding indexes
CREATE INDEX IF NOT EXISTS idx_withholding_client_id ON withholding_records(client_id);
CREATE INDEX IF NOT EXISTS idx_withholding_section_type ON withholding_records(section_type);
CREATE INDEX IF NOT EXISTS idx_withholding_challan_number ON withholding_records(challan_number);
CREATE INDEX IF NOT EXISTS idx_withholding_period ON withholding_records(period);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);

-- Setting indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_is_public ON settings(is_public);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (additional explicit declarations)
-- ============================================================================

-- Ensure document_id foreign keys are indexed for sales tax and withholding
CREATE INDEX IF NOT EXISTS idx_sales_tax_document_id ON sales_tax_records(document_id);
CREATE INDEX IF NOT EXISTS idx_withholding_document_id ON withholding_records(document_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);