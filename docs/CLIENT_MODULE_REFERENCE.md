# Client Module Reference

> **Last Updated**: 2026-06-23
> **Route**: `/clients` (list), `/clients/:id` (detail)
> **Backend API**: `/api/clients/`
> **Frontend Files**: `frontend/src/features/clients/`

---

## 1. Data Model (Backend - SQLAlchemy)

**File**: `backend/app/models/client.py` — Table: `clients`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default=uuid4 | |
| `client_name` | String(255) | NOT NULL, indexed | Required |
| `business_name` | String(255) | nullable | |
| `cnic` | String(20) | UNIQUE, nullable, indexed | 13 digits |
| `ntn` | String(50) | UNIQUE, nullable, indexed | 7-1 format |
| `strn` | String(50) | UNIQUE, nullable, indexed | 12-34-567890-12 |
| `contact_number` | String(50) | nullable | |
| `email` | String(255) | nullable | |
| `address` | Text | nullable | |
| `client_password` | Text | nullable | Portal credentials |
| `sales_tax_registered` | Boolean | default=False, NOT NULL | |
| `withholding_registered` | Boolean | default=False, NOT NULL | |
| `notes` | Text | nullable | |
| `contact_person` | String(255) | nullable, indexed | |
| `contact_person_designation` | String(255) | nullable | |
| `contact_person_phone` | String(50) | nullable | |
| `contact_person_email` | String(255) | nullable | |
| `secondary_phone` | String(50) | nullable | |
| `city` | String(100) | nullable, indexed | |
| `province` | String(100) | nullable | |
| `business_type` | String(255) | nullable, indexed | e.g. Retailer, Distributor |
| `client_type` | String(50) | nullable, indexed | e.g. Individual, Company |
| `registration_date` | Date | nullable | |
| `tax_period` | String(20) | nullable | e.g. Monthly, Quarterly |
| `fbr_office` | String(255) | nullable | |
| `is_active` | Boolean | default=True, NOT NULL | |
| `created_at` | DateTime | default=utcnow, NOT NULL | |
| `updated_at` | DateTime | default=utcnow, onupdate, NOT NULL | |

### Relationships
- `sales_tax_entries` → `SalesTax` model (backref: `client`)
- `withholding_entries` → `Withholding` model (backref: `client`)
- `documents` → `Document` model (backref: `client`)
- `tasks` → `Task` model (backref: `client`)
- `activities` → `ClientActivity` model (backref: `client`)

---

## 2. Frontend Types (TypeScript)

**File**: `frontend/src/features/clients/types/client.ts`

### `Client` Interface (matches model exactly)
```typescript
export interface Client {
  id: string;
  client_name: string;
  business_name: string | null;
  cnic: string | null;
  ntn: string | null;
  strn: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  sales_tax_registered: boolean;
  withholding_registered: boolean;
  is_active: boolean;
  notes: string | null;
  contact_person: string | null;
  contact_person_designation: string | null;
  contact_person_phone: string | null;
  contact_person_email: string | null;
  secondary_phone: string | null;
  city: string | null;
  province: string | null;
  business_type: string | null;
  client_type: string | null;
  registration_date: string | null;
  tax_period: string | null;
  fbr_office: string | null;
  created_at: string;
  updated_at: string;
}
```

### API Request/Response Shapes
- **`ClientCreate`**: Same fields as Client but all optional except `client_name`. Plus `client_password` (optional).
- **`ClientUpdate`**: All optional (uses `Partial<ClientCreate>`).
- **`ClientListResponse`**: `{ success: boolean, data: Client[], total: number, page: number, limit: number }`
- **`ClientFilters`**: Used as query params for GET /clients/
  ```typescript
  export interface ClientFilters {
    page?: number;           // default: 1
    limit?: number;          // default: 25
    search?: string;         // searches: client_name, business_name, ntn, cnic, strn, email, contact_number, city, contact_person
    sales_tax_registered?: boolean;
    withholding_registered?: boolean;
    is_active?: boolean;     // default: true
    date_from?: string;
    date_to?: string;
    sort_by?: string;        // e.g. 'client_name', 'created_at'
    sort_order?: 'asc' | 'desc';
  }
  ```
