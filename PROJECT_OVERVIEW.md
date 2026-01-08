# Project Ivy League - Complete Overview

## 📋 Project Summary
**Project Ivy League** is a comprehensive Ivy League preparation platform designed to help students prepare for admission to top-tier universities. The platform connects students, parents, counselors, and administrators through a sophisticated scoring and evaluation system based on 6 key "pointers" that are critical for Ivy League admissions.

---

## 🏗️ Architecture

### Monorepo Structure
```
/Ivy League
├── /frontend          # Next.js 16.1.1 + TypeScript + TailwindCSS 4
├── /backend           # Node.js + Express + TypeScript + MongoDB
├── README.md
└── package.json
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4 (latest version)
- **UI Library**: React 19.2.3
- **HTTP Client**: Axios 1.13.2
- **Dev Server**: Running on `http://localhost:3000`

#### Backend
- **Runtime**: Node.js with TypeScript 5.9.3
- **Framework**: Express 5.2.1
- **Database**: MongoDB (via Mongoose 9.1.1)
- **File Upload**: Multer 2.0.2
- **Excel Processing**: XLSX 0.18.5
- **CORS**: Enabled for cross-origin requests
- **Dev Server**: Running on `http://localhost:5000`
- **Process Manager**: Nodemon 3.1.11

---

## 👥 User Roles

The platform supports **6 distinct user roles**:

1. **STUDENT** - Primary users being evaluated
2. **PARENT** - Can view their child's progress
3. **COUNSELOR** - Evaluates students and provides guidance
4. **ALUMNI** - (Defined but not yet implemented)
5. **ADMIN** - Manages the platform and assigns services
6. **SERVICE_PROVIDER** - (Defined but not yet implemented)

---

## 🎯 The 6 Ivy Pointers System

The core of the platform is based on **6 critical pointers** for Ivy League admission:

| Pointer # | Name | Description |
|-----------|------|-------------|
| 1 | **Academic Excellence** | GPA, test scores, course rigor |
| 2 | **Spike in One Area** | Deep expertise in a specific field |
| 3 | **Leadership Initiative** | Leadership roles and impact |
| 4 | **Global Social Impact** | Community service and social contributions |
| 5 | **Authentic Storytelling** | Essay writing and personal narrative |
| 6 | **Intellectual Curiosity** | Research, courses, and learning beyond curriculum |

Each pointer has:
- A **title** and **description**
- A **maximum score** (scoring system)
- Associated **activities**, **submissions**, and **evaluations**

---

## 📊 Database Models (MongoDB)

### Core Models

#### 1. **User** (`User.ts`)
```typescript
{
  name: string
  email: string (unique, lowercase)
  password: string
  role: USER_ROLE (enum)
  isVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  passwordResetToken?: string
  passwordResetExpires?: Date
  timestamps: true
}
```

#### 2. **StudentIvyService** (`StudentIvyService.ts`)
Links students with counselors and tracks overall progress.
```typescript
{
  studentId: ObjectId (ref: User, unique)
  counselorId: ObjectId (ref: User)
  status: ServiceStatus (enum)
  overallScore?: number
  studentInterest?: string
  timestamps: true
}
```

#### 3. **IvyPointer** (`IvyPointer.ts`)
Defines the 6 pointers.
```typescript
{
  pointerNo: PointerNo (1-6, unique)
  title: string
  description: string
  maxScore: number
}
```

#### 4. **StudentPointerScore** (`StudentPointerScore.ts`)
Tracks student scores for each pointer.
```typescript
{
  studentId: ObjectId (ref: User)
  pointerNo: PointerNo
  score: number
  evaluatedBy?: ObjectId (ref: User)
  evaluationDate?: Date
  timestamps: true
}
```

### Pointer 5 Models (Authentic Storytelling / Essays)

#### 5. **EssayGuideline** (`EssayGuideline.ts`)
Essay prompts and guidelines provided by counselors.
```typescript
{
  studentId: ObjectId (ref: User)
  counselorId: ObjectId (ref: User)
  title: string
  prompt: string
  guidelines?: string
  wordLimit?: number
  dueDate?: Date
  timestamps: true
}
```

#### 6. **EssaySubmission** (`EssaySubmission.ts`)
Student essay submissions.
```typescript
{
  studentId: ObjectId (ref: User)
  guidelineId: ObjectId (ref: EssayGuideline)
  content: string
  submittedAt: Date
  version: number
  timestamps: true
}
```

