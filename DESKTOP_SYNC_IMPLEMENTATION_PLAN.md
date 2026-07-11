# Desktop Sync Implementation Plan
**Date:** July 1, 2026  
**Task:** Implement Desktop Folder Synchronization for Tax Compliance Software

## Executive Summary

This document outlines the complete implementation plan to synchronize the software's internal folder structure with a Desktop folder, enabling users to access documents through both the software interface and Windows File Explorer.

---

## Current State Analysis

### Existing Folder Structure (Software Internal Storage)
```
storage/
  ├── Clients/
  │   └── {ClientName}/
  │       └── {Year}/
  │           ├── Sales_Tax/
  │           ├── Withholding/
  │           │   ├── 236H/
  │           │   └── 153/
  │           ├── KPRA/
  │           ├── Income_Tax/
  │           ├── Notices/
  │           └── Working_Files/
  ├── Exports/
  ├── Imports/
  ├── Reports/
  └── Templates/
```

### Critical Bugs Identified

#### Bug #1: Withholding Import Doesn't Save PDF Files
- **Location:** `backend/app/api/withholding.py` - `import_challan()` function
- **Issue:** PDFs are parsed but not saved to the folder structure
- **Impact:** Uploaded challan PDFs are lost after processing
- **Solution:** Save PDF to `storage/Clients/{Client}/{Year}/Withholding/{Section}/` and create Document record

#### Bug #2: Sales Tax Forms Have No Document Attachment
- **Location:** `frontend/src/features/sales-tax/components/SalesTaxForm.tsx`
- **Issue:** No file upload field exists on sales tax forms
- **Impact:** Cannot attach supporting documents to sales tax records
- **Solution:** Add file upload field and save to `storage/Clients/{Client}/{Year}/Sales_Tax/`

#### Bug #3: No Desktop Synchronization
- **Issue:** Files only exist in software storage, not accessible via Desktop
- **Impact:** Users cannot access files through File Explorer
- **Solution:** Implement bidirectional sync service

#### Bug #4: No "Open in Explorer" Feature
- **Issue:** No way to navigate from software to physical file location
- **Impact:** Poor user experience, file management difficulty
- **Solution:** Add IPC handler and UI buttons to open folders in Windows Explorer

---

## Target Desktop Structure

```
Desktop/
  └── SaleTaxSoftware/
      └── Clients/
          └── {ClientName}/
              └── {Year}/
                  ├── Sales_Tax/
                  ├── Withholding/
                  │   ├── 236H/
                  │   └── 153/
                  ├── KPRA/
                  ├── Income_Tax/
                  ├── Notices/
                  └── Working_Files/
```

---

## Implementation Phases

### Phase 1: Fix Existing Bugs (Critical Priority)

#### Task 1.1: Fix Withholding PDF Storage
**Files to Modify:**
- `backend/app/api/withholding.py`
- `backend/app/services/file_storage.py`

**Changes Required:**
1. In `import_challan()`, after parsing PDF:
   - Get client name from resolver
   - Determine target folder using `folder_service.get_folder_for_category()`
   - Save PDF file using `file_storage.save_file()`
   - Create Document record in database
   - Link document_id to withholding record
2. Update WithholdingRecord model to include `document_id` foreign key

**Estimated Time:** 2 hours

#### Task 1.2: Add File Upload to Sales Tax Form
**Files to Modify:**
- `frontend/src/features/sales-tax/components/SalesTaxForm.tsx`
- `frontend/src/features/sales-tax/validations/salesTaxSchema.ts`
- `backend/app/api/sales_tax.py`
- `backend/app/models/sales_tax.py`

**Changes Required:**
1. Add file input field to SalesTaxForm component
2. Update validation schema to accept optional file
3. Modify API endpoint to handle file upload
4. Save file to `storage/Clients/{Client}/{Year}/Sales_Tax/`
5. Create Document record and link to SalesTaxRecord

**Estimated Time:** 2 hours

---

### Phase 2: Database Schema Updates

#### Task 2.1: Create Desktop Sync Configuration Table
**File to Create:** `database/migrations/005_desktop_sync.sql`

```sql
-- Desktop sync configuration
CREATE TABLE IF NOT EXISTS sync_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    desktop_base_path TEXT NOT NULL,
    sync_enabled BOOLEAN DEFAULT true,
    sync_direction TEXT DEFAULT 'software_to_desktop',
    auto_sync BOOLEAN DEFAULT true,
    sync_on_startup BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add desktop sync tracking to documents
ALTER TABLE documents ADD COLUMN desktop_synced BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN desktop_path TEXT;
ALTER TABLE documents ADD COLUMN desktop_synced_at TIMESTAMP;

-- Add document_id to withholding records
ALTER TABLE withholding_records ADD COLUMN document_id TEXT REFERENCES documents(id);

-- Add document_id to sales_tax records  
ALTER TABLE sales_tax_records ADD COLUMN document_id TEXT REFERENCES documents(id);

-- Insert default config
INSERT INTO sync_config (id, desktop_base_path) 
VALUES ('default', 'Desktop/SaleTaxSoftware');
```