- **`ClientActivity`**: `{ id: string, client_id: string, action: string, action_type?: string, description?: string, field_name: string, old_value: string, new_value: string, performed_by: string, created_at: string }`

---

## 3. API Endpoints (Backend)

**File**: `backend/app/api/clients.py`

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `POST` | `/clients/` | 201 | Create client. Returns `ClientResponse`. |
| `GET` | `/clients/` | 200 | List clients with filters, pagination, search. Returns `ClientListResponse`. |
| `GET` | `/clients/{id}` | 200 | Get single client by UUID. |
| `PUT` | `/clients/{id}` | 200 | Update client. |
| `DELETE` | `/clients/{id}` | 200 | Delete client. Returns `{ success, message }`. |
| `GET` | `/clients/export/csv` | 200 | Export filtered clients as CSV (Blob download). |
| `GET` | `/clients/{clientId}/activity` | 200 | Get activity log for a client. |
| `POST` | `/clients/import` | 200 | Bulk import clients from CSV/Excel (multipart form-data). |

### Duplicate Detection (POST / PUT)
- Returns **409 Conflict** with body: `{ "field": "ntn"|"cnic"|"strn", "message": "Client with this NTN/CNIC/STRN already exists" }`
- The `useCreateClient` / `useUpdateClient` hooks handle this and surface the specific field error.

### Search Behavior (GET /clients/?search=...)
Searches across these fields using `ILIKE`:
- `client_name`, `business_name`, `ntn`, `cnic`, `strn`, `email`, `contact_number`, `city`, `contact_person`

### Sorting (GET /clients/?sort_by=...&sort_order=asc|desc)
Sortable by any column. Default: `created_at DESC`.

---

## 4. Frontend Service

**File**: `frontend/src/features/clients/services/clientService.ts`

```typescript
export const clientService = {
  getAll(filters?: ClientFilters): Promise<ClientListResponse>,
  getById(id: string): Promise<Client>,
  create(data: ClientCreate): Promise<Client>,
  update(id: string, data: ClientUpdate): Promise<Client>,
  delete(id: string): Promise<{ success: boolean; message: string }>,
  exportCsv(filters?: ClientFilters): Promise<Blob>,
  getActivity(clientId: string): Promise<ClientActivity[]>,
  bulkImport(formData: FormData): Promise<{ success: boolean; imported: number; errors: any[] }>,
}
```

All use `apiClient` which has base URL from env, interceptors for auth token, 401 handling, error normalization.

---

## 5. React Hooks (React Query)

**File**: `frontend/src/features/clients/hooks/useClients.ts`

| Hook | Returns | Query Key | Config |
|------|---------|-----------|--------|
| `useClients(filters?)` | `useQuery<ClientListResponse>` | `['clients', filters]` | staleTime: 5min |
| `useClient(id)` | `useQuery<Client>` | `['client', id]` | enabled: !!id |
| `useClientActivity(clientId)` | `useQuery<ClientActivity[]>` | `['client-activity', clientId]` | staleTime: 1min |

| Mutation | Function Signature | Invalidates |
|----------|-------------------|-------------|
| `useCreateClient(onError?)` | `mutate(data: ClientCreate)` | `['clients']` |
| `useUpdateClient(onError?)` | `mutate({ id, data })` | `['clients']`, `['client', id]` |
| `useDeleteClient()` | `mutate(id: string)` | `['clients']` |
| `useExportClients()` | `mutate(filters?)` | none (returns Blob) |
| `useBulkImportClients()` | `mutate(formData: FormData)` | `['clients']` |

**Error handling**: Mutations wrap with `toast.promise()` for success/error toasts. `useCreateClient` and `useUpdateClient` accept an `onError` callback specifically for handling 409 duplicate field errors.

---