#### 7. **EssayEvaluation** (`EssayEvaluation.ts`)
Counselor feedback on essays.
```typescript
{
  submissionId: ObjectId (ref: EssaySubmission)
  counselorId: ObjectId (ref: User)
  score?: number
  feedback: string
  strengths?: string[]
  improvements?: string[]
  evaluatedAt: Date
  timestamps: true
}
```

### Pointer 6 Models (Intellectual Curiosity)

#### 8. **Pointer6CourseList** (`Pointer6CourseList.ts`)
Recommended courses for intellectual development.
```typescript
{
  studentId: ObjectId (ref: User)
  counselorId: ObjectId (ref: User)
  courseName: string
  platform?: string
  link?: string
  description?: string
  estimatedDuration?: string
  priority?: 'High' | 'Medium' | 'Low'
  status?: 'Recommended' | 'In Progress' | 'Completed'
  timestamps: true
}
```

#### 9. **Pointer6Certificate** (`Pointer6Certificate.ts`)
Student-uploaded course completion certificates.
```typescript
{
  studentId: ObjectId (ref: User)
  courseListId?: ObjectId (ref: Pointer6CourseList)
  courseName: string
  platform?: string
  certificateUrl: string
  completionDate?: Date
  uploadedAt: Date
  timestamps: true
}
```

#### 10. **Pointer6Evaluation** (`Pointer6Evaluation.ts`)
Counselor evaluation of intellectual curiosity.
```typescript
{
  studentId: ObjectId (ref: User)
  counselorId: ObjectId (ref: User)
  certificateId?: ObjectId (ref: Pointer6Certificate)
  score?: number
  feedback?: string
  evaluatedAt: Date
  timestamps: true
}
```

### General Activity Models

#### 11. **StudentSubmission** (`StudentSubmission.ts`)
Generic student submissions for any pointer.
```typescript
{
  studentId: ObjectId (ref: User)
  pointerNo: PointerNo
  title: string
  description?: string
  fileUrl?: string
  submittedAt: Date
  timestamps: true
}
```

### Counselor Models

#### 12. **CounselorDocument** (`CounselorDocument.ts`)
Documents shared by counselors with students.
```typescript
{
  counselorId: ObjectId (ref: User)
  studentId: ObjectId (ref: User)
  pointerNo?: PointerNo
  documentType: DocumentType (enum)
  title: string
  description?: string
  fileUrl: string
  uploadedAt: Date
  timestamps: true
}
```

#### 13. **CounselorEvaluation** (`CounselorEvaluation.ts`)
General evaluations by counselors.
```typescript
{
  studentId: ObjectId (ref: User)
  counselorId: ObjectId (ref: User)
  pointerNo: PointerNo
  score?: number
  feedback: string
  evaluatedAt: Date
  timestamps: true
}
```

#### 14. **CounselorSelectedSuggestion** (`CounselorSelectedSuggestion.ts`)
Counselor-selected AI suggestions for students.
```typescript
{
  studentId: ObjectId (ref: User)
  counselorId: ObjectId (ref: User)
  suggestionId: ObjectId (ref: AgentSuggestion)
  selectedAt: Date
  notes?: string
  status?: 'Pending' | 'In Progress' | 'Completed'
  timestamps: true
}
```

### AI-Powered Models

#### 15. **AgentSuggestion** (`AgentSuggestion.ts`)
AI-generated suggestions for student improvement.
```typescript
{
  studentId: ObjectId (ref: User)
  pointerNo: PointerNo
  suggestionText: string
  priority?: 'High' | 'Medium' | 'Low'
  generatedAt: Date
  isSelected?: boolean
  timestamps: true
}
```

#### 16. **StudentIvyScoreCard** (`StudentIvyScoreCard.ts`)
Overall scorecard for students.
```typescript
{
  studentId: ObjectId (ref: User)
  pointer1Score?: number
  pointer2Score?: number
  pointer3Score?: number
  pointer4Score?: number
  pointer5Score?: number
  pointer6Score?: number
  totalScore?: number
  lastUpdated: Date
  timestamps: true
}
```

---

## 🛣️ API Routes

### Backend API Structure (`/backend/src/routes`)

All routes are prefixed with `/api/`

| Route | Prefix | Purpose |
|-------|--------|---------|
| `ivyService.routes.ts` | `/api/ivy-service` | Manage student-counselor service assignments |
| `user.routes.ts` | `/api/users` | User management |
| `excelUpload.routes.ts` | `/api/excel-upload` | Bulk data upload via Excel |
| `studentInterest.routes.ts` | `/api/student-interest` | Student interest tracking |
| `agentSuggestion.routes.ts` | `/api/agent-suggestions` | AI-generated suggestions |
| `pointer5.routes.ts` | `/api/pointer5` | Essay management (Pointer 5) |
| `pointer6.routes.ts` | `/api/pointer6` | Intellectual curiosity (Pointer 6) |
| `pointerActivity.routes.ts` | `/api/pointer/activity` | General pointer activities |

