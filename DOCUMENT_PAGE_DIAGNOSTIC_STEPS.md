# Document Page Diagnostic Steps

## Changes Made

### 1. Added Error Display to DocumentsPage
- Added error alert banner at the top of the page
- Now shows API errors visually with details
- Imported `AlertCircle` icon and `useDocuments` hook

### 2. Enhanced Logging in useDocuments Hook  
- Added console.log for filters being sent
- Added console.log for API response received
- Added console.error for any errors
- Improved error message extraction from API response

## How to Diagnose the Issue

### Step 1: Open Browser DevTools
1. Navigate to `/documents` page
2. Open DevTools (F12 or Right-click → Inspect)
3. Go to **Console** tab

### Step 2: Check Console Logs
Look for these log messages:
- `[useDocuments] Fetching documents with filters:` - Shows what's being requested
- `[useDocuments] Received result:` - Shows what API returned
- `[useDocuments] Error fetching documents:` - Shows if there's an error

### Step 3: Check Network Tab
1. Go to **Network** tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for request to `/api/v1/documents`
4. Check:
   - **Status**: Should be 200 (green)
   - **Response**: Click on the request, go to "Response" tab to see data
   - **Preview**: See formatted JSON response

### Step 4: Check for Common Issues

#### Issue A: No Documents in Database
**Symptoms**: 
- API returns 200 OK
- Response shows `{"success": true, "data": [], "total": 0}`
- Page shows "No documents found" message

**Solution**: Upload some documents first

#### Issue B: Authentication Error (401)
**Symptoms**:
- Network tab shows 401 status
- Redirected to login page
- Console shows authorization errors

**Solution**: Log in again

#### Issue C: API Not Running
**Symptoms**:
- Network tab shows request failed (red)
- Console shows "Network Error" or "ERR_CONNECTION_REFUSED"
- No response data

**Solution**: Start the backend server (`start_backend.bat`)

#### Issue D: Backend Error (500)
**Symptoms**:
- Network tab shows 500 status (red)
- Response shows error details
- Red error banner appears on page

**Solution**: Check backend console/logs for Python errors

#### Issue E: CORS Error
**Symptoms**:
- Console shows "CORS policy" error
- Network request marked as failed
- Browser blocks the request

**Solution**: Check backend CORS configuration in `main.py`

## Next Steps Based on Findings

1. **If you see logs and data in console**: Documents are loading, check if the UI components are rendering properly
2. **If you see 401 error**: Login again
3. **If you see connection refused**: Start backend server
4. **If you see 500 error**: Check backend logs for Python traceback
5. **If you see data but empty UI**: Component rendering issue, need to debug React components

## Quick Test

To test if backend is working independently:
```bash
# In browser or curl
curl http://localhost:8000/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with token from localStorage (check Application → Local Storage → token).