# Graph Report - sale-tax-software  (2026-07-17)

## Corpus Check
- 227 files · ~407,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1811 nodes · 3884 edges · 131 communities (81 shown, 50 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 692 edges (avg confidence: 0.61)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a93d980`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Backend Infrastructure & IRIS
- Withholding Tax Concepts
- Frontend Core Features
- App Routing & Navigation
- OD Skills & Agent Browser
- Section 165 Statements
- Landing Page UI
- Error Pages
- Dashboard Mockups
- statement_165.py
- App.tsx
- FastAPI
- navigator.py
- BackupPage.tsx
- DesktopSyncService
- Document
- compilerOptions
- Client
- ComplianceEngine
- documents.py
- ClientDetailPage.tsx
- admin_approval.py
- ClientForm.tsx
- SalesTaxRecord
- User
- DocumentCategory
- backup.py
- notifications.py
- Setting
- ApiClient
- start-dev.js
- Task
- statement_parser.py
- upload_batch
- ReportResponse
- description_i18n
- Dashboard.tsx
- title_i18n
- folder_service.py
- od
- blob_storage.py
- compilerOptions
- resolve_client
- BorderGlow.jsx
- open-design.json
- challan_parser.py
- super_parser.py
- Web prototype layouts
- import_clients_from_excel
- ComplianceViewPage.tsx
- DocumentsPage.tsx
- DocumentListView.tsx
- tags
- Workflow
- Document
- DocumentToolbar.tsx
- Agent Browser
- assets
- opencode.json
- vercel.json
- convert_pdf_to_markdown
- global_search
- NotFoundPage.tsx
- selectors.py
- Web prototype checklist
- env.py
- useCase
- session.py
- template.md
- Settings
- withholding.py
- vite-env.d.ts
- document.ts
- fix_admin_password.py
- reset_db.py
- backup.sh
- start-prod.sh
- Company Administrator Portrait Avatar
- Finance Professional Portrait Avatar
- Connection Error Illustration
- Section 165 Compliance Illustration
- Tax Suite SVG Logo
- App Router Withholding Route Definitions
- Client Type (Withholding Registration Fields)
- Excel Utility Library for Statement 165
- Statement 165 API Service
- useWithholding React Query Hook
- Master Sheet Excel Data Builder
- Withholding Record Zod Validation Schema
- Dashboard Stat Cards (Withholding Challans Metric)
- Login Page (Uses /icon.png)
- Register Page (Uses /icon.png)
- Landing Dashboard Mockup Component
- Landing Hero Section (Avatar Images)
- Landing Logo Component (Uses /icon.png)
- Landing Solutions Section (Withholding Mention)
- documentSchema.ts
- footer.tsx
- Agent Browser Automation Skill
- Browser Safety Rules
- Header.tsx
- Chrome DevTools Protocol
- Open Design Preview Validation
- Web Prototype Seed Template
- Tomato Timer Example
- Web Prototype Quality Checklist
- ReportsPage.tsx
- Section Layout Skeletons
- Single Accent Rule
- ConnectionErrorPage (Route /connection-error)
- NotFoundPage (404 Route with Astronaut Image)
- Section165Icon (Animated SVG Badge Component)
- SalesTaxPage.tsx
- Section165Page (WHT Statement 165 Entry/Upload UI)
- SettingsPage.tsx
- AnimatedList.d.ts
- TasksPage.tsx
- taskSchema.ts
- useToastStore.ts

## God Nodes (most connected - your core abstractions)
1. `User` - 116 edges
2. `Client` - 113 edges
3. `Document` - 113 edges
4. `Task` - 39 edges
5. `ClientDetailPage()` - 34 edges
6. `TaskStatus` - 29 edges
7. `ApiClient` - 28 edges
8. `get_dashboard()` - 26 edges
9. `Notification` - 25 edges
10. `useDocumentStore` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Tax Compliance Dashboard Screenshot` --semantically_similar_to--> `Tax Compliance Overview Graphic`  [INFERRED] [semantically similar]
  Tax Compliance Dashboard Picture.png → TaxCompliance.png
- `Tax Suite Application Icon` --semantically_similar_to--> `Tax Suite HD Application Icon`  [INFERRED] [semantically similar]
  frontend/public/icon.png → tax sute icon hD final.png
- `Section 153(1)(a) - Payment for Goods` --semantically_similar_to--> `Section 236H - Purchase by Retailers`  [INFERRED] [semantically similar]
  PDF for Extraction/198581566.pdf → withholding challan/236h challan ( may 2026.pdf
- `import_clients_from_excel()` --indirect_call--> `Client`  [INFERRED]
  import_clients_from_excel.py → backend/app/models/client.py
- `FastAPI Backend` --shares_data_with--> `React Vite Frontend`  [INFERRED]
  backend/requirements.txt → frontend/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend Technology Stack** — backend_requirements_fastapibackend, docker_compose_yml_postgresinfra, requirements_txt_vercelfastapi [INFERRED 0.95]
- **Tax Data Processing Pipeline** — iris_automation_config_irisautomation, pdf_for_extraction_challans, pdf_for_extraction_cprreceipts, khawar_khan_withholdingagent, section_153_1_a_withholdingtax [INFERRED 0.85]
- **Web Prototype Asset Chain** — od_skills_web_prototype_71992a9236_skill_webprototypeskill, od_skills_web_prototype_71992a9236_assets_template_seedtemplate, od_skills_web_prototype_71992a9236_references_layouts_sectionskeletons, od_skills_web_prototype_71992a9236_references_checklist_qualitychecklist, od_skills_web_prototype_71992a9236_example_tomato [EXTRACTED 1.00]
- **Khawar Khan Section 153(1)(a) Payment Series for Pepsi-Cola (Sep-Dec 2025)** — entity_khawar_khan, entity_pepsi_cola_international, concept_section_153_1_a, pdf_for_extraction_it2025090401011099865_1, pdf_for_extraction_it2025093001011810449, pdf_for_extraction_it2025102901011764066, pdf_for_extraction_it2025112701011777262, pdf_for_extraction_it2025122401011790880 [EXTRACTED 1.00]
- **Withholding Tax Feature Architecture (Frontend)** — frontend_src_features_withholding_pages_withholdingpage_withholdingpage, statement165_components_section165page, frontend_src_features_withholding_components_challanimportpanel_challanimportpanel, frontend_src_features_withholding_components_statementimportpanel_statementimportpanel, frontend_src_features_withholding_components_withholdingtable_withholdingtable, frontend_src_features_withholding_components_withholdingform_withholdingform, frontend_src_features_withholding_hooks_usewithholding_usewithholding, frontend_src_features_withholding_validations_withholdingschema_schema, frontend_src_features_withholding_services_withholdingservice_withholdingservice, frontend_src_features_statement165_services_statement165service_statement165service, frontend_src_components_navigation_sidebar_sidebar, frontend_src_app_app_withholding_routes [EXTRACTED 1.00]
- **Application Static Asset Usage Group** — frontend_public_icon, frontend_public_logo, frontend_public_images_avatar_1, frontend_public_images_avatar_2, frontend_public_images_avatar_3, frontend_public_images_astronaut_portal, frontend_public_images_connection_error, frontend_public_images_section_165, frontend_src_pages_register_register_register_page, frontend_src_pages_login_login_login_page, landing_components_hero_hero_section, pages_notfound_notfoundpage, pages_connectionerror_connectionerrorpage, frontend_src_components_navigation_sidebar_sidebar [EXTRACTED 1.00]

## Communities (131 total, 50 thin omitted)

### Community 0 - "Backend Infrastructure & IRIS"
Cohesion: 0.21
Nodes (17): FastAPI Backend, PostgreSQL with PgBouncer Infrastructure, React Vite Frontend, IRIS FBR Portal Automation, IRIS Playwright Automation Dependencies, IRIS FBR Pakistan Tax Portal, KHAWAR KHAN Withholding Agent, Proprietary Software License (+9 more)

### Community 1 - "Withholding Tax Concepts"
Cohesion: 0.24
Nodes (17): Section 153(1)(a) - Payment for Goods, Section 165 - Withholding Tax Statements, Section 236H - Purchase by Retailers, WHT Statement 20-Column Validation Rule Set, Khawar Khan (Withholding Agent / CNIC 1310112184639), Pepsi-Cola International (Private) Limited, RTO Abbottabad (Regional Tax Office), Shimla Marketing (Business Name of Khawar Khan) (+9 more)

### Community 2 - "Frontend Core Features"
Cohesion: 0.07
Nodes (51): ConfirmAddClientDialog(), ConfirmAddClientDialogProps, PendingClient, ChallanImportPanel(), Props, ChallanResultProps, ImportResultCard(), StatementResultProps (+43 more)

### Community 5 - "Section 165 Statements"
Cohesion: 0.06
Nodes (17): Whts165Page(), AnimatedList(), ALLOWED_EXTENSIONS, getFileExtension(), Section165Page(), Step, UploadError, validateFile() (+9 more)

### Community 9 - "statement_165.py"
Cohesion: 0.06
Nodes (66): append_to_existing_statement_endpoint(), AppendRequest, create_entry(), create_session(), delete_entry(), download_statement_165(), export_statement(), heartbeat() (+58 more)

### Community 10 - "App.tsx"
Cohesion: 0.10
Nodes (16): App(), AdminRoute(), AdminRouteProps, ProtectedRoute(), ProtectedRouteProps, queryClient, AdminLayout(), adminNavItems (+8 more)

### Community 11 - "FastAPI"
Cohesion: 0.05
Nodes (48): Vercel Python serverless entrypoint for the FastAPI backend.  Vercel's @vercel, Config, login(), LoginRequest, LoginResponse, BaseModel, Session, User (+40 more)

### Community 12 - "navigator.py"
Cohesion: 0.06
Nodes (38): ABC, Browser, BrowserContext, close(), launch(), Page, save_session(), _session_exists() (+30 more)

### Community 13 - "BackupPage.tsx"
Cohesion: 0.30
Nodes (11): useBackups(), useCreateBackup(), useDeleteBackup(), useRestoreBackup(), BackupPage(), formatDate(), formatSize(), backupService (+3 more)

### Community 14 - "DesktopSyncService"
Cohesion: 0.07
Nodes (36): get_document_desktop_path(), get_sync_config(), get_sync_status(), Session, User, Desktop Sync API Endpoints Provides REST API for desktop synchronization featur, Get current sync status and statistics., Manually trigger a full desktop synchronization.          - **limit**: Optiona (+28 more)

### Community 15 - "Document"
Cohesion: 0.12
Nodes (44): Config, _create_client_if_approved(), create_withholding_record(), delete_withholding_record(), DocumentInfo, get_withholding_record(), get_withholding_records(), import_withholding_challan() (+36 more)

### Community 16 - "compilerOptions"
Cohesion: 0.04
Nodes (45): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+37 more)

### Community 17 - "Client"
Cohesion: 0.11
Nodes (40): apply_client_filters(), apply_client_sort(), ClientActivityResponse, ClientCreate, ClientImportResponse, ClientListResponse, ClientResponse, ClientStats (+32 more)

### Community 18 - "ComplianceEngine"
Cohesion: 0.07
Nodes (32): get_compliance_status(), get_compliance_summary(), get_missing_count(), get_missing_documents(), User, Compliance API Endpoints Provides compliance status, missing documents, and sum, Get aggregate compliance summary across all clients., Get all missing compliance documents. (+24 more)

### Community 19 - "documents.py"
Cohesion: 0.18
Nodes (37): batch_copy_documents(), batch_delete_documents(), batch_move_documents(), copy_document(), delete_document(), document_to_response(), download_document(), empty_trash() (+29 more)

### Community 20 - "ClientDetailPage.tsx"
Cohesion: 0.16
Nodes (20): useClient(), useClientActivity(), ClientDetailPage(), formatFileSize(), getFileIcon(), MONTH_NAMES, parsePeriod(), SALES_TAX_STATUS_STYLES (+12 more)

### Community 21 - "admin_approval.py"
Cohesion: 0.16
Nodes (34): _admin_only(), AdminStatsResponse, approve_user(), ban_user(), BanDurationRequest, Config, delete_user(), disable_user() (+26 more)

### Community 22 - "ClientForm.tsx"
Cohesion: 0.07
Nodes (47): activityIcons, activityLabels, ActivityLog(), ActivityLogProps, BUSINESS_TYPES_BY_CLIENT_TYPE, CLIENT_TYPE_OPTIONS, ClientForm(), ClientFormProps (+39 more)

### Community 23 - "SalesTaxRecord"
Cohesion: 0.11
Nodes (31): create_sales_tax_record(), delete_sales_tax_record(), get_sales_tax_record(), get_sales_tax_records(), BaseModel, Session, UploadFile, User (+23 more)

### Community 24 - "User"
Cohesion: 0.24
Nodes (26): Activity, BreakdownItem, CalendarDay, CalendarDueItem, ComplianceCalendar, CompliancePoint, ComplianceScore, DashboardResponse (+18 more)

### Community 25 - "DocumentCategory"
Cohesion: 0.27
Nodes (24): ActivityRequest, BatchCopyRequest, BatchDeleteRequest, BatchMoveRequest, BulkUploadResponse, Config, CopyRequest, DocumentListResponse (+16 more)

### Community 26 - "backup.py"
Cohesion: 0.14
Nodes (23): BackupResponse, Config, create_backup(), delete_backup(), get_backup(), list_backups(), perform_backup(), BaseModel (+15 more)

### Community 27 - "notifications.py"
Cohesion: 0.14
Nodes (21): clear_all_notifications(), delete_notification(), get_notifications(), get_unread_count(), mark_all_as_read(), mark_as_read(), NotificationResponse, Session (+13 more)

### Community 28 - "Setting"
Cohesion: 0.22
Nodes (20): Config, create_setting(), delete_setting(), get_setting(), get_settings(), get_storage_path(), BaseModel, Session (+12 more)

### Community 29 - "ApiClient"
Cohesion: 0.10
Nodes (10): AdminDashboard(), AdminStats, AdminStatsResponse, AdminUser, getRoleBadge(), getStatusBadges(), UserFilter, UserManagement() (+2 more)

### Community 30 - "start-dev.js"
Cohesion: 0.13
Nodes (21): backendDir, backendOnly, children, { createHash }, { existsSync, readFileSync, writeFileSync }, isBackendHealthy(), { join }, log() (+13 more)

### Community 31 - "Task"
Cohesion: 0.25
Nodes (19): Config, create_task(), delete_task(), get_task(), get_tasks(), BaseModel, Session, User (+11 more)

### Community 32 - "statement_parser.py"
Cohesion: 0.17
Nodes (21): _find_column(), _normalize_ntn(), parse_statement(), parse_statement_excel(), parse_statement_pdf(), _parse_statement_period(), Parser for withholding statement files (PDF and Excel). Extracts multiple rows, Single row extracted from a statement file. (+13 more)

### Community 33 - "upload_batch"
Cohesion: 0.17
Nodes (19): compute_checksum(), get_file_type(), Document, UploadFile, upload_batch(), upload_document(), ClassificationResult, classify_by_filename() (+11 more)

### Community 34 - "ReportResponse"
Cohesion: 0.26
Nodes (16): ComplianceReportRequest, generate_client_summary(), generate_compliance_report(), generate_sales_tax_report(), generate_task_report(), generate_withholding_report(), BaseModel, Session (+8 more)

### Community 35 - "description_i18n"
Cohesion: 0.11
Nodes (19): description_i18n, ar, de, en, es, fr, id, it (+11 more)

### Community 36 - "Dashboard.tsx"
Cohesion: 0.05
Nodes (38): DashboardQuery, useDashboard(), Activity, CalendarDay, CalendarDueItem, ComplianceCalendar, CompliancePoint, ComplianceScore (+30 more)

### Community 37 - "title_i18n"
Cohesion: 0.11
Nodes (19): title_i18n, ar, de, en, es, fr, id, it (+11 more)

### Community 38 - "folder_service.py"
Cohesion: 0.21
Nodes (16): copy_document_file(), ensure_client_folder_structure(), get_clients_storage(), get_storage_base(), move_document_file(), Path, Folder Service Scans the local file system and provides folder tree navigation, Search folder names matching a query string. (+8 more)

### Community 39 - "od"
Cohesion: 0.12
Nodes (16): od, capabilities, inputs, kind, mode, pipeline, platform, preview (+8 more)

### Community 40 - "blob_storage.py"
Cohesion: 0.18
Nodes (14): delete(), download_bytes(), is_blob_url(), is_enabled(), Vercel Blob storage client for a PRIVATE blob store.  Uploaded files are store, Return True if the stored path is a Vercel Blob URL rather than a local path., Blob storage is used whenever a read/write token is configured., Normalize a storage key into a safe blob pathname. (+6 more)

### Community 41 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, types (+6 more)

### Community 42 - "resolve_client"
Cohesion: 0.21
Nodes (13): bulk_resolve_clients(), name_similarity(), normalize_name(), normalize_ntn(), Client, Session, Client matching and auto-creation service for withholding imports. Matches by N, Normalize NTN to 7-1 format or return None. (+5 more)

### Community 43 - "BorderGlow.jsx"
Cohesion: 0.22
Nodes (12): animateValue(), BorderGlow(), buildGlowVars(), buildGradientVars(), COLOR_MAP, easeInCubic(), easeOutCubic(), GRADIENT_KEYS (+4 more)

### Community 44 - "open-design.json"
Cohesion: 0.14
Nodes (13): author, name, url, compat, agentSkills, description, homepage, license (+5 more)

### Community 45 - "challan_parser.py"
Cohesion: 0.24
Nodes (12): ChallanExtractResult, _detect_section(), _extract_text_from_pdf(), _parse_153_challan(), _parse_236h_challan(), parse_challan_pdf(), Parser for FBR withholding challan PDFs (236H and 153). Handles text-extractabl, Parse a 153 withholding challan. (+4 more)

### Community 46 - "super_parser.py"
Cohesion: 0.33
Nodes (12): _clean_entry(), detect_format(), _empty_metadata(), _extract_text_lines(), _normalize_ntn(), _parse_amount(), _parse_challan_lines(), _parse_cpr_lines() (+4 more)

### Community 47 - "Web prototype layouts"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 48 - "import_clients_from_excel"
Cohesion: 0.23
Nodes (11): clean_phone_number(), clean_string(), import_clients_from_excel(), main(), parse_registration_type(), Session, Import clients from Excel file into the database. This script reads the client, Clean and standardize phone numbers (+3 more)

### Community 49 - "ComplianceViewPage.tsx"
Cohesion: 0.19
Nodes (10): ComplianceSummary(), ComplianceSummaryProps, MissingDocumentsWidget(), useComplianceStatus(), useMissingDocuments(), COMPLIANCE_CATEGORIES, ComplianceViewPage(), MONTHS (+2 more)

### Community 50 - "DocumentsPage.tsx"
Cohesion: 0.16
Nodes (23): DocumentActionBar(), DocumentActionBarProps, DocumentGridView(), DocumentListView(), DocumentStatsCards(), StatCardProps, MoveCopyDialog(), MoveCopyDialogProps (+15 more)

### Community 51 - "DocumentListView.tsx"
Cohesion: 0.13
Nodes (19): BulkUploadDialog(), BulkUploadDialogProps, QueuedFile, DocumentCard(), getCategoryBadge(), getFileIcon(), getStatusBadge(), CategoryBadge() (+11 more)

### Community 52 - "tags"
Cohesion: 0.17
Nodes (12): tags, design, desktop, example, first-party, homepage, landing, marketing-page (+4 more)

### Community 53 - "Workflow"
Cohesion: 0.17
Nodes (11): Hard rules (the seed protects most of these — don't fight it), Output contract, Resource map, Step 0 — Pre-flight (do this once before writing anything), Step 1 — Prepare the artifact from the seed, Step 2 — Plan the section list, Step 3 — Paste and fill, Step 4 — Self-check (+3 more)

### Community 54 - "Document"
Cohesion: 0.16
Nodes (15): DocumentCardProps, DocumentGridViewProps, DocumentListViewProps, DocumentPreviewModalProps, DocumentTable(), DocumentTableProps, formatDate(), formatFileSize() (+7 more)

### Community 55 - "DocumentToolbar.tsx"
Cohesion: 0.13
Nodes (18): DocumentToolbar(), DocumentToolbarProps, FilterPanel(), SORT_OPTIONS, FolderExplorer(), FolderTreeItemProps, ShortcutHandlers, useDocumentKeyboardShortcuts() (+10 more)

### Community 56 - "Agent Browser"
Cohesion: 0.20
Nodes (9): Agent Browser, Browser Context Extraction, CDP Startup Contract, Context Hygiene, Open Design Smoke Path, Requirements, Safety Rules, Specialized Upstream Guides (+1 more)

### Community 57 - "assets"
Cohesion: 0.22
Nodes (9): assets, designSystem, skills, primary, context, ./assets/template.html, ./example.html, ./references/checklist.md (+1 more)

### Community 58 - "opencode.json"
Cohesion: 0.22
Nodes (8): agent, deepseek-system, description, mode, model, default_agent, model, $schema

### Community 59 - "vercel.json"
Cohesion: 0.22
Nodes (8): maxDuration, memory, buildCommand, functions, api/index.py, installCommand, outputDirectory, rewrites

### Community 60 - "convert_pdf_to_markdown"
Cohesion: 0.36
Nodes (7): convert_pdf_to_markdown(), extract_with_pdfplumber(), extract_with_pymupdf(), main(), Extract text using pdfplumber (better for tables and structured content), Extract text using PyMuPDF (good fallback), Convert a single PDF to Markdown

### Community 61 - "global_search"
Cohesion: 0.40
Nodes (5): global_search(), BaseModel, Session, User, SearchResult

### Community 64 - "Web prototype checklist"
Cohesion: 0.33
Nodes (5): Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 65 - "env.py"
Cohesion: 0.40
Nodes (4): Run migrations in 'offline' mode.      This configures the context with just a, Run migrations in 'online' mode.      In this scenario we need to create an En, run_migrations_offline(), run_migrations_online()

### Community 66 - "useCase"
Cohesion: 0.40
Nodes (5): useCase, en, zh-CN, exampleOutputs, query

### Community 68 - "template.md"
Cohesion: 0.50
Nodes (3): Context, Guidelines, Responsibilities

### Community 72 - "document.ts"
Cohesion: 0.11
Nodes (21): BulkUploadRequest, BulkUploadResult, ComplianceDocumentStatus, ComplianceMonthStatus, ComplianceStatusResponse, ComplianceSummary, CopyRequest, DocumentActivity (+13 more)

### Community 107 - "footer.tsx"
Cohesion: 0.08
Nodes (17): DashboardMockup(), stats, features, columns, Footer(), socials, avatars, Hero() (+9 more)

### Community 110 - "Header.tsx"
Cohesion: 0.27
Nodes (9): Header(), HeaderProps, SearchResult, useMarkAllAsRead(), useMarkAsRead(), useNotifications(), useUnreadCount(), notificationService (+1 more)

### Community 116 - "ReportsPage.tsx"
Cohesion: 0.36
Nodes (9): useDeleteReport(), useGenerateReport(), useReports(), ReportsPage(), reportService, Report, REPORT_TYPE_OPTIONS, ReportCreate (+1 more)

### Community 123 - "SalesTaxPage.tsx"
Cohesion: 0.10
Nodes (30): SalesTaxForm(), SalesTaxFormProps, monthName(), SalesTaxTable(), SalesTaxTableProps, useCreateSalesTaxRecord(), useDeleteSalesTaxRecord(), useSalesTaxRecords() (+22 more)

### Community 140 - "SettingsPage.tsx"
Cohesion: 0.13
Nodes (22): useSettings(), useUpdateSetting(), DesktopSyncSection(), SETTING_GROUPS, SETTING_LABELS, SettingsPage(), settingsService, Setting (+14 more)

### Community 181 - "TasksPage.tsx"
Cohesion: 0.25
Nodes (16): TaskForm(), TaskFormProps, useCreateTask(), useDeleteTask(), useTasks(), useUpdateTask(), TasksPage(), taskService (+8 more)

### Community 221 - "useToastStore.ts"
Cohesion: 0.15
Nodes (12): navigation, sectionsWithHref, Sidebar(), SidebarProps, withholdingSections, bgMap, iconMap, ToastContainer() (+4 more)

## Knowledge Gaps
- **341 isolated node(s):** `$schema`, `specVersion`, `name`, `title`, `zh-CN` (+336 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `ReportResponse`, `statement_165.py`, `FastAPI`, `Document`, `Client`, `admin_approval.py`, `SalesTaxRecord`, `DocumentCategory`, `backup.py`, `notifications.py`, `Setting`, `global_search`, `Task`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Client` connect `Client` to `upload_batch`, `ReportResponse`, `resolve_client`, `DesktopSyncService`, `Document`, `import_clients_from_excel`, `ComplianceEngine`, `documents.py`, `SalesTaxRecord`, `User`, `DocumentCategory`, `global_search`, `Task`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Document` connect `Document` to `ReportResponse`, `FastAPI`, `DesktopSyncService`, `Client`, `ComplianceEngine`, `documents.py`, `SalesTaxRecord`, `User`, `DocumentCategory`, `global_search`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 113 inferred relationships involving `User` (e.g. with `AdminStatsResponse` and `BanDurationRequest`) actually correct?**
  _`User` has 113 INFERRED edges - model-reasoned connections that need verification._
- **Are the 110 inferred relationships involving `Client` (e.g. with `ClientActivityResponse` and `ClientCreate`) actually correct?**
  _`Client` has 110 INFERRED edges - model-reasoned connections that need verification._
- **Are the 110 inferred relationships involving `Document` (e.g. with `ClientActivityResponse` and `ClientCreate`) actually correct?**
  _`Document` has 110 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `Task` (e.g. with `Activity` and `BreakdownItem`) actually correct?**
  _`Task` has 36 INFERRED edges - model-reasoned connections that need verification._