### Controllers (`/backend/src/controllers`)

Each route has a corresponding controller:
- `ivyService.controller.ts`
- `user.controller.ts`
- `excelUpload.controller.ts`
- `studentInterest.controller.ts`
- `agentSuggestion.controller.ts`
- `pointer5.controller.ts` (6,642 bytes - complex logic)
- `pointer6.controller.ts` (5,231 bytes)
- `pointerActivity.controller.ts` (5,583 bytes)

### Services (`/backend/src/services`)

Business logic layer:
- `ivyService.service.ts`
- `user.service.ts`
- `excelParser.service.ts` (9,397 bytes - Excel parsing logic)
- `studentInterest.service.ts`
- `agentSuggestion.service.ts` (9,521 bytes - AI suggestion logic)
- `pointer5.service.ts` (10,593 bytes - Essay service)
- `pointer6.service.ts` (8,762 bytes)
- `pointerActivity.service.ts` (11,293 bytes - largest service)

---

## 🎨 Frontend Structure

### App Router Pages (`/frontend/src/app`)

#### Root Pages
- `page.tsx` - Landing page
- `layout.tsx` - Root layout with Geist fonts
- `globals.css` - Global styles with TailwindCSS 4

#### Admin Pages (`/admin`)
- `assign-ivy-service/page.tsx` - Assign counselors to students
- `upload-excel/page.tsx` - Bulk upload functionality

#### Counselor Pages (`/counselor`)
- `pointer5/page.tsx` - Essay management
- `pointer6/page.tsx` - Intellectual curiosity tracking
- `agent-suggestions/page.tsx` - View/manage AI suggestions
- `student-interest/page.tsx` - View student interests
- `pointer-activities/page.tsx` - General activities

#### Student Pages (`/student`)
- `pointer5/page.tsx` - Submit essays
- `pointer6/page.tsx` - Upload certificates
- `pointer-activities/page.tsx` - View/submit activities

#### Parent Pages (`/parent`)
- `pointer5/page.tsx` - View child's essay progress
- `pointer6/page.tsx` - View child's courses
- `pointer-activities/page.tsx` - View child's activities

---

## 🔧 Configuration Files

### Backend (`/backend`)
- **TypeScript Config**: ES2020 target, CommonJS modules, strict mode
- **Nodemon**: Auto-restart on file changes
- **Environment**: `.env` file (gitignored) contains:
  - `MONGO_URI` - MongoDB connection string
  - `PORT` - Server port (default: 5000)

### Frontend (`/frontend`)
- **TypeScript Config**: ES2017 target, ESNext modules, React JSX
- **Next.js Config**: `next.config.ts`
- **TailwindCSS**: v4 with PostCSS
- **Path Aliases**: `@/*` → `./src/*`

---

## 📁 File Upload System

### Backend Upload Handling
- **Library**: Multer 2.0.2
- **Upload Directory**: `/backend/uploads`
- **Static Serving**: Files served at `/uploads/*`
- **Supported Files**: 
  - Documents (PDFs, Word docs)
  - Certificates (images, PDFs)
  - Excel files for bulk import

### Upload Subdirectories
The `/backend/uploads` folder contains 2 subdirectories (specific structure not detailed).

---

## 🔐 Authentication & Security

### User Authentication
- Email/password based authentication
- Email verification system with tokens
- Password reset functionality with expiry
- Role-based access control (RBAC)

### Security Features
- CORS enabled
- Password hashing (implementation in controllers)
- Token-based verification
- Unique email constraint

---

## 📈 Key Features

### 1. **Student Evaluation System**
- 6-pointer scoring framework
- Individual pointer scores
- Overall scorecard generation
- Progress tracking over time

### 2. **Essay Management (Pointer 5)**
- Counselor creates essay guidelines
- Students submit essays (multiple versions)
- Counselor provides detailed feedback
- Scoring with strengths/improvements

### 3. **Intellectual Curiosity Tracking (Pointer 6)**
- Counselor recommends courses
- Students upload completion certificates
- Evaluation and scoring system
- Platform tracking (Coursera, edX, etc.)

### 4. **AI-Powered Suggestions**
- Automated suggestion generation per pointer
- Priority-based recommendations
- Counselor selection and assignment
- Status tracking (Pending → In Progress → Completed)

### 5. **Document Management**
- Counselor document uploads
- Student submission tracking
- File URL storage
- Document type categorization

