# File Upload Implementation for WickedCRM

## Overview
This document describes the complete file upload functionality implemented for WickedCRM, including frontend components, backend API, and usage examples.

## Frontend Components

### FileUpload Component
**Location:** `/Users/wyattcole/Downloads/WickedCRM/workspace/shadcn-ui/src/components/ui/file-upload.tsx`

A fully-featured drag-and-drop file upload component with the following capabilities:

#### Features
- Drag and drop file support
- Click to browse files
- File type validation
- File size validation (default: 10MB max)
- Multiple file uploads (configurable)
- Image preview thumbnails
- Upload progress indication
- File list with remove functionality
- Auto-upload on file selection (optional)
- Comprehensive error handling

#### Supported File Types
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Text: TXT, CSV
- Videos: MP4, WebM, QuickTime
- Audio: MP3, WAV, OGG, WebM

#### Props
```typescript
interface FileUploadProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}
```

#### Basic Usage
```tsx
import { FileUpload } from "@/components/ui/file-upload";
import { uploadsApi } from "@/lib/api/uploads";

function MyComponent() {
  const [files, setFiles] = useState([]);

  const handleUpload = async (filesToUpload) => {
    const results = await Promise.all(
      filesToUpload.map((file) => uploadsApi.upload(file, "profile"))
    );
    return results;
  };

  return (
    <FileUpload
      value={files}
      onChange={setFiles}
      onUpload={handleUpload}
      accept="image/jpeg,image/png,application/pdf"
      maxSize={10 * 1024 * 1024}
      maxFiles={5}
      multiple={true}
    />
  );
}
```

### FileUploadDemo Component
**Location:** `/Users/wyattcole/Downloads/WickedCRM/workspace/shadcn-ui/src/components/FileUploadDemo.tsx`

A complete working example demonstrating:
- File upload with progress
- Listing uploaded files
- Viewing uploaded files
- Deleting uploaded files
- Error handling with toast notifications

## Backend API

### Uploads Router
**Location:** `root@rent.fanz.website:/var/www/crm-escort-ai/backend/app/routers/uploads.py`

#### Endpoints

##### 1. Upload File
```
POST /api/uploads
```

**Request:**
- Content-Type: multipart/form-data
- Body:
  - `file`: File (required)
  - `purpose`: string (optional) - e.g., "profile", "attachment", "document"

**Response:**
```json
{
  "id": "uuid",
  "filename": "stored-filename.ext",
  "original_filename": "original-name.ext",
  "content_type": "image/jpeg",
  "size": 1234567,
  "url": "/api/uploads/{id}",
  "created_at": "2025-12-20T00:00:00Z"
}
```

**Validation:**
- Maximum file size: 10MB
- Allowed content types:
  - Images: image/jpeg, image/png, image/gif, image/webp
  - Videos: video/mp4, video/webm, video/quicktime
  - Audio: audio/mpeg, audio/wav, audio/ogg, audio/webm
  - Documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - Text: text/plain, text/csv

##### 2. Get File
```
GET /api/uploads/{file_id}
```

**Response:**
- Returns the file with appropriate Content-Type header
- Sets Content-Disposition for download

##### 3. List Files
```
GET /api/uploads
```

**Query Parameters:**
- `limit`: number (default: 50) - Max results to return
- `skip`: number (default: 0) - Results to skip
- `purpose`: string (optional) - Filter by purpose

**Response:**
```json
[
  {
    "id": "uuid",
    "filename": "stored-filename.ext",
    "original_filename": "original-name.ext",
    "content_type": "image/jpeg",
    "size": 1234567,
    "url": "/api/uploads/{id}",
    "purpose": "profile",
    "created_at": "2025-12-20T00:00:00Z"
  }
]
```

##### 4. Delete File
```
DELETE /api/uploads/{file_id}
```

**Response:**
- Status: 204 No Content
- Deletes file from both database and disk

### Database Schema
```sql
Table "public.uploads"
      Column       |           Type
-------------------+--------------------------
 id                | uuid (PRIMARY KEY)
 user_id           | uuid (NOT NULL)
 filename          | varchar(255) (NOT NULL)
 original_filename | varchar(255) (NOT NULL)
 content_type      | varchar(100) (NOT NULL)
 size              | integer (NOT NULL)
 purpose           | varchar(50)
 created_at        | timestamp with time zone

Indexes:
  - uploads_pkey (PRIMARY KEY)
  - idx_uploads_user_id
  - idx_uploads_purpose
```

## File Storage

### Configuration
**Storage Location:** `/var/www/crm-escort-ai/uploads/`

Files are stored with UUID-based filenames to prevent conflicts:
- Original: `vacation-photo.jpg`
- Stored as: `{uuid}.jpg`

**Permissions:** 777 (configurable based on security requirements)

### Future Enhancements
The current implementation uses local file storage. For production scalability, consider:
- Amazon S3 integration
- Google Cloud Storage
- Azure Blob Storage
- CDN integration for faster file delivery

## API Client

### Uploads API Client
**Location:** `/Users/wyattcole/Downloads/WickedCRM/workspace/shadcn-ui/src/lib/api/uploads.ts`

