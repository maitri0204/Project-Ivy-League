# Superadmin Activity Management System

## Overview
This system allows superadmins to create and manage activities for Pointers 2, 3, and 4. Students and counselors can view the activity documents but cannot download or copy them.

## Features Implemented

### 1. Backend Components

#### Role System
- **File**: `/backend/src/types/roles.ts`
- Added `SUPERADMIN` role to the `USER_ROLE` enum

#### Activity Model
- **File**: `/backend/src/models/ivy/Activity.ts`
- **Fields**:
  - `name`: Activity name (required, string)
  - `pointerNo`: Pointer number (required, must be 2, 3, or 4)
  - `documentUrl`: URL path to the uploaded Word document
  - `documentName`: Original filename of the document
  - `createdAt` & `updatedAt`: Auto-managed timestamps

#### Activity Controller
- **File**: `/backend/src/controllers/activity.controller.ts`
- **Endpoints**:
  - `POST /api/activities` - Create new activity with Word document upload
  - `GET /api/activities` - Get all activities (optional filter by pointerNo)
  - `GET /api/activities/:id` - Get single activity by ID
  - `DELETE /api/activities/:id` - Delete activity and its document file

- **Features**:
  - File validation: Only accepts `.doc` and `.docx` files
  - File size limit: 10MB
  - Automatic filename sanitization (replaces special characters with underscores)
  - Files saved to `/uploads/activities/`

#### Activity Routes
- **File**: `/backend/src/routes/activity.routes.ts`
- Configured routes for all CRUD operations
- Integrated with server.ts at `/api/activities`

### 2. Frontend Components

#### Superadmin Page
- **File**: `/frontend/src/app/superadmin/page.tsx`
- **Features**:
  - Form to create new activities
  - Activity name input
  - Pointer dropdown (2, 3, or 4)
  - File upload (Word documents only)
  - List of all existing activities
  - Delete button for each activity
  - Success/error messaging
  - Validation for required fields

#### Document Viewer Component
- **File**: `/frontend/src/components/DocumentViewer.tsx`
- **Features**:
  - Full-screen modal view
  - Uses Microsoft Office Online Viewer for Word documents
  - **Protection Features**:
    - Prevents right-click context menu
    - Blocks keyboard shortcuts (Ctrl+C, Ctrl+S, Ctrl+P, Ctrl+A, Ctrl+X)
    - Disables text selection (CSS user-select: none)
    - Sandbox iframe restrictions
    - Warning message about view-only access
  - Close button to exit viewer

#### Activity Selector Component
- **File**: `/frontend/src/components/ActivitySelector.tsx`
- **Features**:
  - Automatically fetches activities for specific pointer
  - Displays list of available activities
  - Click to open document in protected viewer
  - Shows activity name and document name
  - Auto-hides if no activities available for that pointer

### 3. Integration

#### Student Pointer Activities Page
- **File**: `/frontend/src/app/student/pointer-activities/page.tsx`
- Added ActivitySelector components for Pointers 2, 3, and 4
- Students can view activity documents alongside their assigned tasks

#### Counselor Pointer Activities Page
- **File**: `/frontend/src/app/counselor/pointer-activities/page.tsx`
- Added ActivitySelector components for Pointers 2, 3, and 4
- Counselors can view activity documents when managing student activities

## Usage Instructions

### For Superadmins

1. Navigate to `/superadmin` page
2. Fill in the activity creation form:
   - Enter activity name
   - Select pointer (2, 3, or 4)
   - Upload a Word document (.doc or .docx)
3. Click "Create Activity"
4. Activity will appear in the list below
5. To delete: Click "Delete" button on any activity

### For Students and Counselors

1. Navigate to pointer activities page
2. Look for "Available Activities" section
3. Click on any activity to view the document
4. Document opens in a protected viewer
5. Click the "×" button to close the viewer

## Security Features

### Document Protection
- Documents are displayed using Microsoft Office Online Viewer
- Right-click is disabled
- Text selection is blocked
- Copy/paste keyboard shortcuts are prevented
- Print shortcuts are blocked
- Iframe sandboxing restricts functionality

### File Upload Security
- Only Word documents (.doc, .docx) are accepted
- File size limited to 10MB
- Filenames are sanitized to prevent injection attacks
- Files stored in dedicated directory with timestamp prefixes

## API Endpoints

### Create Activity
```
POST /api/activities
Content-Type: multipart/form-data

Body:
- name: string (required)
- pointerNo: number (required, 2/3/4)
- document: file (required, .doc/.docx)

Response:
{
  "success": true,
  "message": "Activity created successfully",
  "data": { ... activity object ... }
}
```

### Get Activities
```
GET /api/activities?pointerNo=2

Response:
{
  "success": true,
  "data": [ ... array of activities ... ]
}
```

### Get Activity by ID
```
GET /api/activities/:id

Response:
{
  "success": true,
  "data": { ... activity object ... }
}
```

### Delete Activity
```
DELETE /api/activities/:id

Response:
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

## File Structure

```
backend/
├── src/
│   ├── types/
│   │   └── roles.ts (SUPERADMIN role)
│   ├── models/
│   │   └── ivy/
│   │       └── Activity.ts
│   ├── controllers/
│   │   └── activity.controller.ts
│   ├── routes/
│   │   └── activity.routes.ts
│   └── server.ts (route integration)
├── uploads/
│   └── activities/ (document storage)

frontend/
├── src/
│   ├── app/
│   │   ├── superadmin/
│   │   │   └── page.tsx
│   │   ├── student/
│   │   │   └── pointer-activities/
│   │   │       └── page.tsx (updated)
│   │   └── counselor/
│   │       └── pointer-activities/
│   │           └── page.tsx (updated)
│   └── components/
│       ├── ActivitySelector.tsx
│       └── DocumentViewer.tsx
```

## Future Enhancements

Potential improvements:
- Add activity editing capability
- Add activity visibility toggle (show/hide from students)
- Add activity categories or tags
- Support for multiple document formats
- Activity usage analytics
- Activity assignment to specific students
- Activity completion tracking
- Batch upload of activities
- Activity templates