### 6. **Excel Import/Export**
- Bulk user import
- Data parsing service
- Excel file processing

### 7. **Multi-Role Dashboard**
- Role-specific views (Admin, Counselor, Student, Parent)
- Customized navigation per role
- Activity tracking

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v20+)
- MongoDB instance (local or Atlas)
- npm or yarn

### Development Servers

#### Backend
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Build Commands

#### Backend
```bash
npm run build  # Compiles TypeScript to /dist
npm start      # Runs compiled code
```

#### Frontend
```bash
npm run build  # Creates production build
npm start      # Runs production server
```

### Database Seeding
```bash
cd backend
npm run seed  # Runs /src/scripts/seedUsers.ts
```

---

## 📊 Current Status

### Active Services
✅ Both frontend and backend dev servers are running
✅ Frontend: `http://localhost:3000` (running for 4m12s)
✅ Backend: `http://localhost:5000` (running for 4m8s)

### Implemented Features
- ✅ User management system
- ✅ Role-based routing
- ✅ Pointer 5 (Essay) system
- ✅ Pointer 6 (Intellectual Curiosity) system
- ✅ AI suggestion engine
- ✅ File upload system
- ✅ Excel import functionality
- ✅ Student-Counselor assignment
- ✅ Evaluation and scoring system

### Pending/Incomplete Features
- ⏳ Alumni role implementation
- ⏳ Service Provider role implementation
- ⏳ Pointers 1-4 detailed implementation
- ⏳ Authentication UI (login/signup pages)
- ⏳ Dashboard analytics
- ⏳ Real-time notifications

---

## 🗂️ Type Definitions

### Custom Types (`/backend/src/types`)

#### ServiceStatus
```typescript
enum ServiceStatus {
  Active = "Active"
  Inactive = "Inactive"
  Completed = "Completed"
}
```

#### DocumentType
```typescript
enum DocumentType {
  // Specific types defined in DocumentType.ts
}
```

#### PointerNo
```typescript
enum PointerNo {
  AcademicExcellence = 1
  SpikeInOneArea = 2
  LeadershipInitiative = 3
  GlobalSocialImpact = 4
  AuthenticStorytelling = 5
  IntellectualCuriosity = 6
}
```

---

## 📝 Development Notes

### Code Quality
- **TypeScript**: Strict mode enabled on both frontend and backend
- **Linting**: ESLint configured for Next.js
- **Type Safety**: Mongoose schemas with TypeScript interfaces
- **Error Handling**: Try-catch blocks in server startup

### Database Connection
- Connection timeout: 5 seconds
- Socket timeout: 45 seconds
- Automatic reconnection handling
- Environment variable validation

### File Organization
- **Backend**: MVC-like pattern (Models, Controllers, Services, Routes)
- **Frontend**: Next.js App Router with role-based folders
- **Shared Types**: Enums and interfaces for type safety

---

## 🎯 Next Steps / Recommendations

1. **Authentication Implementation**
   - Add login/signup pages
   - Implement JWT tokens
   - Add protected routes

2. **Complete Pointer 1-4**
   - Create models for remaining pointers
   - Build UI for each pointer
   - Implement evaluation logic

3. **Dashboard Development**
   - Student dashboard with scorecard
   - Counselor dashboard with student list
   - Admin analytics dashboard

4. **Real-time Features**
   - WebSocket integration for notifications
   - Live score updates
   - Chat between student and counselor

5. **Testing**
   - Unit tests for services
   - Integration tests for API routes
   - E2E tests for critical flows

6. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Component documentation (Storybook)
   - User guides

---

## 📞 Support & Maintenance

### Scripts Available

**Backend:**
- `npm run dev` - Development mode with nodemon
- `npm run build` - Compile TypeScript
- `npm start` - Run production build
- `npm run seed` - Seed database with users

**Frontend:**
- `npm run dev` - Development mode
- `npm run build` - Production build
- `npm start` - Run production server
- `npm run lint` - Run ESLint

---

## 🏆 Project Highlights

1. **Scalable Architecture**: Clean separation of concerns with MVC pattern
2. **Type Safety**: Full TypeScript implementation across stack
3. **Modern Stack**: Latest versions of Next.js, React, and Node.js
4. **Role-Based System**: Comprehensive RBAC implementation
5. **AI Integration**: Automated suggestion system for student improvement
6. **Document Management**: Robust file upload and storage system
7. **Evaluation Framework**: Structured 6-pointer assessment system

---

**Last Updated**: January 8, 2026
**Project Status**: Active Development
**Team**: Kareer Studio - Brainography Division
