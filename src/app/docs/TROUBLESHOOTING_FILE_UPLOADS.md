# Troubleshooting File Uploads to Databricks Knowledge Base

## Overview

This guide helps diagnose why files may not be appearing in the Databricks Knowledge Base after upload.

---

## Common Issues

### 1. **Mock Mode is Active**

**Symptom:** Files upload successfully in the UI but don't appear in Databricks.

**Cause:** The application is running in mock mode, which bypasses all Databricks API calls.

**Detection:**
- Look for a purple "🎨 Mock Mode" badge in the top-left corner of the screen
- Check browser console for messages like `🎨 [Mock Mode] Knowledge Base upload - bypassing Databricks`

**Solution:**
- Mock mode is automatically enabled when:
  - Running on `localhost` or `127.0.0.1`
  - Running on Figma.com domains
  - Environment variable `VITE_MOCK_MODE=true` is set
- To use real Databricks:
  - Deploy to a production environment (Vercel, etc.)
  - Ensure all environment variables are properly configured
  - Remove `VITE_MOCK_MODE` environment variable if set

---

### 2. **Missing Environment Variables**

**Symptom:** Upload fails with error "Missing required environment variables"

**Required Variables:**
```
DATABRICKS_HOST=adb-xxxxx.azuredatabricks.net
DATABRICKS_TOKEN=dapi...
DATABRICKS_WAREHOUSE_ID=abc123def456
CLIENT_NAME=YourCompanyName
CLIENT_SCHEMA=cohive (optional, defaults to 'cohive')
```

**Solution:**
1. Check Vercel environment settings (or your deployment platform)
2. Ensure all variables are set for the correct environment (Production/Preview/Development)
3. Redeploy after adding variables

---

### 3. **Databricks Permission Issues**

**Symptom:** Upload API returns 403 Forbidden or permission errors

**Cause:** The service principal or token doesn't have necessary permissions.

**Required Permissions:**
- **Volume Write:** `GRANT WRITE FILES ON VOLUME knowledge_base.cohive.files TO <principal>`
- **Table Write:** `GRANT INSERT ON TABLE knowledge_base.cohive.file_metadata TO <principal>`
- **Table Read:** `GRANT SELECT ON TABLE knowledge_base.cohive.file_metadata TO <principal>`

**Solution:**
Run these SQL commands in Databricks SQL Editor (as admin):
```sql
-- Replace <principal> with your service principal or user email
GRANT WRITE FILES ON VOLUME knowledge_base.cohive.files TO `your-service-principal@databricks.com`;
GRANT SELECT, INSERT ON TABLE knowledge_base.cohive.file_metadata TO `your-service-principal@databricks.com`;
```

---

### 4. **Volume or Table Doesn't Exist**

**Symptom:** Upload fails with "table not found" or "volume not found" error

**Cause:** The Knowledge Base infrastructure hasn't been set up in Databricks.

**Solution:**
Create the required infrastructure (see `/docs/DATABRICKS_SETUP.md` for complete setup):

```sql
-- Create catalog and schema
CREATE CATALOG IF NOT EXISTS knowledge_base;
CREATE SCHEMA IF NOT EXISTS knowledge_base.cohive;

-- Create volume for file storage
CREATE VOLUME IF NOT EXISTS knowledge_base.cohive.files;

-- Create metadata table
CREATE TABLE IF NOT EXISTS knowledge_base.cohive.file_metadata (
  file_id STRING,
  file_path STRING,
  file_name STRING,
  scope STRING,
  category STRING,
  brand STRING,
  project_type STRING,
  file_type STRING,
  is_approved BOOLEAN,
  upload_date TIMESTAMP,
  uploaded_by STRING,
  approver_email STRING,
  approval_date TIMESTAMP,
  approval_notes STRING,
  tags ARRAY<STRING>,
  citation_count INT,
  gem_inclusion_count INT,
  file_size_bytes BIGINT,
  content_summary STRING,
  insight_type STRING,
  input_method STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### 5. **Files Upload But Don't Appear in List**

**Symptom:** Upload returns success, but files don't show in the Knowledge Base

**Possible Causes:**
1. Files are uploaded to a different schema than expected
2. Files are filtered out by the list query
3. Database transaction didn't commit

**Debugging Steps:**

1. **Check the upload response:**
   - Open browser Developer Tools (F12)
   - Go to Network tab
   - Upload a file
   - Find the `upload` request
   - Check the response for `fileId` and `filePath`

2. **Query Databricks directly:**
```sql
-- Check if file exists in metadata table
SELECT * FROM knowledge_base.cohive.file_metadata 
ORDER BY upload_date DESC 
LIMIT 10;