## 6. Validation Schema (Zod)

**File**: `frontend/src/features/clients/validations/clientSchema.ts`

### `clientCreateSchema`
| Field | Validation | Notes |
|-------|-----------|-------|
| `client_name` | `z.string().min(1).max(255)` | Required |
| `business_name` | `z.string().max(255).optional().nullable()` | |
| `cnic` | regex `/^\d{13}$/` | "CNIC must be 13 digits" |
| `ntn` | regex `/^\d{7}-\d{1}$/` | "NTN format: 1234567-1" |
| `strn` | regex `/^\d{2}-\d{2}-\d{6}-\d{2}$/` | "STRN format: 12-34-567890-12" |
| `contact_number` | regex `/^[\d\s\-\+\(\)]{7,20}$/` | "Invalid phone number" |
| `email` | `z.string().email().optional().nullable()` | |
| `address` | `z.string().max(500).optional().nullable()` | |
| `client_password` | `z.string().min(6).optional().nullable()` | For create; optional on update |
| `sales_tax_registered` | `z.boolean().default(false)` | |
| `withholding_registered` | `z.boolean().default(false)` | |
| `is_active` | `z.boolean().default(true)` | |
| `notes` | `z.string().max(1000).optional().nullable()` | |
| `contact_person` | `z.string().max(255).optional().nullable()` | ❌ Not in form |
| `contact_person_designation` | `z.string().max(255).optional().nullable()` | ❌ Not in form |
| `contact_person_phone` | `z.string().max(50).optional().nullable()` | ❌ Not in form |
| `contact_person_email` | `z.string().email().optional().nullable()` | ❌ Not in form |
| `secondary_phone` | `z.string().max(50).optional().nullable()` | ❌ Not in form |
| `city` | `z.string().max(100).optional().nullable()` | ❌ Not in form |
| `province` | `z.string().max(100).optional().nullable()` | ❌ Not in form |
| `business_type` | `z.string().max(255).optional().nullable()` | ❌ Not in form |
| `client_type` | `z.string().max(50).optional().nullable()` | ❌ Not in form |
| `registration_date` | `z.string().optional().nullable()` | ❌ Not in form |
| `tax_period` | `z.string().max(20).optional().nullable()` | ❌ Not in form |
| `fbr_office` | `z.string().max(255).optional().nullable()` | ❌ Not in form |

### `clientUpdateSchema` = `clientCreateSchema.partial()`

### Input Formatters (for display/input masks)
- `formatCNIC(value)` → `12345-6789012-3`
- `formatNTN(value)` → `1234567-1`
- `formatSTRN(value)` → `12-34-567890-12`
- `formatContactNumber(value)` → `+92 300 1234567`
- `cleanCNIC`, `cleanNTN`, `cleanSTRN`, `cleanContactNumber` (strip non-digits)

---

## 7. Pages

### 7a. ClientsListPage (`/clients`)

**File**: `frontend/src/features/clients/pages/ClientsPage.tsx`

#### State Management
- `search` (debounced 300ms → passed to filters.search)
- `filters` object: `sales_tax_registered`, `withholding_registered`, `is_active`, `date_from`, `date_to`
- Pagination: `page` (1-based), `limit` (default 25)
- Sorting: `sort_by`, `sort_order`
- `isCreateOpen` (boolean - controls Create modal)
- `showFilters` (boolean - toggle filter panel visibility)
- `importDialogOpen` (boolean - controls Import dialog)
- `selectedIds` (Set of strings - for bulk actions, NOT currently used)

#### Features
- **Search input** with 300ms debounce → updates `filters.search`
- **Filter panel** (collapsible): Sales Tax checkbox, Withholding checkbox, Active status checkbox, Date range inputs
- **"Add Client" button** → opens `ClientForm` modal in create mode
- **"Import Clients" button** → opens `UploadDialog` for CSV/Excel
- **"Export CSV" button** → triggers `useExportClients` mutation, downloads blob
- **`ClientTable` component** for display (receives `clients` from API response)
- **Pagination controls** at bottom (prev/next with page info)
- **Column headers** clickable for sorting (handled by parent, not table)