**Estimated Time:** 30 minutes

---

### Phase 3: Backend Desktop Sync Service

#### Task 3.1: Create Desktop Sync Service
**File to Create:** `backend/app/services/desktop_sync.py`

**Key Functions:**
1. `get_desktop_base_path()` - Get configured Desktop sync path
2. `ensure_desktop_folder_structure(client_name, year)` - Mirror folder structure on Desktop
3. `sync_document_to_desktop(document_id)` - Copy single document to Desktop
4. `sync_all_documents()` - Bulk sync all documents
5. `remove_from_desktop(document_id)` - Remove file from Desktop on delete
6. `watch_desktop_changes()` - Monitor Desktop folder for external changes (bidirectional sync)

**Estimated Time:** 4 hours

#### Task 3.2: Create Sync API Endpoints
**File to Create:** `backend/app/api/sync.py`

**Endpoints:**
- `GET /api/v1/sync/config` - Get sync configuration
- `POST /api/v1/sync/config` - Update sync configuration
- `GET /api/v1/sync/status` - Get sync status (last sync time, pending files)
- `POST /api/v1/sync/trigger` - Manually trigger full sync
- `POST /api/v1/sync/document/{id}` - Sync specific document to Desktop
- `GET /api/v1/sync/path` - Get Desktop path for a document

**Estimated Time:** 2 hours

#### Task 3.3: Integrate Sync Service with File Operations
**Files to Modify:**
- `backend/app/services/file_storage.py`

**Changes:**
- After saving any file, automatically trigger `sync_document_to_desktop()`
- On file delete, call `remove_from_desktop()`
- On file rename/move, update Desktop location

**Estimated Time:** 1 hour

---

### Phase 4: Electron IPC Enhancements

#### Task 4.1: Add Desktop IPC Handlers
**File to Modify:** `frontend/electron/main.ts`

**New IPC Handlers:**
```typescript
// Open folder in Windows Explorer
ipcMain.handle('shell:openPath', async (_event, path: string) => {
  await shell.openPath(path);
  return { success: true };
});

// Show file in Explorer (highlight file)
ipcMain.handle('shell:showItemInFolder', async (_event, path: string) => {
  shell.showItemInFolder(path);
  return { success: true };
});

// Copy file with progress
ipcMain.handle('fs:copyFile', async (_event, source: string, dest: string) => {
  try {
    await fs.promises.copyFile(source, dest);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get user's Desktop path
ipcMain.handle('desktop:getPath', async () => {
  const desktopPath = app.getPath('desktop');
  return { path: desktopPath };
});
```

**Estimated Time:** 1 hour

#### Task 4.2: Update Preload API
**File to Modify:** `frontend/electron/preload.ts`

**New API Methods:**
```typescript
electronAPI: {
  // ... existing methods
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  getDesktopPath: () => ipcRenderer.invoke('desktop:getPath'),
  copyFile: (source: string, dest: string) => ipcRenderer.invoke('fs:copyFile', source, dest),
}
```

**Estimated Time:** 30 minutes

---

### Phase 5: Frontend UI Enhancements

#### Task 5.1: Add Desktop Sync Settings UI
**File to Modify:** `frontend/src/features/settings/pages/SettingsPage.tsx`

**New Settings Section:**
- Desktop Sync Path input field
- "Enable Desktop Sync" toggle
- Sync direction dropdown (Software→Desktop, Bidirectional, Desktop→Software)
- "Auto-sync on startup" toggle
- "Sync Now" button
- Last sync timestamp display
- Sync status indicator (green/yellow/red)

**Estimated Time:** 2 hours

#### Task 5.2: Add "Open in Explorer" Actions
**Files to Modify:**
- `frontend/src/features/documents/components/DocumentActionBar.tsx`
- `frontend/src/features/documents/components/DocumentCard.tsx`
- `frontend/src/features/documents/components/DocumentTable.tsx`

**New Features:**
- Right-click context menu: "Open in File Explorer"
- Right-click context menu: "Show in Folder"
- Action bar button: "Open Folder Location" (for selected documents)

**Estimated Time:** 2 hours

#### Task 5.3: Add Sync Status Indicator in Header
**File to Modify:** `frontend/src/components/navigation/Header.tsx`

**New Element:**
- Sync icon with tooltip showing last sync time
- Click to view sync status modal
- Shows sync progress during active sync