```typescript
import { uploadsApi } from "@/lib/api/uploads";

// Upload a file
const result = await uploadsApi.upload(file, "profile");

// List files
const files = await uploadsApi.list({
  limit: 50,
  skip: 0,
  purpose: "profile"
});

// Get file URL
const url = uploadsApi.getFileUrl(fileId);

// Delete file
await uploadsApi.delete(fileId);
```

## Environment Configuration

### Frontend (.env)
```env
VITE_API_BASE_URL=https://rent.fanz.website
```

### Backend (.env)
```env
DB_URL=postgresql://postgres:FanzSecure2025db@127.0.0.1:5432/fanz_core
```

## Server Configuration

### PM2 Configuration
```javascript
// /var/www/crm-escort-ai/ecosystem.config.cjs
{
  name: 'crm-escort-ai',
  cwd: '/var/www/crm-escort-ai/backend',
  script: 'venv/bin/uvicorn',
  args: 'app.main:app --host 0.0.0.0 --port 8500',
}
```

### NGINX Configuration
Ensure NGINX is configured to proxy requests to the backend:
```nginx
location /api/uploads {
    proxy_pass http://localhost:8500;
    client_max_body_size 10M;
}
```

## Security Considerations

1. **File Type Validation**
   - Server-side validation of file MIME types
   - Extension whitelist enforcement

2. **File Size Limits**
   - Frontend validation: Immediate feedback
   - Backend validation: Security enforcement
   - NGINX: `client_max_body_size` directive

3. **Access Control**
   - Authentication required (JWT token)
   - Users can only access/delete their own files
   - File URLs are not publicly guessable (UUIDs)

4. **Storage Security**
   - Files stored outside web root
   - Served through API endpoint (not direct access)
   - Virus scanning (recommended for production)

## Usage Examples

### Profile Photo Upload
```tsx
import { FileUpload } from "@/components/ui/file-upload";
import { uploadsApi } from "@/lib/api/uploads";

function ProfilePhotoUpload() {
  const handleUpload = async (files) => {
    const result = await uploadsApi.upload(files[0], "profile_photo");
    // Update user profile with result.url
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept="image/jpeg,image/png"
      maxSize={5 * 1024 * 1024}
      maxFiles={1}
      multiple={false}
    />
  );
}
```

### SMS Attachments
```tsx
function SMSAttachmentUpload() {
  const handleUpload = async (files) => {
    const results = await Promise.all(
      files.map(f => uploadsApi.upload(f, "sms_attachment"))
    );
    // Attach results to SMS message
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept="image/*,application/pdf"
      maxFiles={3}
    />
  );
}
```

### Document Upload
```tsx
function DocumentUpload() {
  const handleUpload = async (files) => {
    const results = await Promise.all(
      files.map(f => uploadsApi.upload(f, "document"))
    );
    // Store document references
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      accept="application/pdf,.doc,.docx"
      maxSize={20 * 1024 * 1024}
    />
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Upload Fails with 413 Error
- Increase `client_max_body_size` in NGINX
- Verify backend `MAX_FILE_SIZE` setting

#### 2. CORS Errors
- Check CORS configuration in backend `main.py`
- Verify `ALLOWED_ORIGINS` environment variable

#### 3. Files Not Found After Upload
- Verify upload directory exists and has write permissions
- Check database connection and uploads table

#### 4. Authentication Errors
- Ensure JWT token is being sent in requests
- Verify token is valid and not expired

## Maintenance

### Disk Space Management
Monitor the uploads directory:
```bash
du -sh /var/www/crm-escort-ai/uploads/
```

### Cleanup Old Files
Create a cron job to remove old/unused files:
```sql
DELETE FROM uploads
WHERE created_at < NOW() - INTERVAL '90 days'
AND purpose = 'temporary';
```

### Backup Strategy
Include uploads directory in backup routine:
```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/crm-escort-ai/uploads/
```

## Testing

### Manual Testing
1. Visit the FileUploadDemo component
2. Try uploading various file types
3. Verify preview, progress, and error handling
4. Test delete functionality
5. Check file persistence after page reload

### API Testing
```bash
# Upload file
curl -X POST https://rent.fanz.website/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  -F "purpose=test"

# List files
curl https://rent.fanz.website/api/uploads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete file
curl -X DELETE https://rent.fanz.website/api/uploads/{file_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Improvements

1. **Progress Tracking**
   - Real-time upload progress bar
   - WebSocket support for large files

2. **Image Processing**
   - Automatic thumbnail generation
   - Image optimization/compression
   - Format conversion

3. **Advanced Features**
   - Resumable uploads for large files
   - Direct-to-S3 uploads (client-side)
   - File sharing with expiring links
   - Bulk upload operations

4. **Analytics**
   - Track upload statistics
   - Monitor storage usage per user
   - File type distribution

## Support

For issues or questions:
- Check backend logs: `ssh root@rent.fanz.website "pm2 logs crm-escort-ai"`
- Review NGINX logs: `/var/log/nginx/error.log`
- Database queries: Connect to PostgreSQL and inspect uploads table

## Changelog

### Version 1.0.0 (2025-12-20)
- Initial implementation
- Frontend FileUpload component
- Backend uploads router with full CRUD operations
- Support for images, documents, audio, and video
- Local file storage
- User authentication and authorization
- Example components and documentation