#### Layout
```
[Breadcrumb: Clients]
┌──────────────────────────────────────────────────┐
│  Heading: "Clients"                              │
│  Subtitle: "Manage your client portfolio"         │
├──────────────────────────────────────────────────┤
│  [Search...]  [Filters ▼] [Add Client] [Import]  │
├──────────────────────────────────────────────────┤
│  (Filters panel - collapsible)                   │
│  □ Sales Tax  □ Withholding  □ Active            │
│  From: [____]  To: [____]                        │
├──────────────────────────────────────────────────┤
│  Client Table (via ClientTable component)        │
│  Name | Business | NTN | Contact | ST Reg | WH   │
│  Reg | City | Created | Actions                  │
├──────────────────────────────────────────────────┤
│  Showing 1-25 of 100 results    [<] [>]           │
└──────────────────────────────────────────────────┘
```

#### Key Issue: `window.location.href` used instead of `useNavigate()`
- When viewing client detail, uses `window.location.href = '/clients/' + id` instead of `navigate()`
- This causes full page reload instead of client-side navigation

---

### 7b. ClientDetailPage (`/clients/:id`)

**File**: `frontend/src/features/clients/pages/ClientDetailPage.tsx`

#### Tabs (6 tabs)
1. **Overview** - Client info cards + Registration Status + Activity Log
2. **Sales Tax** - `SalesTaxTable` + "Add Sales Tax" button
3. **Withholding** - `WithholdingTable` + "Add Withholding" button
4. **Documents** - `DocumentTable` + "Upload Document" button
5. **Tasks** - Task list + "Add Task" button
6. **Reports** - Report type cards (Sales Summary, Withholding Summary, Tax Calendar) + Generated reports table

#### Tab Implementation Details
- **Active tab** tracked via URL hash (`window.location.hash` or defaults to `#overview`)
- Each sub-module tab uses its own hook (`useSalesTax(clientId)`, `useWithholding(clientId)`, `useDocuments(clientId)`, `useTasks(clientId)`)
- Forms/Uploads for sub-modules open in modals

#### Overview Tab Sections
1. **Client Information** card (2-column grid):
   - Client ID, Client Name, Business Name, City, Email, Contact Number, Address, Contact Person, Status (Active/Inactive badge), Classification badges

2. **Registration Status** card (2-column):
   - Sales Tax: Registered/Not Registered (shows STRN if registered)
   - Withholding: Registered/Not Registered
   - Shows colored icon backgrounds

3. **Additional Information** card:
   - City, Province, Business Type, Client Type, Registration Date, Tax Period, FBR Office
   - Contact Person details (name, designation, phone, email)
   - Secondary phone
   - **NOTE**: Only `city` is currently shown in Client Info; the other extra fields (province, business_type, client_type, registration_date, tax_period, fbr_office, contact_person_designation, contact_person_phone, contact_person_email, secondary_phone) are in the backend/types but NOT displayed on the detail page yet.

4. **Notes** section (if notes exist)

5. **Revenue Summary** cards (small stat cards):
   - Total Sales Tax
   - Total Withholding
   - Total Documents

6. **Activity Log** timeline at bottom

#### Action Buttons (top bar)
- **Edit** → opens `ClientForm` modal in edit mode (pre-filled with client data)
- **Delete** → opens confirmation modal, calls `useDeleteClient`
- **Back** → navigates to `/clients`

#### Key Classification Badge Logic
```typescript
const classificationBadges = [
  ...(client.sales_tax_registered ? [{ label: 'Sales Tax Registered', color: 'bg-green-100 text-green-800' }] : []),
  ...(client.withholding_registered ? [{ label: 'Withholding Registered', color: 'bg-blue-100 text-blue-800' }] : []),
  ...(client.client_type ? [{ label: client.client_type, color: 'bg-purple-100 text-purple-800' }] : []),
  ...(client.business_type ? [{ label: client.business_type, color: 'bg-amber-100 text-amber-800' }] : []),
];
```