**Estimated Time:** 1 hour

#### Task 5.4: Enhance Folder Explorer Component
**File to Modify:** `frontend/src/features/documents/components/FolderExplorer.tsx`

**New Features:**
- Tab view: "Software Storage" | "Desktop Storage"
- Show Desktop folder tree
- "Open in Explorer" button for each folder
- Drag & drop support (optional)

**Estimated Time:** 3 hours

---

### Phase 6: Frontend Services & Hooks

#### Task 6.1: Create Sync Service
**File to Create:** `frontend/src/features/sync/services/syncService.ts`

**Methods:**
- `getConfig()` - Fetch sync configuration
- `updateConfig()` - Update sync settings
- `getSyncStatus()` - Get current sync status
- `triggerSync()` - Manually trigger full sync
- `syncDocument(id)` - Sync single document
- `getDesktopPath(documentId)` - Get Desktop path for document

**Estimated Time:** 1 hour

#### Task 6.2: Create Sync Hooks
**File to Create:** `frontend/src/features/sync/hooks/useSync.ts`

**Hooks:**
- `useSyncConfig()` - Query sync configuration
- `useUpdateSyncConfig()` - Mutation for updating config
- `useSyncStatus()` - Query sync status
- `useTriggerSync()` - Mutation for triggering sync

**Estimated Time:** 1 hour

#### Task 6.3: Create Sync Types
**File to Create:** `frontend/src/features/sync/types/sync.ts`

**Type Definitions:**
- `SyncConfig` interface
- `SyncStatus` interface
- `SyncDirection` type
- `SyncError` interface

**Estimated Time:** 30 minutes

---

## Testing Plan

### Unit Tests
1. Test `desktop_sync.py` service functions
2. Test sync API endpoints
3. Test IPC handlers

### Integration Tests
1. Test document upload → automatic Desktop sync
2. Test bulk sync operation
3. Test Desktop folder deletion handling
4. Test sync config persistence

### Manual Tests
1. Upload document from Documents page → verify Desktop copy
2. Upload challan from Withholding page → verify Desktop copy
3. Delete document → verify Desktop cleanup (optional behavior)
4. Change sync settings → verify behavior changes
5. Click "Open in Explorer" → verify correct folder opens
6. Restart application → verify sync on startup

---

## Deployment Checklist

- [ ] Run database migration 005_desktop_sync.sql
- [ ] Verify Desktop folder structure creation on first run
- [ ] Test with multiple clients
- [ ] Test with large document sets (bulk sync performance)
- [ ] Verify Windows permissions for Desktop folder creation
- [ ] Update user documentation
- [ ] Add sync status to system health check

---

## Performance Considerations

1. **Async Sync Operations:** All sync operations should be asynchronous to avoid blocking UI
2. **Batch Processing:** Sync multiple documents in batches rather than one-by-one
3. **Error Handling:** Gracefully handle Desktop folder permission errors
4. **Progress Reporting:** Show progress for bulk sync operations
5. **File Watching:** Use file system watchers efficiently (debounce events)

---

## Future Enhancements (Post-MVP)

1. **Conflict Resolution:** Handle cases where files are modified in both locations
2. **Selective Sync:** Allow users to choose which categories to sync
3. **Cloud Backup Integration:** Sync to cloud storage (Dropbox, OneDrive)
4. **Version History:** Keep track of document versions
5. **Sync Logs:** Detailed sync operation logs for troubleshooting

---

## Timeline Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Fix Bugs | 2 tasks | 4 hours |
| Phase 2: Database | 1 task | 0.5 hours |
| Phase 3: Backend Sync | 3 tasks | 7 hours |
| Phase 4: Electron IPC | 2 tasks | 1.5 hours |
| Phase 5: Frontend UI | 4 tasks | 8 hours |
| Phase 6: Frontend Services | 3 tasks | 2.5 hours |
| **Total** | **15 tasks** | **~23.5 hours** |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Desktop permission errors | Medium | High | Handle errors gracefully, fallback to software-only storage |
| Large file sync performance | Medium | Medium | Implement batch processing, show progress |
| Bidirectional sync conflicts | Low | High | Start with one-way sync, add conflict resolution later |
| User confusion about dual locations | Low | Medium | Clear UI indicators, documentation |

---

## Success Criteria

✅ Documents uploaded from any page save to correct Desktop folder  
✅ Folder structure on Desktop mirrors software structure  
✅ Users can open Desktop folders from within software  
✅ Sync settings configurable in Settings page  
✅ Sync status visible in UI  
✅ All existing bugs fixed  
✅ No performance degradation during sync operations  

---

**Document Version:** 1.0  
**Last Updated:** July 1, 2026