-- Check files for specific brand
SELECT file_name, brand, project_type, is_approved, upload_date 
FROM knowledge_base.cohive.file_metadata 
WHERE brand = 'Nike'  -- Replace with your brand
ORDER BY upload_date DESC;
```

3. **Check volume files:**
```sql
-- List files in the volume
LIST '/Volumes/knowledge_base/cohive/files/brand/nike/';
```

---

### 6. **Processed _txt Files Don't Exist**

**Symptom:** Original files upload successfully but processed `.txt` versions aren't created

**Cause:** Files need to be manually processed after upload.

**Workflow:**
1. Upload files → they appear in "Pending Knowledge Base Files" (yellow section)
2. Select files to process (checkbox)
3. Click "Process Selected" button
4. AI extracts text and creates `_txt.txt` versions
5. Files move to "Pending Approval" (blue section)
6. Approve files to make them available for use

**Note:** Processing requires:
- AI model endpoint configured in Databricks
- Permissions to create new files in the volume
- `pdf-parse`, `mammoth`, and `xlsx` libraries available in the API runtime

**IMPORTANT:** Files must be processed before they can be approved. Attempting to approve an unprocessed file will show an error message directing you to process the file first.

---

### 7. **Cannot Approve Files - "Must be processed" Error**

**Symptom:** When trying to approve files, you get an error: "Cannot approve unprocessed files"

**Cause:** Files haven't been processed yet. The system requires files to be processed (text extracted and summarized) before approval.

**Solution:**
1. Navigate to Knowledge Base → Workspace mode
2. Look for the file in the "Pending Knowledge Base Files" (yellow section)
3. Select the file using the checkbox
4. Click "Process Selected" button
5. Wait for processing to complete
6. File will move to "Pending Approval" section
7. Now you can approve the file

**Visual Indicators:**
- Files with an "Unprocessed" orange badge cannot be approved
- Only files that have been processed can move from "Pending Approval" to "Approved"
- Researchers will see the "Unprocessed" badge in the Research mode file list

---

## Verification Checklist

Before reporting an issue, verify:

- [ ] Mock mode badge is **not** visible (unless intentionally testing in mock mode)
- [ ] All environment variables are set in deployment platform
- [ ] Databricks service principal has necessary permissions
- [ ] Volume `knowledge_base.cohive.files` exists
- [ ] Table `knowledge_base.cohive.file_metadata` exists
- [ ] Upload returns success response with `fileId` and `filePath`
- [ ] Browser console shows no errors during upload
- [ ] Files appear in Databricks when queried directly

---

## Getting Help

If files still don't appear after checking all of the above:

1. **Collect diagnostic information:**
   - Screenshot of upload success message
   - Browser console output during upload
   - Network tab showing upload request/response
   - Result of SQL query: `SELECT COUNT(*) FROM knowledge_base.cohive.file_metadata;`

2. **Check server logs:**
   - Vercel deployment logs
   - Databricks SQL warehouse query history

3. **Common log messages:**
   - ✅ `[Knowledge Base Upload] File uploaded to volume`
   - ✅ `[Knowledge Base Upload] Metadata inserted successfully`
   - ❌ `Access denied (403)` → Permission issue
   - ❌ `Table not found` → Schema/table doesn't exist
   - 🎨 `[Mock Mode] Knowledge Base upload` → Running in mock mode

---

## Recent Changes

**v30 (Current):**
- Added mock mode support to upload and list APIs
- Assessment system now prefers processed `_txt.txt` files for faster, better extraction
- Added "Refresh" button to manually pull latest files from Databricks

**Known Limitations:**
- Mock mode simulates uploads but doesn't persist files
- Processing large files (>50MB) may timeout
- Image extraction from PDFs requires AI model with vision capabilities