#### Sub-module Modals (for Sales Tax, Withholding, Documents, Tasks)
- **Add/Edit modals** use sub-module-specific forms
- **Delete confirmation** uses a reusable global delete modal
- Reports tab generates PDF/CSV reports and stores them

---

## 8. Components

### 8a. ClientTable

**File**: `frontend/src/features/clients/components/ClientTable.tsx`

#### Props
```typescript
interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
}
```

#### Columns Displayed
| Column | Type | Render |
|--------|------|--------|
| Client Name | `client_name` | Bold text |
| Business Name | `business_name` | Text or `-` |
| NTN | `ntn` | Monospace or `-` |
| CNIC | `cnic` | Monospace or `-` |
| STRN | `strn` | Monospace or `-` |
| Sales Tax | `sales_tax_registered` | Green/Gray badge |
| Withholding | `withholding_registered` | Blue/Gray badge |
| Created | `created_at` | Formatted date |
| Actions | actions (display) | Eye, Edit, Trash2 icons |

#### Features
- Uses `@tanstack/react-table` (v8) with:
  - `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`
  - Local sorting (click header to sort)
  - Local search/filter (internal search bar)
- **Internal pagination**: `pageSize: 10` (⚠️ **KNOWN ISSUE**: conflicts with parent page's `limit: 25`)

#### UI Structure
```
[Global search input at top]
┌──────────────────────────────────────────────────┐
│ Table headers (clickable for sort)               │
├──────────────────────────────────────────────────┤
│ Rows with hover highlight + action buttons       │
├──────────────────────────────────────────────────┤
│ Showing X-Y of Z results    [<] [>]              │
└──────────────────────────────────────────────────┘
```

---

### 8b. ClientForm

**File**: `frontend/src/features/clients/components/ClientForm.tsx`

#### Props
```typescript
interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;  // null/undefined = create mode, Client = edit mode
}
```

#### Form Sections (in modal)
1. **Basic Information**
   - Client Name* (`client_name` - required)
   - Business Name (`business_name`)

2. **Tax Registration**
   - NTN (`ntn` - format validated)
   - CNIC (`cnic` - format validated)
   - STRN (`strn` - format validated)

3. **Contact Information**
   - Contact Number (`contact_number`)
   - Email (`email`)
   - Address (`address`)

4. **Registration Status**
   - Sales Tax Registered (checkbox)
   - Withholding Registered (checkbox)

5. **Portal Credentials**
   - Password (`client_password` - shown only on create)

6. **Notes**
   - Textarea

#### ⚠️ MISSING FIELDS (exist in model/types but NOT in form)
These 13 fields are in the backend model and TypeScript types but have no UI in ClientForm:
| Missing Field | Type | Purpose |
|---------------|------|---------|
| `contact_person` | string | Contact person name |
| `contact_person_designation` | string | Contact person title/role |
| `contact_person_phone` | string | Contact person direct phone |
| `contact_person_email` | string | Contact person email |
| `secondary_phone` | string | Secondary contact number |
| `city` | string | City |
| `province` | string | Province/State |
| `business_type` | string | e.g. Retailer, Distributor |
| `client_type` | string | e.g. Individual, Company |
| `registration_date` | date | Date of registration |
| `tax_period` | string | e.g. Monthly, Quarterly |
| `fbr_office` | string | FBR office name |
| `is_active` | boolean | Active status toggle |

#### Behavior
- **Create mode**: Empty form, submits to `POST /clients/`
- **Edit mode**: Pre-filled with client data, submits to `PUT /clients/{id}`
- **Validation**: Uses `clientCreateSchema` / `clientUpdateSchema` via Zod
- **Duplicate errors**: Handled specially with field-level error messages for NTN/CNIC/STRN

---

### 8c. ActivityLog

**File**: `frontend/src/features/clients/components/ActivityLog.tsx`

#### Props
```typescript
interface ActivityLogProps {
  activities: ClientActivity[];
  isLoading?: boolean;
}
```

#### Activity Icons Mapping
| Action | Icon | Color |
|--------|------|-------|
| `created` | UserPlus | green |
| `updated` | Edit | blue |
| `deleted` | Trash2 | red |
| `sales_tax_filed` | FileText | primary |
| `withholding_filed` | DollarSign | primary |
| `document_uploaded` | Upload | purple |
| `document_downloaded` | Download | cyan |
| `archived` | Archive | amber |

#### Display
- Timeline-style list with icons on the left
- Each entry: Icon + Action label + Description + Timestamp + Performer name
- Loading state shows skeleton/spinner

---

## 9. Routing & Navigation

### Route Configuration (in `App.tsx`)
```typescript
<Route path="/clients" element={<ClientsPage />} />
<Route path="/clients/:id" element={<ClientDetailPage />} />
```

### Sidebar Link
- Label: "Clients"
- Icon: `Users` (lucide-react)
- Path: `/clients`

---

## 10. API Client Configuration

**File**: `frontend/src/services/apiClient.ts`

```typescript
// Base: axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
// Interceptors:
//   Request: adds Authorization Bearer token from localStorage
//   Response: handles 401 (redirect login), normalizes errors
// Helpers:
//   apiClient.getBlob(url, params) - for file downloads (CSV exports)
```

---

## 11. Known Issues / TODOs

### Bugs
1. **`window.location.href` used in ClientsPage** instead of `useNavigate()` from react-router - causes full page reload on view client
2. **Dual pagination conflict**: `ClientTable` has internal `pageSize: 10` but `ClientsPage` sends `limit: 25` to API. Table paginates locally on 10 rows instead of 25.
3. **`is_active` filter** present in `ClientFilters` but not used in `ClientsPage` UI filter panel

### Missing Features (in order of priority)
1. **~13 fields from backend model not in `ClientForm`**:
   - `contact_person`, `contact_person_designation`, `contact_person_phone`, `contact_person_email`
   - `secondary_phone`, `city`, `province`, `business_type`, `client_type`
   - `registration_date`, `tax_period`, `fbr_office`, `is_active`
2. **Same fields missing from Overview tab** in `ClientDetailPage` (only `city` is shown)
3. **`is_active` filter** not exposed in `ClientsPage` filter panel
4. **Date range filter** (`date_from`/`date_to`) supported by API but not in `ClientsPage` UI filter panel
5. **Bulk actions** - `selectedIds` is defined but no bulk operations implemented

### UI/UX Improvements
6. **ClientTable internal pagination** should either be removed (server-side pagination only) or client-side pageSize should match server's limit
7. **Sorting** - The `ClientsPage` has sort state but the table uses its own local sorting via `@tanstack/react-table`. These are not synced, so sort resets when data refreshes.

---

## 12. Related Sub-modules

All sub-modules follow the same pattern: Hook → Service → apiClient.

| Sub-module | Service File | Key Functions | Detail Page Tab |
|-----------|-------------|---------------|-----------------|
| Sales Tax | `frontend/src/features/sales-tax/services/salesTaxService.ts` | CRUD + `getByClient(clientId)` | Tab 2 |
| Withholding | `frontend/src/features/withholding/services/withholdingService.ts` | CRUD + `getByClient(clientId)` | Tab 3 |
| Documents | `frontend/src/features/documents/services/documentService.ts` | CRUD + `upload` + `getByClient(clientId)` | Tab 4 |
| Tasks | `frontend/src/features/tasks/services/taskService.ts` | CRUD + `getByClient(clientId)` | Tab 5 |
| Reports | `frontend/src/features/reports/services/reportService.ts` | `generate` + `download` + `getByClient(clientId)` | Tab 6 |

### Sub-module Detail Page Tab Integration
Each tab on the detail page:
1. Calls its service's `getByClient(clientId)` to fetch records
2. Displays data in a table specific to that sub-module
3. Has an **Add** button that opens a modal form
4. Edit/Delete actions on each row

---

## 13. Quick Reference: Adding a New Client Field

To add a new field to the client module, modify these files in order:

| Step | File | What to Do |
|------|------|------------|
| 1 | `backend/app/models/client.py` | Add SQLAlchemy column |
| 2 | `database/migrations/XXXX_add_field.sql` | ALTER TABLE ADD COLUMN |
| 3 | `backend/app/api/clients.py` | Ensure field in `ClientCreate`/`ClientUpdate`/`ClientResponse` schemas |
| 4 | `frontend/src/features/clients/types/client.ts` | Add to `Client`, `ClientCreate`, `ClientUpdate` interfaces |
| 5 | `frontend/src/features/clients/validations/clientSchema.ts` | Add Zod validation rule |
| 6 | `frontend/src/features/clients/components/ClientForm.tsx` | Add form field UI |
| 7 | `frontend/src/features/clients/pages/ClientDetailPage.tsx` | Display in Overview tab sections |
| 8 | `frontend/src/features/clients/components/ClientTable.tsx` | Optionally add column |
| 9 | `database/schema/01-full-schema.sql` | Update for migration completeness |
| 10 | `docs/CLIENT_MODULE_REFERENCE.md` | Update this reference |

---

## 14. File Index

| File (relative to project root) | Purpose |
|---------------------------------|---------|
| `frontend/src/features/clients/types/client.ts` | TypeScript types/interfaces |
| `frontend/src/features/clients/services/clientService.ts` | API service calls |
| `frontend/src/features/clients/hooks/useClients.ts` | React Query hooks and mutations |
| `frontend/src/features/clients/validations/clientSchema.ts` | Zod validation schemas |
| `frontend/src/features/clients/components/ClientForm.tsx` | Create/Edit form modal |
| `frontend/src/features/clients/components/ClientTable.tsx` | Data table with sorting/pagination |
| `frontend/src/features/clients/components/ActivityLog.tsx` | Activity timeline component |
| `frontend/src/features/clients/pages/ClientsPage.tsx` | Client list page |
| `frontend/src/features/clients/pages/ClientDetailPage.tsx` | Client detail page with tabs |
| `backend/app/models/client.py` | SQLAlchemy model |
| `backend/app/api/clients.py` | FastAPI CRUD endpoints |
| `database/schema/01-full-schema.sql` | Full database schema |
| `database/migrations/002_add_client_fields.sql` | Previous migration adding extra fields |
| `frontend/src/services/apiClient.ts` | Shared axios-based API client |

---

## 15. Styling Conventions

| Class | Usage |
|-------|-------|
| `btn-primary` | Primary action button (blue) |
| `btn-secondary` | Secondary action button (gray outline) |
| `btn-danger` | Destructive action button (red) |
| `input` | Text input field |
| `label` | Form label text |
| `card` | Card container with padding/shadow |
| `badge` | Inline status badge |
| `badge-success` | Green success badge |
| `badge-warning` | Amber warning badge |
| `text-slate-900` | Primary text color (dark gray) |
| `text-slate-500` | Secondary/muted text color |
| `text-slate-600` | Medium emphasis text |
| `font-mono` | Monospace font (codes, IDs) |
| `hover:bg-slate-50` | Row hover highlight |

---

## 16. Test Files

| File | Purpose |
|------|---------|
| `frontend/src/__tests__/validations/clientSchema.test.ts` | Tests for Zod validation schemas |

---

## 17. Environment Configuration

- **API URL**: configured via `VITE_API_URL` in `.env` (default: `/api`)
- **Backend CORS**: configured in `backend/app/core/config.py`
- **Database**: SQLite (dev) / PostgreSQL (prod) via SQLAlchemy

---

## 18. Common Development Commands

```bash
# Start backend
cd backend && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Run tests
cd frontend && npm test

# Create migration
# (manual SQL files in database/migrations/)