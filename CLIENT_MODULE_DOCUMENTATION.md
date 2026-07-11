# Tax Compliance Management System — Client Module Documentation

**Architecture:** Electron → React + TypeScript → FastAPI → PostgreSQL → Local File Storage

**Version:** 1.0.0  
**Last Updated:** 2026-06-23

---

## Table of Contents

1. [Client Data Model](#section-1--client-data-model)
2. [Client Management UI](#section-2--client-management-ui)
3. [Client Creation Form](#section-3--client-creation-form)
4. [Client Profile Module](#section-4--client-profile-module)
5. [Client Document Management](#section-5--client-document-management)
6. [Client Sales Tax Relationship](#section-6--client-sales-tax-relationship)
7. [Client Withholding Relationship](#section-7--client-withholding-relationship)
8. [Client Task Management](#section-8--client-task-management)
9. [Client Reporting](#section-9--client-reporting)
10. [Client API Documentation](#section-10--client-api-documentation)
11. [Client Database Documentation](#section-11--client-database-documentation)
12. [Client Workflow Documentation](#section-12--client-workflow-documentation)

---

## SECTION 1 — CLIENT DATA MODEL

### 1.1 Core Information

The `Client` entity is the central domain object in the Tax Compliance Management System. Every client record holds identifying information, tax registration status, classification, and audit timestamps.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (PK) | Primary key, auto-generated via `uuid.uuid4()` |
| `file_no` | `String(50)` | Optional file reference number |
| `client_name` | `String(255)` | Full legal/business name of the client |
| `business_name` | `String(255)` | Optional trading/business name |
| `cnic` | `String(20)` | Computerized National Identity Card number (unique) |
| `ntn` | `String(50)` | National Tax Number (unique) |
| `strn` | `String(50)` | Sales Tax Registration Number (unique) |
| `email` | `String(255)` | Primary email address |
| `phone` | `String(50)` | Contact phone number |
| `address` | `Text` | Physical/registered address |
| `city` | `String(100)` | City of registration |

### 1.2 Registration Status

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sales_tax_registered` | `Boolean` | `false` | Whether client is registered for Sales Tax |
| `withholding_registered` | `Boolean` | `false` | Whether client is registered for Withholding Tax |

### 1.3 Classification

| Field | Type | Description |
|-------|------|-------------|
| `wholesaler` | `Boolean` | Wholesaler classification |
| `distributor` | `Boolean` | Distributor classification |
| `company` | `Boolean` | Company/Corporate classification |
| `aop` | `Boolean` | Association of Persons classification |
| `status` | `String(50)` | Overall account status (active/inactive) |
| `assigned_user` | `UUID (FK → users.id)` | The user responsible for this client |

### 1.4 Audit Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `created_at` | `DateTime` | `datetime.utcnow` | Record creation timestamp |
| `updated_at` | `DateTime` | `datetime.utcnow` | Last update timestamp |

### 1.5 Relationships

The `Client` model has the following ORM relationships:

```python
# From backend/app/models/client.py
class Client(Base):
    __tablename__ = "clients"

    # ... columns ...

    # One-to-Many Relationships
    sales_tax_records = relationship("SalesTaxRecord", backref="client", cascade="all, delete-orphan")
    withholding_records = relationship("WithholdingRecord", backref="client", cascade="all, delete-orphan")
    documents = relationship("Document", backref="client", cascade="all, delete-orphan")
    tasks = relationship("Task", backref="client")
```

#### Relationship Summary

| Related Entity | Type | Backref | Cascade |
|----------------|------|---------|---------|
| `sales_tax_records` | One-to-Many | `client` | `all, delete-orphan` |
| `withholding_records` | One-to-Many | `client` | `all, delete-orphan` |
| `documents` | One-to-Many | `client` | `all, delete-orphan` |
| `tasks` | One-to-Many | `client` | (none — SET NULL on delete) |

#### Migration: Additional Fields (002_add_client_fields.sql)

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS file_no VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS wholesaler BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS distributor BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS aop BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_user UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_password TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
```

### 1.6 TypeScript Type Definition

```typescript
// From frontend/src/features/clients/types/client.ts
export interface Client {
  id: string;
  file_no?: string;
  client_name: string;
  business_name?: string;
  cnic?: string;
  ntn?: string;
  strn?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  sales_tax_registered: boolean;
  withholding_registered: boolean;
  wholesaler?: boolean;
  distributor?: boolean;
  company?: boolean;
  aop?: boolean;
  notes?: string;
  status: string;
  assigned_user?: string;
  created_at: string;
  updated_at: string;
}
```

---

## SECTION 2 — CLIENT MANAGEMENT UI

### 2.1 Client List Page

**File:** `frontend/src/features/clients/pages/ClientsPage.tsx`

The `ClientsPage` component renders a full client management interface with search, filter, pagination, sorting, export, and import capabilities.

#### Features

| Feature | Implementation |
|---------|----------------|
| **Search** | Text-based search across client name, NTN, CNIC, STRN via `filters.search` |
| **Filter** | Filter by sales tax registration, withholding registration, active status, date range |
| **Pagination** | Page-based with configurable limit (default 25) |
| **Sorting** | Sort by any column via `sort_by` and `sort_order` parameters |
| **Export** | CSV export with current filters applied via `/clients/export/csv` |
| **Import** | Bulk CSV import via `/clients/import` with duplicate detection |

#### Table Columns

| Column | Data Source | Sortable |
|--------|-------------|----------|
| File No | `client.file_no` | Yes |
| Client Name | `client.client_name` | Yes |
| Business Name | `client.business_name` | Yes |
| NTN | `client.ntn` | Yes |
| STRN | `client.strn` | Yes |
| Phone | `client.phone` | Yes |
| Status | `client.status` | Yes |
| Actions | Edit / Delete / View | N/A |

#### Component Tree

```
ClientsPage
├── PageHeader (title + Add Client button)
├── FilterBar
│   ├── SearchInput
│   ├── StatusFilter (sales tax / withholding / active)
│   ├── DateRangeFilter
│   └── ExportButton
├── ClientsTable
│   ├── TableHeader (sortable columns)
│   └── TableRow (client data + action buttons)
│       ├── EditButton → opens ClientForm modal
│       ├── DeleteButton → confirmation dialog
│       └── ViewButton → navigates to ClientDetailPage
├── Pagination
│   ├── PageSizeSelector
│   └── PageNavigation
└── ImportButton → file upload dialog
```

#### State Management

```typescript
// React Query cache keys used
queryKey: ['clients', filters]      // List clients
queryKey: ['client', id]            // Single client detail
```

The `useClients` hook from `frontend/src/features/clients/hooks/useClients.ts` provides:

```typescript
export function useClients(filters?: ClientFilters) {
  return useQuery<ClientListResponse>({
    queryKey: ['clients', filters],
    queryFn: () => clientService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

Mutations:

| Hook | Purpose | Cache Invalidation |
|------|---------|-------------------|
| `useCreateClient` | Create new client | `['clients']` |
| `useUpdateClient` | Update existing client | `['clients']`, `['client', id]` |
| `useDeleteClient` | Delete client | `['clients']` |
| `useExportClients` | Export to CSV | None |
| `useBulkImportClients` | Bulk import | `['clients']` |

#### API Call Flow

1. User loads page → `useClients(filters)` triggers `GET /clients/?page=1&limit=25`
2. User searches → debounce 300ms → update `filters.search` → re-fetch
3. User sorts → update `filters.sort_by` / `filters.sort_order` → re-fetch
4. User paginates → update `filters.page` → re-fetch
5. User exports → `useExportClients` → `GET /clients/export/csv` → download blob
6. User imports → `useBulkImportClients` → `POST /clients/import` (multipart FormData)

#### Loading States

- Initial load: Full-page spinner overlay
- Background refetch: Subtle loading indicator in table area
- Mutation (create/update/delete): Button-level loading spinner
- Export: Download progress indicator

#### Error Handling

- Network errors: Toast notification with error message
- 409 Conflict (duplicate): Field-level error highlighting in form
- 404 (not found): Redirect to list with error toast
- Validation errors: Backend returns 422 with field-level error details

### 2.2 Client Profile Page

**File:** `frontend/src/features/clients/pages/ClientDetailPage.tsx`

The `ClientDetailPage` provides a tabbed interface for comprehensive client management.

#### Tabs

| Tab | Route Fragment | Component | Description |
|-----|---------------|-----------|-------------|
| Overview | `overview` | `OverviewTab` | Client info, compliance summary, recent docs/tasks |
| Sales Tax | `sales-tax` | `SalesTaxTab` | Monthly filing records and history |
| Withholding | `withholding` | `WithholdingTab` | 236H and 153 records |
| Documents | `documents` | `DocumentsTab` | Uploaded documents with CRUD |
| Tasks | `tasks` | `TasksTab` | Client-specific tasks |
| Reports | `reports` | `ReportsTab` | Generated reports |

#### Tab Component Details

**Overview Tab:**
- Displays all client information fields in a card layout
- Compliance summary showing counts of filed/pending/overdue records
- Recent documents list (last 5)
- Recent tasks list (last 5)
- Activity log feed via `useClientActivity(clientId)`

**Sales Tax Tab:**
- Monthly filing calendar/grid view
- Year selector (current year default)
- Month-by-month filing status badges
- Quick action buttons per month: Mark as Filed, Upload Document
- Add Record button for creating new filing records

**Withholding Tab:**
- Section type selector (236H / 153)
- Records table with challan number, amount, payment date, period
- Add Record form inline
- Filter by period

**Documents Tab:**
- Document table with file name, type, size, upload date
- Upload button → opens `UploadDialog`
- Download / Delete actions per row
- Filter by file type (PDF / Excel)

**Tasks Tab:**
- Task list with status, priority, due date
- Add Task form
- Status update actions (Complete / In Progress)
- Filter by status (Open / In Progress / Completed / Cancelled)

**Reports Tab:**
- Generated reports list
- Report generation buttons (Client Summary, Sales Tax Compliance, Withholding Compliance, Task Report)
- Download generated reports

#### Data Loading Pattern

```typescript
// Each tab uses its own React Query hook
const { data: client, isLoading: clientLoading } = useClient(id);
const { data: salesTaxRecords } = useSalesTaxRecords({ client_id: id });
const { data: withholdingRecords } = useWithholdingRecords({ client_id: id });
const { data: documents } = useDocuments({ client_id: id });
const { data: tasks } = useTasks({ client_id: id });
const { data: reports } = useReports({ client_id: id });
```

All queries are enabled only when `id` is truthy and the corresponding tab is active.

---

## SECTION 3 — CLIENT CREATION FORM

**File:** `frontend/src/features/clients/components/ClientForm.tsx`

### 3.1 Form Fields

| Field | Component Type | TypeScript Type | Required |
|-------|---------------|-----------------|----------|
| File Number | `Input` | `string` | No |
| Client Name | `Input` | `string` | **Yes** |
| Business Name | `Input` | `string` | No |
| CNIC | `Input` (masked) | `string` | No |
| NTN | `Input` | `string` | No |
| STRN | `Input` | `string` | No |
| Email | `Input` (email) | `string` | No |
| Phone | `Input` (tel) | `string` | No |
| Address | `Textarea` | `string` | No |
| City | `Input` | `string` | No |
| Notes | `Textarea` | `string` | No |
| Sales Tax Registered | `Checkbox` | `boolean` | No (default `false`) |
| Withholding Registered | `Checkbox` | `boolean` | No (default `false`) |
| Status | `Select` | `string` | No (default `'active'`) |
| Classification | `CheckboxGroup` | `boolean[]` | No |
| Assigned User | `Select` (user list) | `string` (UUID) | No |

### 3.2 Validation Rules

**File:** `frontend/src/features/clients/validations/clientSchema.ts`

```typescript
import { z } from 'zod';

export const clientSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  business_name: z.string().optional(),
  file_no: z.string().optional(),
  cnic: z.string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format: xxxxx-xxxxxxx-x')
    .optional()
    .or(z.literal('')),
  ntn: z.string()
    .regex(/^\d{7}$/, 'NTN must be exactly 7 digits')
    .optional()
    .or(z.literal('')),
  strn: z.string().optional(),
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^(\+92|0)?3\d{9}$/, 'Phone must be Pakistan format: 03XXXXXXXXX or +92XXXXXXXXXX')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  sales_tax_registered: z.boolean().default(false),
  withholding_registered: z.boolean().default(false),
  assigned_user: z.string().uuid('Invalid user').optional().or(z.literal('')),
  status: z.string().default('active'),
  wholesaler: z.boolean().optional(),
  distributor: z.boolean().optional(),
  company: z.boolean().optional(),
  aop: z.boolean().optional(),
});
```

**Validation Summary:**

| Field | Rule | Pattern | Error Message |
|-------|------|---------|---------------|
| `client_name` | Required, min 1 char | — | "Client name is required" |
| `cnic` | Optional, 13-digit format | `\d{5}-\d{7}-\d{1}` | "CNIC must be in format: xxxxx-xxxxxxx-x" |
| `ntn` | Optional, exactly 7 digits | `\d{7}` | "NTN must be exactly 7 digits" |
| `email` | Optional, RFC-compliant | Built-in email validator | "Invalid email address" |
| `phone` | Optional, Pakistan mobile | `(\+92\|0)?3\d{9}` | "Phone must be Pakistan format: 03XXXXXXXXX or +92XXXXXXXXXX" |

### 3.3 Duplicate Checks

The system prevents duplicate records at two levels:

**Backend (primary):** Database-level unique constraints

```sql
cnci VARCHAR(20) UNIQUE,
ntn VARCHAR(50) UNIQUE,
strn VARCHAR(50) UNIQUE,
```

**Backend (application):** The clients API endpoint checks for existing records:

```python
# From backend/app/api/clients.py (POST /clients/)
def create_client(client_data, db):
    # Check CNIC uniqueness
    if client_data.cnic:
        existing = db.query(Client).filter(Client.cnic == client_data.cnic).first()
        if existing:
            raise HTTPException(409, detail={"field": "cnic", "message": "CNIC already exists"})
    # Check NTN uniqueness
    if client_data.ntn:
        existing = db.query(Client).filter(Client.ntn == client_data.ntn).first()
        if existing:
            raise HTTPException(409, detail={"field": "ntn", "message": "NTN already exists"})
    # Check STRN uniqueness
    if client_data.strn:
        existing = db.query(Client).filter(Client.strn == client_data.strn).first()
        if existing:
            raise HTTPException(409, detail={"field": "strn", "message": "STRN already exists"})
```

**Frontend:** The `useCreateClient` hook captures 409 errors and maps them to form fields:

```typescript
// From useClients.ts
onError: (error: unknown) => {
  const dup = extractDuplicateError(error);
  if (dup && onError) {
    onError(dup.field, dup.message);
  }
},
```

The error is then set on the specific form field via `form.setError(field, { message })`.

---

## SECTION 4 — CLIENT PROFILE MODULE

### 4.1 Overview Tab

The Overview tab provides a summary dashboard for the selected client. Key sections:

| Section | Content | Data Source |
|---------|---------|-------------|
| Client Information | All core fields display-only | `GET /clients/{id}` |
| Compliance Summary | Counts of filed/pending/overdue/not_filed | `GET /sales-tax/?client_id={id}` + `GET /withholding/?client_id={id}` |
| Recent Documents | Last 5 documents with file name, type, date | `GET /documents/?client_id={id}&limit=5` |
| Recent Tasks | Last 5 tasks with title, status, priority | `GET /tasks/?client_id={id}&limit=5` |
| Activity Log | Recent client activity entries | `GET /clients/{id}/activity` |

**Compliance Summary Display:**

| Status | Icon | Count |
|--------|------|-------|
| Filed | ✅ Green check | Count of records with `status='filed'` |
| Pending | ⏳ Yellow clock | Count of records with `status='pending'` |
| Not Filed | ❌ Red X | Count of records with `status='not_filed'` |
| Overdue | 🔴 Red alert | Count of records with `status='overdue'` and past due date |

**Activity Log Component:**

File: `frontend/src/features/clients/components/ActivityLog.tsx`

Displays a chronological feed of activities related to the client, including:
- Client creation
- Document uploads
- Sales tax record updates
- Withholding record additions
- Task creation/completion
- Status changes

### 4.2 Sales Tax Tab

The Sales Tax tab displays monthly filing records for the client.

**Features:**
- Year selector dropdown (defaults to current year)
- Month grid showing filing status for each month
- Color-coded status badges
- Quick actions per month

**Month Display:**

```
┌──────────┬──────────┬──────────┐
│ January  │ February │ March    │
│ ✅ Filed │ ⏳ Pending│ ❌ Overdue│
├──────────┼──────────┼──────────┤
│ April    │ May      │ June     │
│ ❌ Not    │ ✅ Filed │ ✅ Filed │
│   Filed  │          │          │
├──────────┼──────────┼──────────┤
│ July     │ August   │ September│
│ ─        │ ─        │ ─        │
├──────────┼──────────┼──────────┤
│ October  │ November │ December │
│ ─        │ ─        │ ─        │
└──────────┴──────────┴──────────┘
```

**Quick Actions per Month:**

| Action | Description |
|--------|-------------|
| Mark as Filed | Updates status to `filed` with optional filing date |
| Upload Document | Opens upload dialog for sales tax document |
| Edit | Opens edit modal for the record |
| Remove | Deletes the record with confirmation |

### 4.3 Withholding Tab

Displays withholding records organized by section type (236H / 153).

**Data Display:**

| Column | Description |
|--------|-------------|
| Challan Number | Payment challan identifier |
| Amount | Payment amount (Numeric 18,2) |
| Payment Date | Date of payment |
| Period | Filing period (e.g., "Jan-Mar 2026") |
| Section | 236H or 153 |
| Document | Linked document if any |
| Actions | Edit / Delete |

**Section Selector:**
- Toggle between "236H" and "153" views
- Each section type shows its own records table
- Add Record button specific to selected type

### 4.4 Tasks Tab

Displays client-specific tasks with the following columns:

| Column | Description |
|--------|-------------|
| Title | Task title |
| Description | Task description (truncated) |
| Priority | Low / Medium / High / Critical (color-coded) |
| Status | Open / In Progress / Completed / Cancelled |
| Due Date | Task deadline |
| Assigned To | User assigned to the task |
| Actions | Edit / Status change / Delete |

**Status Workflow:**

```
Open → In Progress → Completed
Open → Cancelled
In Progress → Completed
In Progress → Open (reopen)
```

### 4.5 Reports Tab

Displays reports generated specifically for this client.

| Column | Description |
|--------|-------------|
| Report Name | Generated report name |
| Report Type | Type of report |
| Generated By | User who generated it |
| Generated At | Date/time of generation |
| Actions | Download / Delete |

**Report Generation Buttons:**

| Button | Report Type | Action |
|--------|-------------|--------|
| Generate Client Summary | `client_summary` | POST /reports/generate |
| Sales Tax Compliance | `sales_tax_compliance` | POST /reports/generate |
| Withholding Compliance | `withholding_compliance` | POST /reports/generate |
| Task Report | `task_report` | POST /reports/generate |

---

## SECTION 5 — CLIENT DOCUMENT MANAGEMENT

### 5.1 Supported Formats

| Format | Extension | File Type Enum |
|--------|-----------|----------------|
| PDF | `.pdf` | `DocumentType.PDF` |
| Excel | `.xlsx` | `DocumentType.EXCEL` |
| Excel (Legacy) | `.xls` | `DocumentType.EXCEL` |

### 5.2 Features

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Upload | `POST /documents/upload` | Multipart file upload with metadata |
| List | `GET /documents/` | Paginated document list with filters |
| Get | `GET /documents/{id}` | Single document metadata |
| Rename | `PUT /documents/{id}` | Update file name (in metadata) |
| Preview | Inline (PDF) | Browser PDF preview for PDF files |
| Download | `GET /documents/{id}/download` | File download endpoint |
| Delete | `DELETE /documents/{id}` | Removes file from disk and metadata |

### 5.3 Automatic Folder Generation

When a document is uploaded, the system automatically generates folder structures based on the document type.

**Sales Tax Documents:**

```
storage/Clients/
├── {ClientName}/
│   ├── {2026}/
│   │   ├── SalesTax/
│   │   │   ├── January/
│   │   │   │   ├── {CLIENTNAME}_{NTN}_2026_JAN_SALES_TAX.pdf
│   │   │   ├── February/
│   │   │   │   └── ...
│   │   │   └── ...
```

**Withholding Documents (236H):**

```
storage/Clients/
├── {ClientName}/
│   ├── Withholding/
│   │   ├── 236H/
│   │   │   └── {CLIENTNAME}_{NTN}_236H_{MONTH}_{YEAR}.pdf
│   │   ├── 153/
│   │   │   └── {CLIENTNAME}_{NTN}_153_{MONTH}_{YEAR}.pdf
```

**General Documents:**

```
storage/Clients/
├── {ClientName}/
│   ├── Documents/
│   │   └── {CLIENTNAME}_{NTN}_{CATEGORY}_{YYYY_MM_DD}.{ext}
```

### 5.4 File Naming Conventions

The `generate_file_name` function in `backend/app/api/documents.py` determines the file name:

```python
def generate_file_name(client: Client, file_type: DocumentType, original_name: str, doc_category: str = "") -> str:
    now = datetime.now()
    client_name = client.client_name.replace(" ", "_").upper()
    ntn = client.ntn or "NONE"
    
    # Sales Tax PDF
    if file_type == DocumentType.PDF and "SALES" in doc_category.upper():
        return f"{client_name}_{ntn}_{now.year}_{now.strftime('%b').upper()}_SALES_TAX.pdf"
    
    # Withholding 236H PDF
    elif file_type == DocumentType.PDF and "236H" in doc_category.upper():
        return f"{client_name}_{ntn}_236H_{now.strftime('%b').upper()}_{now.year}.pdf"
    
    # Withholding 153 PDF
    elif file_type == DocumentType.PDF and "153" in doc_category.upper():
        return f"{client_name}_{ntn}_153_{now.strftime('%b').upper()}_{now.year}.pdf"
    
    # General document
    else:
        ext = os.path.splitext(original_name)[1]
        return f"{client_name}_{ntn}_{doc_category.upper()}_{now.strftime('%Y_%m_%d')}{ext}"
```

### 5.5 Document Upload Workflow

```
1. User selects file (PDF/XLSX/XLS) via UploadDialog
2. Frontend validates:
   - File extension is allowed (.pdf, .xlsx, .xls)
   - File size ≤ 10MB
3. Frontend sends POST /documents/upload as multipart/form-data
   - file: File
   - client_id: UUID
   - document_type: string (optional, determines folder structure)
4. Backend validates:
   - Client exists
   - File extension allowed
   - File size ≤ 10MB
5. Backend generates:
   - Standardized file name
   - Folder path based on document type
   - Creates directories with os.makedirs()
6. Backend saves file to disk
7. Backend creates Document record in database
8. Response returned with Document metadata
```

### 5.6 Document Validation (Frontend)

**File:** `frontend/src/features/documents/validations/documentSchema.ts`

```typescript
import { z } from 'zod';

export const documentSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' })
    .refine(f => ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(f.type), {
      message: 'Only PDF, XLSX, XLS files are allowed',
    })
    .refine(f => f.size <= 10 * 1024 * 1024, {
      message: 'File size must not exceed 10MB',
    }),
  client_id: z.string().uuid('Client is required'),
  document_type: z.string().optional(),
});
```

### 5.7 Upload Dialog Component

**File:** `frontend/src/features/documents/components/UploadDialog.tsx`

Key props and behavior:

```typescript
interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  clientId?: string;         // Pre-select client
  documentType?: string;     // Pre-set category (SALES_TAX, 236H, 153)
  onSuccess?: () => void;    // Callback after successful upload
}
```

The dialog provides:
- File drag-and-drop zone
- Client selector (if not pre-selected)
- Document type selector (Sales Tax / 236H / 153 / General)
- Upload progress indicator
- Success/error toast notifications

---

## SECTION 6 — CLIENT SALES TAX RELATIONSHIP

### 6.1 Sales Tax Record Fields

**File:** `backend/app/models/sales_tax.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID (PK) | `uuid.uuid4()` | Primary key |
| `client_id` | UUID (FK) | — | References `clients.id` (CASCADE delete) |
| `filing_year` | `Integer` | — | Tax filing year (e.g., 2026) |
| `filing_month` | `Integer` | — | Tax filing month (1–12) |
| `status` | `SalesTaxStatus` (Enum) | `NOT_FILED` | Filing status |
| `filing_date` | `Date` | `null` | Actual date of filing |
| `remarks` | `Text` | `null` | Additional notes |
| `document_id` | UUID (FK) | `null` | References `documents.id` (SET NULL delete) |
| `created_at` | `DateTime` | `datetime.utcnow` | Creation timestamp |
| `updated_at` | `DateTime` | `datetime.utcnow` | Last update timestamp |

### 6.2 Sales Tax Statuses

```python
class SalesTaxStatus(str, enum.Enum):
    FILED = "Filed"
    PENDING = "Pending"
    NOT_FILED = "Not Filed"
    OVERDUE = "Overdue"
```

| Status | Color | Meaning |
|--------|-------|---------|
| Filed | ✅ Green | Return has been filed |
| Pending | ⏳ Yellow | Return is in progress |
| Not Filed | ❌ Red | Return has not been filed |
| Overdue | 🔴 Red (bold) | Return is past due date |

### 6.3 Database Schema (Sales Tax)

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_tax_client_id ON sales_tax_records(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_tax_year_month ON sales_tax_records(filing_year, filing_month);
CREATE INDEX IF NOT EXISTS idx_sales_tax_status ON sales_tax_records(status);
CREATE INDEX IF NOT EXISTS idx_sales_tax_filing_date ON sales_tax_records(filing_date);
CREATE INDEX IF NOT EXISTS idx_sales_tax_document_id ON sales_tax_records(document_id);
```

### 6.4 API Endpoints (Sales Tax)

**Base URL:** `/api/v1/sales-tax` (or `/sales-tax` depending on prefix)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sales-tax/` | Create a new sales tax record |
| GET | `/sales-tax/` | List sales tax records (filtered) |
| GET | `/sales-tax/{id}` | Get single sales tax record |
| PUT | `/sales-tax/{id}` | Update sales tax record |
| DELETE | `/sales-tax/{id}` | Delete sales tax record |

**Create/Update Request Schema:**

```json
{
  "client_id": "uuid",
  "filing_year": 2026,
  "filing_month": 6,
  "status": "Not Filed",
  "filing_date": "2026-06-15",
  "remarks": "Filed on time"
}
```

**Validation Rules:**
- `filing_year`: Must be a valid year (4 digits)
- `filing_month`: Must be 1–12
- `status`: Must be one of: `Filed`, `Pending`, `Not Filed`, `Overdue`
- Duplicate: A record for the same `(client_id, filing_year, filing_month)` cannot exist

### 6.5 UI Screens (Sales Tax)

**Sales Tax List Page:** `frontend/src/features/sales-tax/pages/SalesTaxPage.tsx`
- Year/month grid view
- Filter by year, client, status
- Bulk status updates

**Sales Tax Table Component:** `frontend/src/features/sales-tax/components/SalesTaxTable.tsx`
- Tabular view with all fields
- Inline status editing
- Document attachment display

**Sales Tax Form Component:** `frontend/src/features/sales-tax/components/SalesTaxForm.tsx`
- Create/edit form with validation
- Client auto-select when accessed via client detail

### 6.6 Frontend TypeScript Types

```typescript
// From frontend/src/features/sales-tax/types/salesTax.ts
export type SalesTaxStatus = 'Filed' | 'Pending' | 'Not Filed' | 'Overdue';

export interface SalesTaxRecord {
  id: string;
  client_id: string;
  filing_year: number;
  filing_month: number;
  status: SalesTaxStatus;
  filing_date?: string;
  remarks?: string;
  document_id?: string;
}
```

### 6.7 Frontend Validation Schema

```typescript
// frontend/src/features/sales-tax/validations/salesTaxSchema.ts
export const salesTaxRecordSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  filing_year: z.number().int().min(2020, 'Invalid year').max(2100, 'Invalid year'),
  filing_month: z.number().int().min(1, 'Month must be 1-12').max(12, 'Month must be 1-12'),
  status: z.enum(['Filed', 'Pending', 'Not Filed', 'Overdue']),
  filing_date: z.string().optional(),
  remarks: z.string().optional(),
});
```

---

## SECTION 7 — CLIENT WITHHOLDING RELATIONSHIP

### 7.1 Withholding Record Fields

**File:** `backend/app/models/withholding.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID (PK) | `uuid.uuid4()` | Primary key |
| `client_id` | UUID (FK) | — | References `clients.id` (CASCADE delete) |
| `section_type` | `WithholdingType` (Enum) | — | `236H` or `153` |
| `period` | `String(50)` | — | Filing period description (e.g., "Jan-Mar 2026") |
| `challan_number` | `String(100)` | `null` | Payment challan identifier |
| `amount` | `Numeric(18,2)` | — | Withholding amount in PKR |
| `payment_date` | `Date` | `null` | Date of payment |
| `remarks` | `Text` | `null` | Additional notes |
| `document_id` | UUID (FK) | `null` | References `documents.id` (SET NULL delete) |
| `created_at` | `DateTime` | `datetime.utcnow` | Creation timestamp |
| `updated_at` | `DateTime` | `datetime.utcnow` | Last update timestamp |

### 7.2 Withholding Types

```python
class WithholdingType(str, enum.Enum):
    TYPE_236H = "236H"   # Section 236H - Advance Tax on Cash Withdrawal
    TYPE_153 = "153"     # Section 153 - Tax on Payments to Contractors
```

| Section | Description | Applicable To |
|---------|-------------|---------------|
| **236H** | Advance adjustable tax on cash withdrawal from banks | All registered persons |
| **153** | Tax on payments to contractors/subcontractors | Contractors, suppliers, service providers |

### 7.3 Database Schema (Withholding)

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_withholding_client_id ON withholding_records(client_id);
CREATE INDEX IF NOT EXISTS idx_withholding_section_type ON withholding_records(section_type);
CREATE INDEX IF NOT EXISTS idx_withholding_challan_number ON withholding_records(challan_number);
CREATE INDEX IF NOT EXISTS idx_withholding_period ON withholding_records(period);
CREATE INDEX IF NOT EXISTS idx_withholding_document_id ON withholding_records(document_id);
```

### 7.4 API Endpoints (Withholding)

**Base URL:** `/api/v1/withholding`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/withholding/` | Create new withholding record |
| GET | `/withholding/` | List withholding records (filtered) |
| GET | `/withholding/{id}` | Get single withholding record |
| PUT | `/withholding/{id}` | Update withholding record |
| DELETE | `/withholding/{id}` | Delete withholding record |

**Create/Update Request Schema:**

```json
{
  "client_id": "uuid",
  "section_type": "236H",
  "period": "Jan-Mar 2026",
  "challan_number": "CH-2026-001",
  "amount": 50000.00,
  "payment_date": "2026-03-15",
  "remarks": "Quarterly payment"
}
```

### 7.5 UI Screens (Withholding)

**Withholding Page:** `frontend/src/features/withholding/pages/WithholdingPage.tsx`
- Section type toggle (236H / 153)
- Records table with filtering
- Add/Edit/Delete actions

**Withholding Table Component:** `frontend/src/features/withholding/components/WithholdingTable.tsx`
- Tabular display of withholding records
- Status indicators
- Document links

**Withholding Form Component:** `frontend/src/features/withholding/components/WithholdingForm.tsx`
- Create/edit form
- Client selector
- Section type selector

### 7.6 Frontend Types

```typescript
// From frontend/src/features/withholding/types/withholding.ts
export interface WithholdingRecord {
  id: string;
  client_id: string;
  section_type: '236H' | '153';
  period: string;
  challan_number?: string;
  amount: number;
  payment_date?: string;
  remarks?: string;
  document_id?: string;
  created_at: string;
  updated_at: string;
}
```

### 7.7 Frontend Validation Schema

```typescript
// frontend/src/features/withholding/validations/withholdingSchema.ts
export const withholdingRecordSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  section_type: z.enum(['236H', '153'], { required_error: 'Section type is required' }),
  period: z.string().min(1, 'Period is required'),
  challan_number: z.string().optional(),
  amount: z.number().positive('Amount must be positive').or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  payment_date: z.string().optional(),
  remarks: z.string().optional(),
});
```

---

## SECTION 8 — CLIENT TASK MANAGEMENT

### 8.1 Task Fields

**File:** `backend/app/models/task.py`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID (PK) | `uuid.uuid4()` | Primary key |
| `title` | `String(255)` | — | Task title |
| `description` | `Text` | `null` | Detailed description |
| `client_id` | UUID (FK) | `null` | References `clients.id` (SET NULL delete) |
| `assigned_user` | UUID (FK) | `null` | References `users.id` (SET NULL delete) |
| `due_date` | `Date` | `null` | Task deadline |
| `priority` | `TaskPriority` (Enum) | `MEDIUM` | Task priority level |
| `status` | `TaskStatus` (Enum) | `PENDING` | Task status |
| `created_at` | `DateTime` | `datetime.utcnow` | Creation timestamp |
| `completed_at` | `DateTime` | `null` | Completion timestamp |

### 8.2 Priority Levels

```python
class TaskPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"
```

| Priority | Color (UI) | SLA |
|----------|-----------|-----|
| Low | 🟢 Green (muted) | 30 days |
| Medium | 🟡 Yellow | 14 days |
| High | 🟠 Orange | 7 days |
| Critical | 🔴 Red | 24 hours |

### 8.3 Status Values

```python
class TaskStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
```

### 8.4 Database Schema (Tasks)

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
```

### 8.5 API Endpoints (Tasks)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/` | Create new task |
| GET | `/tasks/` | List tasks (filtered) |
| GET | `/tasks/{id}` | Get single task |
| PUT | `/tasks/{id}` | Update task |
| DELETE | `/tasks/{id}` | Delete task |

### 8.6 Frontend Types

```typescript
// From frontend/src/features/tasks/types/task.ts
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  assigned_user?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
}
```

### 8.7 Task Form Component

**File:** `frontend/src/features/tasks/components/TaskForm.tsx`

Key props:

```typescript
interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  clientId?: string;        // Pre-select client for client-specific tasks
  task?: Task;               // Existing task for edit mode
  onSuccess?: () => void;
}
```

### 8.8 Validation Schema

```typescript
// frontend/src/features/tasks/validations/taskSchema.ts
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  client_id: z.string().uuid().optional().or(z.literal('')),
  assigned_user: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Cancelled']),
});
```

---

## SECTION 9 — CLIENT REPORTING

### 9.1 Report Types

| Report Type | ID | Description |
|-------------|-----|-------------|
| Client Summary | `client_summary` | Comprehensive client overview with all registrations |
| Sales Tax Compliance | `sales_tax_compliance` | Monthly compliance status for a period |
| Withholding Compliance | `withholding_compliance` | Withholding records summary for 236H and 153 |
| Task Report | `task_report` | Open tasks, overdue tasks, completion rates |

### 9.2 Export Formats

| Format | MIME Type | Description |
|--------|-----------|-------------|
| PDF | `application/pdf` | Printable report with letterhead |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Downloadable spreadsheet |

### 9.3 Report Database Schema

```sql
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name TEXT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_path TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at);
```

### 9.4 Report Model (SQLAlchemy)

```python
class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_name = Column(Text, nullable=False)
    report_type = Column(String(100), nullable=False)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_path = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    generator = relationship("User", backref="generated_reports")
```

### 9.5 Report Service

**File:** `frontend/src/features/reports/services/reportService.ts`

```typescript
export const reportService = {
  async getAll(filters?: { client_id?: string; report_type?: string; page?: number; limit?: number }) {
    return apiClient.get<ReportListResponse>('/reports/', { params: filters });
  },
  async getById(id: string) {
    return apiClient.get<Report>(`/reports/${id}`);
  },
  async generate(data: { client_id: string; report_type: string }) {
    return apiClient.post<Report>('/reports/generate', data);
  },
  async download(id: string) {
    return apiClient.getBlob(`/reports/${id}/download`);
  },
  async delete(id: string) {
    return apiClient.delete(`/reports/${id}`);
  },
};
```

---

## SECTION 10 — CLIENT API DOCUMENTATION

### 10.1 API Base Configuration

**FastAPI Application:** `backend/app/main.py`  
**Router Prefix:** `/api/v1` (or `/clients` mounted directly)  
**Auth:** JWT Bearer token via `get_current_active_user` dependency

### 10.2 Complete Client Endpoints

#### POST /clients/

Create a new client record.

**Request:**
```json
{
  "client_name": "Mohammad Ali & Co.",
  "business_name": "Ali Trading",
  "cnic": "42201-1234567-1",
  "ntn": "1234567",
  "strn": "ST-1234567",
  "email": "ali@example.com",
  "phone": "03001234567",
  "address": "123 Main Street, Karachi",
  "city": "Karachi",
  "sales_tax_registered": true,
  "withholding_registered": true,
  "notes": "Preferred client",
  "wholesaler": true,
  "distributor": false,
  "company": true,
  "aop": false,
  "status": "active",
  "assigned_user": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "file_no": null,
  "client_name": "Mohammad Ali & Co.",
  "business_name": "Ali Trading",
  "cnic": "42201-1234567-1",
  "ntn": "1234567",
  "strn": "ST-1234567",
  "email": "ali@example.com",
  "phone": "03001234567",
  "address": "123 Main Street, Karachi",
  "city": "Karachi",
  "sales_tax_registered": true,
  "withholding_registered": true,
  "wholesaler": true,
  "distributor": false,
  "company": true,
  "aop": false,
  "notes": "Preferred client",
  "status": "active",
  "assigned_user": "uuid",
  "created_at": "2026-06-23T10:30:00Z",
  "updated_at": "2026-06-23T10:30:00Z"
}
```

**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 409 | Duplicate CNIC | `{"detail": {"field": "cnic", "message": "CNIC already exists"}}` |
| 409 | Duplicate NTN | `{"detail": {"field": "ntn", "message": "NTN already exists"}}` |
| 409 | Duplicate STRN | `{"detail": {"field": "strn", "message": "STRN already exists"}}` |
| 422 | Validation error | Standard FastAPI 422 with field errors |

#### GET /clients/

List clients with filtering, pagination, and sorting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (1-based) |
| `limit` | int | 25 | Items per page (max 100) |
| `search` | string | — | Search in client_name, ntn, cnic, strn |
| `sales_tax_registered` | bool | — | Filter by Sales Tax registration |
| `withholding_registered` | bool | — | Filter by Withholding registration |
| `status` | string | — | Filter by status |
| `is_active` | bool | — | Filter by active/inactive |
| `date_from` | string | — | Filter by created_at >= date |
| `date_to` | string | — | Filter by created_at <= date |
| `sort_by` | string | `created_at` | Sort column |
| `sort_order` | string | `desc` | Sort direction (`asc` or `desc`) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_name": "Mohammad Ali & Co.",
      "...": "..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 25
}
```

#### GET /clients/{id}

Get a single client by ID.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "client_name": "Mohammad Ali & Co.",
  "business_name": "Ali Trading",
  "cnic": "42201-1234567-1",
  "ntn": "1234567",
  "strn": "ST-1234567",
  "email": "ali@example.com",
  "phone": "03001234567",
  "address": "123 Main Street, Karachi",
  "city": "Karachi",
  "sales_tax_registered": true,
  "withholding_registered": true,
  "wholesaler": true,
  "distributor": false,
  "company": true,
  "aop": false,
  "notes": "Preferred client",
  "status": "active",
  "assigned_user": "uuid",
  "created_at": "2026-06-23T10:30:00Z",
  "updated_at": "2026-06-23T10:30:00Z",
  "sales_tax_records": [],
  "withholding_records": [],
  "documents": [],
  "tasks": []
}
```

**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 404 | Client not found | `{"detail": "Client not found"}` |

#### PUT /clients/{id}

Update an existing client. Only provided fields are updated (partial update).

**Request:** (all fields optional for update)
```json
{
  "client_name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "03111234567"
}
```

**Response (200 OK):** Updated client object (same schema as GET).

#### DELETE /clients/{id}

Delete a client and all associated records (CASCADE).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 404 | Client not found | `{"detail": "Client not found"}` |

#### GET /clients/export/csv

Export clients to CSV with current filters.

**Query Parameters:** Same as GET /clients/ for filtering.

**Response (200 OK):** CSV file download (`Content-Type: text/csv`)

#### POST /clients/import

Bulk import clients from CSV file.

**Request:** `multipart/form-data` with file field.

**Response (200 OK):**
```json
{
  "success": true,
  "imported": 15,
  "errors": ["Row 3: Duplicate CNIC", "Row 7: Invalid NTN format"]
}
```

### 10.3 Pydantic Schemas

```python
class ClientCreate(BaseModel):
    client_name: str
    business_name: Optional[str] = None
    file_no: Optional[str] = None
    cnic: Optional[str] = None
    ntn: Optional[str] = None
    strn: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    sales_tax_registered: bool = False
    withholding_registered: bool = False
    wholesaler: bool = False
    distributor: bool = False
    company: bool = False
    aop: bool = False
    notes: Optional[str] = None
    status: Optional[str] = "active"
    assigned_user: Optional[str] = None

class ClientUpdate(BaseModel):
    client_name: Optional[str] = None
    business_name: Optional[str] = None
    # ... all fields optional ...
    status: Optional[str] = None

class ClientResponse(BaseModel):
    id: UUID
    client_name: str
    business_name: Optional[str]
    # ... all fields ...
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ClientListResponse(BaseModel):
    success: bool
    data: List[ClientResponse]
    total: int
    page: int
    limit: int
```

### 10.4 Authentication

All endpoints require JWT Bearer token authentication:

```python
router = APIRouter(dependencies=[Depends(get_current_active_user)])
```

The `get_current_active_user` dependency extracts the user from the JWT token, verifies it against the database, and ensures the user account is active.

---

## SECTION 11 — CLIENT DATABASE DOCUMENTATION

### 11.1 Complete PostgreSQL Schema

#### clients Table

```sql
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_no VARCHAR(50),
    client_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    cnic VARCHAR(20) UNIQUE,
    ntn VARCHAR(50) UNIQUE,
    strn VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    sales_tax_registered BOOLEAN NOT NULL DEFAULT false,
    withholding_registered BOOLEAN NOT NULL DEFAULT false,
    wholesaler BOOLEAN DEFAULT false,
    distributor BOOLEAN DEFAULT false,
    company BOOLEAN DEFAULT false,
    aop BOOLEAN DEFAULT false,
    client_password TEXT,
    status VARCHAR(50) DEFAULT 'active',
    assigned_user UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| file_no | VARCHAR(50) | YES | NULL | |
| client_name | VARCHAR(255) | NO | — | |
| business_name | VARCHAR(255) | YES | NULL | |
| cnic | VARCHAR(20) | YES | NULL | UNIQUE |
| ntn | VARCHAR(50) | YES | NULL | UNIQUE |
| strn | VARCHAR(50) | YES | NULL | UNIQUE |
| email | VARCHAR(255) | YES | NULL | |
| phone | VARCHAR(50) | YES | NULL | |
| address | TEXT | YES | NULL | |
| city | VARCHAR(100) | YES | NULL | |
| sales_tax_registered | BOOLEAN | NO | false | |
| withholding_registered | BOOLEAN | NO | false | |
| wholesaler | BOOLEAN | YES | false | |
| distributor | BOOLEAN | YES | false | |
| company | BOOLEAN | YES | false | |
| aop | BOOLEAN | YES | false | |
| client_password | TEXT | YES | NULL | |
| status | VARCHAR(50) | YES | 'active' | |
| assigned_user | UUID | YES | NULL | FK → users(id) ON DELETE SET NULL |
| notes | TEXT | YES | NULL | |
| created_at | TIMESTAMP | NO | NOW() | |
| updated_at | TIMESTAMP | NO | NOW() | |

**Foreign Keys:**
- `assigned_user` → `users(id)` ON DELETE SET NULL

**Unique Constraints:**
- `cnic`
- `ntn`
- `strn`

**Indexes:**

| Name | Column(s) | Type |
|------|-----------|------|
| idx_clients_name | client_name | B-tree |
| idx_clients_ntn | ntn | B-tree |
| idx_clients_cnic | cnic | B-tree |
| idx_clients_strn | strn | B-tree |
| idx_clients_sales_tax_registered | sales_tax_registered | B-tree |
| idx_clients_withholding_registered | withholding_registered | B-tree |
| idx_clients_name_trgm | client_name | GIN (trigram) |
| idx_clients_ntn_trgm | ntn | GIN (trigram) |
| idx_clients_cnic_trgm | cnic | GIN (trigram) |

#### sales_tax_records Table

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| client_id | UUID | NO | — | FK → clients(id) ON DELETE CASCADE |
| filing_year | INTEGER | NO | — | |
| filing_month | INTEGER | NO | — | |
| status | filing_status (ENUM) | NO | 'not_filed' | |
| filing_date | DATE | YES | NULL | |
| remarks | TEXT | YES | NULL | |
| document_id | UUID | YES | NULL | FK → documents(id) ON DELETE SET NULL |
| created_at | TIMESTAMP | NO | NOW() | |
| updated_at | TIMESTAMP | NO | NOW() | |

**Unique Constraints:**
- `uq_client_year_month`: (client_id, filing_year, filing_month)

**Foreign Keys:**
- `client_id` → `clients(id)` ON DELETE CASCADE
- `document_id` → `documents(id)` ON DELETE SET NULL

#### withholding_records Table

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| client_id | UUID | NO | — | FK → clients(id) ON DELETE CASCADE |
| section_type | withholding_type (ENUM) | NO | — | |
| period | VARCHAR(50) | NO | — | |
| challan_number | VARCHAR(100) | YES | NULL | |
| amount | NUMERIC(18,2) | NO | — | |
| payment_date | DATE | YES | NULL | |
| remarks | TEXT | YES | NULL | |
| document_id | UUID | YES | NULL | FK → documents(id) ON DELETE SET NULL |
| created_at | TIMESTAMP | NO | NOW() | |
| updated_at | TIMESTAMP | NO | NOW() | |

**Foreign Keys:**
- `client_id` → `clients(id)` ON DELETE CASCADE
- `document_id` → `documents(id)` ON DELETE SET NULL

#### documents Table

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| client_id | UUID | NO | — | FK → clients(id) ON DELETE CASCADE |
| file_name | TEXT | NO | — | |
| original_file_name | TEXT | NO | — | |
| file_extension | VARCHAR(20) | NO | — | |
| file_size | BIGINT | NO | — | |
| file_path | TEXT | NO | — | |
| file_type | document_type (ENUM) | NO | — | |
| upload_date | TIMESTAMP | NO | NOW() | |
| uploaded_by | UUID | YES | NULL | FK → users(id) ON DELETE SET NULL |

**Foreign Keys:**
- `client_id` → `clients(id)` ON DELETE CASCADE
- `uploaded_by` → `users(id)` ON DELETE SET NULL

#### tasks Table

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| title | VARCHAR(255) | NO | — | |
| description | TEXT | YES | NULL | |
| client_id | UUID | YES | NULL | FK → clients(id) ON DELETE SET NULL |
| assigned_user | UUID | YES | NULL | FK → users(id) ON DELETE SET NULL |
| due_date | DATE | YES | NULL | |
| priority | task_priority (ENUM) | NO | 'medium' | |
| status | task_status (ENUM) | NO | 'pending' | |
| created_at | TIMESTAMP | NO | NOW() | |
| completed_at | TIMESTAMP | YES | NULL | |

**Foreign Keys:**
- `client_id` → `clients(id)` ON DELETE SET NULL
- `assigned_user` → `users(id)` ON DELETE SET NULL

#### reports Table

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| id | UUID | NO | `uuid_generate_v4()` | PK |
| report_name | TEXT | NO | — | |
| report_type | VARCHAR(100) | NO | — | |
| generated_by | UUID | YES | NULL | FK → users(id) ON DELETE SET NULL |
| file_path | TEXT | YES | NULL | |
| generated_at | TIMESTAMP | NO | NOW() | |

**Foreign Keys:**
- `generated_by` → `users(id)` ON DELETE SET NULL

### 11.2 Entity Relationship Overview

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────┐
│    users    │     │       clients       │     │  documents   │
├─────────────┤     ├─────────────────────┤     ├──────────────┤
│ id (PK)     │←────│ assigned_user       │     │ id (PK)      │
│ username    │     │ id (PK)             │────→│ client_id    │
│ ...         │     │ client_name         │     │ file_name    │
└─────────────┘     │ cnic (UQ)           │     │ file_path    │
                    │ ntn (UQ)            │     │ ...          │
                    │ strn (UQ)           │     └──────────────┘
                    │ sales_tax_registered │           ↑
                    │ ...                  │           │
                    └────────┬─────────────┘           │
                             │                         │
               ┌─────────────┼─────────────┐           │
               │             │             │           │
               ▼             ▼             ▼           │
     ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
     │ sales_tax_records│ │ withholding_ │ │    tasks     │
     │                 │ │   records    │ │              │
     ├─────────────────┤ ├──────────────┤ ├──────────────┤
     │ id (PK)         │ │ id (PK)      │ │ id (PK)      │
     │ client_id (FK)  │ │ client_id(FK)│ │ client_id(FK)│
     │ filing_year     │ │ section_type │ │ title        │
     │ filing_month    │ │ period       │ │ priority     │
     │ status          │ │ amount       │ │ status       │
     │ document_id(FK)─┼─│ document_id(FK)│ │ due_date     │
     └─────────────────┘ └──────────────┘ └──────────────┘
                             
                             ┌──────────────┐
                             │   reports    │
                             ├──────────────┤
                             │ id (PK)      │
                             │ report_type  │
                             │ generated_by │
                             │ file_path    │
                             └──────────────┘
```

---

## SECTION 12 — CLIENT WORKFLOW DOCUMENTATION

### 12.1 Add Client Workflow

```
┌───────────────────┐
│  Navigate to       │
│  Clients Page      │
└────────┬──────────┘
         │ Click "Add Client" button
         ▼
┌───────────────────┐
│  Open ClientForm   │
│  (Modal/Dialog)    │
└────────┬──────────┘
         │ Fill required fields
         ▼
┌───────────────────┐
│  Frontend          │
│  Validation        │
│  (Zod Schema)      │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └──┬──┬───┘
       │  │ No
       │  └──────────┐
       │             ▼
       │    ┌───────────────────┐
       │    │ Show field-level  │
       │    │ validation errors │
       │    └───────────────────┘
       │
       │ Yes
       ▼
┌───────────────────┐
│  POST /clients/    │
│  (Create Client)   │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ 409?    │
    └──┬──┬───┘
       │  │ Yes
       │  └──────────┐
       │             ▼
       │    ┌───────────────────┐
       │    │ Show duplicate    │
       │    │ field error       │
       │    └───────────────────┘
       │
       │ No
       ▼
┌───────────────────┐
│  Client Created    │
│  in Database       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Generate Initial  │
│  Folder Structure  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Create Initial    │
│  Records           │
│  (Empty records    │
│   for current year)│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Invalidate React  │
│  Query Cache       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Redirect to       │
│  Client Profile    │
│  Page              │
└───────────────────┘
```

### 12.2 Upload Document Workflow

```
┌───────────────────┐
│  Navigate to       │
│  Client Detail     │
│  → Documents Tab   │
└────────┬──────────┘
         │ Click "Upload" button
         ▼
┌───────────────────┐
│  Open UploadDialog │
└────────┬──────────┘
         │ Select file (PDF/XLSX/XLS)
         │ Set document type (SALES_TAX/236H/153/GENERAL)
         ▼
┌───────────────────┐
│  Frontend          │
│  Validation        │
│  (extension, size) │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └──┬──┬───┘
       │  │ No → Show error toast
       │  │
       │ Yes
       ▼
┌─────────────────────────────────┐
│  POST /documents/upload         │
│  (multipart/form-data)          │
│  - file: File                   │
│  - client_id: UUID              │
│  - document_type: string        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend Processing:            │
│  1. Validate file extension     │
│  2. Validate file size (≤10MB)  │
│  3. Generate file name          │
│  4. Create folder path:         │
│     storage/Clients/{Name}/     │
│       {Year}/SalesTax/{Month}/  │
│     OR:                          │
│     storage/Clients/{Name}/     │
│       Withholding/{Section}/    │
│  5. os.makedirs(folder_path)    │
│  6. Save file to disk           │
│  7. Create Document DB record   │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │ 409?    │
    └──┬──┬───┘
       │  │ Yes → "Confirm overwrite?" dialog
       │  │        → If confirmed, rewrite file
       │  │        → Return success
       │  │
       │ No
       ▼
┌───────────────────┐
│  Document Uploaded │
│  Successfully      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Invalidate React  │
│  Query Cache       │
│  (documents list)  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Show success      │
│  toast + refresh   │
│  document list     │
└───────────────────┘
```

### 12.3 Monthly Compliance Tracking Workflow

```
┌───────────────────┐
│  Select Client     │
│  (from list or     │
│   profile page)    │
└────────┬──────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Dashboard / Client Profile      │
│  Compliance Summary Section      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Fetch Sales Tax Records          │
│  GET /sales-tax/?client_id={id}   │
│  + GET /withholding/?client_id={id}│
└────────┬──────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Process Records:                 │
│  - Group by year/month           │
│  - Categorize by status          │
│    (Filed / Pending / Not Filed  │
│     / Overdue)                   │
│  - Calculate compliance %        │
└────────┬──────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Update Dashboard:                │
│  - Total clients count           │
│  - Filed this month count        │
│  - Overdue count                 │
│  - Compliance percentage         │
│  - Recent activity feed          │
└────────┬──────────────────────────┘
         │
         ▼
┌───────────────────┐
│  Display Results   │
│  - Color-coded     │
│    status badges   │
│  - Sortable grid   │
│  - Download report │
│    option          │
└───────────────────┘
```

### 12.4 Edit Client Workflow

```
┌───────────────────┐
│  From Clients Page │
│  → Click Edit      │
│  (pencil icon)     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Open ClientForm   │
│  (pre-filled with  │
│   existing data)   │
└────────┬──────────┘
         │ Modify fields
         ▼
┌───────────────────┐
│  Frontend          │
│  Validation        │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └──┬──┬───┘
       │  │ No → Show errors
       │  │
       │ Yes
       ▼
┌───────────────────┐
│  PUT /clients/{id} │
│  (Partial Update)  │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ 409?    │
    └──┬──┬───┘
       │  │ Yes → Show duplicate field error
       │  │
       │ No
       ▼
┌───────────────────┐
│  Success →         │
│  Invalidate cache  │
│  Close modal       │
│  Show toast        │
└───────────────────┘
```

### 12.5 Delete Client Workflow

```
┌───────────────────┐
│  From Clients Page │
│  → Click Delete    │
│  (trash icon)      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Confirmation      │
│  Dialog:           │
│  "Are you sure you │
│   want to delete   │
│   {client_name}?   │
│   This will remove │
│   all associated   │
│   records."        │
└────────┬──────────┘
         │
    ┌────┴────┐
    │ Confirm?│
    └──┬──┬───┘
       │  │ No → Cancel, close dialog
       │  │
       │ Yes
       ▼
┌───────────────────┐
│  DELETE /clients/{id}│
│  (CASCADE deletes  │
│   all related      │
│   records)         │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Server-side:      │
│  - Delete client   │
│    record          │
│  - CASCADE deletes │
│    sales_tax_records│
│    withholding_     │
│    records          │
│  - SET NULL on     │
│    tasks, reports  │
│  - Files remain    │
│    on disk         │
│  - Notification    │
│    of deletion     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Success →         │
│  Invalidate cache  │
│  Return to list    │
│  Show toast:       │
│  "Client deleted   │
│   successfully"    │
└───────────────────┘
```

### 12.6 Export/Import Workflow

**Export CSV:**
```
┌─────────────────────────┐
│  Set filters (optional)  │
│  → Click Export button   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  GET /clients/export/csv │
│  ?search=&status=active  │
│  → Returns Blob          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Trigger download:       │
│  URL.createObjectURL()   │
│  → "clients_export.csv"  │
└─────────────────────────┘
```

**Import CSV:**
```
┌─────────────────────────┐
│  Click Import button     │
│  → File input dialog     │
└────────┬────────────────┘
         │ Select CSV file
         ▼
┌─────────────────────────┐
│  POST /clients/import    │
│  (multipart FormData)    │
│  → Server parses CSV     │
│  → Validates each row    │
│  → Creates clients       │
│  → Collects errors       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Response:               │
│  { "success": true,      │
│    "imported": 15,       │
│    "errors": [...] }     │
│  → Show import summary   │
│  → Refresh client list   │
└─────────────────────────┘
```

---

## Electron Desktop-Specific Behavior

The application runs as an Electron desktop application. Key desktop-specific behaviors related to the Client module:

| Feature | Implementation | File |
|---------|---------------|------|
| File storage | Local filesystem at `storage/Clients/` | Electron main process resolves paths |
| File downloads | Native file save dialog via `FileResponse` | FastAPI serves files through backend |
| Print reports | Native print dialog | Electron window.print() |
| Offline resilience | Local API calls handled via FastAPI on localhost | Backend runs on localhost:8000 |
| Document preview | PDF preview via `<embed>` tag in native window | Frontend renders inline |

**Backend URL Configuration:**
```typescript
// From services/apiClient.ts
const API_BASE_URL = 'http://localhost:8000';  // FastAPI on localhost
```

**File Storage Path:**
```python
# From backend/app/core/config.py
STORAGE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
```

---

## Security & Validation Summary

| Concern | Implementation |
|---------|---------------|
| Authentication | JWT Bearer tokens, required on all endpoints |
| Authorization | Role-based via `get_current_active_user` |
| Input validation | Pydantic schemas (backend) + Zod schemas (frontend) |
| File upload validation | Extension whitelist (.pdf, .xlsx, .xls) + 10MB size limit |
| SQL Injection | SQLAlchemy ORM (parameterized queries) |
| XSS | React's built-in HTML escaping |
| Duplicate detection | Database UNIQUE constraints + application-level checks |
| Data deletion safety | Confirmation dialog + CASCADE/SET NULL rules |
| File path traversal | `os.path.basename` sanitization for file names |

---

## Frontend Component File Index

| File | Component | Purpose |
|------|-----------|---------|
| `frontend/src/features/clients/pages/ClientsPage.tsx` | ClientsPage | Main client list page |
| `frontend/src/features/clients/pages/ClientDetailPage.tsx` | ClientDetailPage | Client profile with tabs |
| `frontend/src/features/clients/components/ClientForm.tsx` | ClientForm | Add/Edit client form |
| `frontend/src/features/clients/components/ClientTable.tsx` | ClientTable | Client list table |
| `frontend/src/features/clients/components/ActivityLog.tsx` | ActivityLog | Activity feed component |
| `frontend/src/features/clients/hooks/useClients.ts` | useClients | React Query hooks |
| `frontend/src/features/clients/services/clientService.ts` | clientService | API service layer |
| `frontend/src/features/clients/validations/clientSchema.ts` | clientSchema | Zod validation schema |
| `frontend/src/features/clients/types/client.ts` | Client | TypeScript types |

---

*End of Client Module Documentation*