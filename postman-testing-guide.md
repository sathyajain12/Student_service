# Postman Testing Guide for Student Service APIs

## Quick Start

Want to start testing immediately? Follow these steps:

1. **Start your backend server:**
   ```bash
   cd backend
   npx wrangler dev
   ```
   Your API will be available at `http://localhost:8787`

2. **Install Postman** (if you haven't already):
   - Download from [postman.com/downloads](https://www.postman.com/downloads)
   - Or use the web version at [web.postman.co](https://web.postman.co)

3. **Create your first request:**
   - Open Postman
   - Click "New" → "HTTP Request"
   - Set method to `GET`
   - Enter URL: `http://localhost:8787/admin/stats`
   - Click "Send"

Now let's dive into the details!

---

## Table of Contents

1. [What is Postman?](#what-is-postman)
2. [Installation & Setup](#installation--setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing Public Endpoints](#testing-public-endpoints)
5. [Testing Admin Endpoints](#testing-admin-endpoints)
6. [Advanced Features](#advanced-features)
7. [Common Testing Workflows](#common-testing-workflows)
8. [Troubleshooting](#troubleshooting)

---

## What is Postman?

**Postman** is a popular API testing tool that allows you to:
- Send HTTP requests (GET, POST, PUT, DELETE, etc.)
- Test API endpoints without writing code
- Inspect request/response data
- Save and organize requests into collections
- Share API tests with your team
- Automate testing with scripts

**Why use it for this project?**
- Test your backend APIs before frontend integration
- Debug issues by seeing exact request/response data
- Validate file uploads and downloads
- Test authentication flows
- Ensure APIs work correctly in isolation

---

## Installation & Setup

### Option 1: Desktop App (Recommended)

1. Go to [postman.com/downloads](https://www.postman.com/downloads)
2. Download the installer for your OS (Windows/Mac/Linux)
3. Run the installer
4. Create a free account (optional but recommended for saving work)

### Option 2: Web Version

1. Go to [web.postman.co](https://web.postman.co)
2. Sign up for a free account
3. Start using Postman in your browser

### Postman Interface Overview

When you open Postman, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  [Collections] [Environments] [History]                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  New Request:                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [GET ▼] [http://localhost:8787/...        ] [Send] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Tabs: [Params] [Authorization] [Headers] [Body] [Scripts]  │
│                                                               │
│  Response:                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Status: 200 OK    Time: 45ms    Size: 1.2KB         │    │
│  │                                                       │    │
│  │ {                                                     │    │
│  │   "success": true                                     │    │
│  │ }                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Method dropdown**: Select HTTP method (GET, POST, etc.)
- **URL bar**: Enter the endpoint URL
- **Send button**: Execute the request
- **Tabs**: Configure request parameters, headers, body, etc.
- **Response section**: View the API response

---

## Environment Configuration

### What are Environments?

Environments let you save variables (like `BASE_URL` or `ADMIN_TOKEN`) that you can reuse across requests. This is useful for switching between local development and production.

### Creating an Environment

1. Click the **Environments** icon in the left sidebar (looks like a gear)
2. Click **"Create Environment"** or the **"+"** button
3. Name it: `Student Service - Local`
4. Add these variables:

| Variable Name | Type | Initial Value | Current Value |
|--------------|------|---------------|---------------|
| `BASE_URL` | default | `http://localhost:8787` | `http://localhost:8787` |
| `ADMIN_TOKEN` | secret | (leave empty) | (leave empty) |

5. Click **Save**

### Using Environment Variables

In your requests, use variables with double curly braces:
- URL: `{{BASE_URL}}/status?id=DGC123`
- Header: `Authorization: Bearer {{ADMIN_TOKEN}}`

### Switching Environments

Use the environment dropdown in the top-right corner to switch between environments (e.g., Local vs Production).

---

## Testing Public Endpoints

These endpoints don't require authentication and can be accessed by anyone.

### 1. POST /submit - Submit Application Form

**Purpose:** Submit a new student application form

#### Basic Setup

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/submit`
- **Body Type:** `form-data` (important for file uploads!)

#### Steps to Test

1. Create a new request in Postman
2. Set method to `POST`
3. Enter URL: `{{BASE_URL}}/submit`
4. Go to **Body** tab
5. Select **form-data** radio button
6. Add the following fields (key-value pairs):

#### Example 1: Duplicate Grade Card Application

**Required Fields:**

| Key | Value | Type |
|-----|-------|------|
| `formId` | `DGC123` | Text |
| `formType` | `Application for Duplicate Grade Card` | Text |
| `email` | `student@sssihl.edu.in` | Text |
| `applicantName` | `John Doe` | Text |
| `regNo` | `2021001` | Text |
| `campus` | `Prashanti Nilayam Campus` | Text |
| `mobile` | `9876543210` | Text |
| `program` | `B.Tech Computer Science` | Text |
| `periodOfStudy` | `2021-2025` | Text |
| `semester` | `5` | Text |
| `reason` | `Lost during relocation` | Text |
| `addressLine1` | `123 Main Street` | Text |
| `addressLine2` | `Apartment 4B` | Text |
| `country` | `India` | Text |
| `stateProvince` | `Andhra Pradesh` | Text |
| `city` | `Puttaparthi` | Text |
| `postalCode` | `515134` | Text |

**File Uploads:**

| Key | Value | Type |
|-----|-------|------|
| `policeComplaint` | (Select a PDF file) | File |
| `affidavit` | (Select a PDF file) | File |
| `sbiReceipt` | (Select a PDF file) | File |
| `gradeCard` | (Select a PDF file) | File (optional) |

**How to attach files:**
1. In the Key column, type the field name (e.g., `policeComplaint`)
2. Hover over the right side of the Value column
3. Change the dropdown from "Text" to "File"
4. Click "Select Files" and choose your PDF

**Expected Response:**
```json
{
  "success": true,
  "appId": "DGC2502091234567"
}
```

**Response Explanation:**
- `success`: Indicates the form was submitted successfully
- `appId`: Unique application ID (format: PREFIX + YYMMDD + timestamp)

#### Example 2: CGPA to Marks Conversion

**Required Fields:**

| Key | Value |
|-----|-------|
| `formId` | `CGPA456` |
| `formType` | `Application for CGPA to Marks Conversion` |
| `email` | `student@sssihl.edu.in` |
| `applicantName` | `Jane Smith` |
| `regNo` | `2020002` |
| `campus` | `Anantapur Campus` |
| `mobile` | `9876543211` |
| `program` | `M.Sc Mathematics` |
| `periodOfStudy` | `2020-2022` |
| `monthOfPassing` | `May 2022` |
| `cgpa` | `8.5` |
| `cgpaMarksEquivalence` | `75%` |
| `addressLine1` | `456 College Road` |
| `country` | `India` |
| `stateProvince` | `Andhra Pradesh` |
| `city` | `Anantapur` |
| `postalCode` | `515001` |

**No file uploads required for this form type**

**Expected Response:**
```json
{
  "success": true,
  "appId": "CGPA2502091234567"
}
```

#### Example 3: Supplementary Examinations

**Required Fields:**

| Key | Value |
|-----|-------|
| `formId` | `SE789` |
| `formType` | `Application for End-Semester Supplementary Examinations` |
| `email` | `student@sssihl.edu.in` |
| `applicantName` | `Mike Johnson` |
| `regNo` | `2021003` |
| `campus` | `Brindavan Campus` |
| `mobile` | `9876543212` |
| `program` | `B.A. English` |
| `periodOfStudy` | `2021-2024` |
| `paperDetails` | `[{"paperCode":"ENG301","paperTitle":"Shakespeare Studies","semester":"5"},{"paperCode":"ENG302","paperTitle":"Modern Poetry","semester":"5"}]` |
| `addressLine1` | `789 Campus Lane` |
| `country` | `India` |
| `stateProvince` | `Karnataka` |
| `city` | `Bangalore` |
| `postalCode` | `560001` |

**Important:** `paperDetails` must be a valid JSON array of objects

**Expected Response:**
```json
{
  "success": true,
  "appId": "SE2502091234567"
}
```

#### All 9 Form Types

Here are the `formType` values you can use:

1. `Application for Duplicate Grade Card` (Prefix: DGC)
2. `Application for CGPA to Marks Conversion` (Prefix: CGPA)
3. `Application for End-Semester Supplementary Examinations` (Prefix: SE)
4. `Application for Duplicate Degree Certificate` (Prefix: DD)
5. `Application for Registration of Student Name change in the Institute Records` (Prefix: NC)
6. `Application for repeating a paper for supplementary examinations(CIE and ESE)` (Prefix: RP)
7. `Application for Re-Totalling of Marks` (Prefix: RT)
8. `Application for On-Request Degree Certificate` (Prefix: ORD)
9. `Application for Migration Certificate` (Prefix: MC)

#### Common Errors

**Error Response:**
```json
{
  "error": "Missing required fields"
}
```

**Causes:**
- Missing required form fields
- Invalid email format
- Missing file uploads (for forms that require them)
- Invalid `formType` value

---

### 2. GET /status - Check Application Status

**Purpose:** Check the status of a submitted application

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/status?id={applicationId}`

#### Steps to Test

1. Create a new request
2. Set method to `GET`
3. Enter URL: `{{BASE_URL}}/status?id=DGC2502091234567`
   - Replace `DGC2502091234567` with an actual application ID from a previous submission

**Alternatively, use Query Params tab:**
- Click **Params** tab
- Add query parameter:
  - Key: `id`
  - Value: `DGC2502091234567`

#### Expected Response

**Success:**
```json
{
  "id": "DGC2502091234567",
  "student_email": "student@sssihl.edu.in",
  "form_type": "Application for Duplicate Grade Card",
  "applicant_name": "John Doe",
  "reg_no": "2021001",
  "campus": "Prashanti Nilayam Campus",
  "status": "PENDING",
  "director_status": "PENDING",
  "controller_status": "PENDING",
  "created_at": "2025-02-09T10:30:00.000Z",
  "updated_at": "2025-02-09T10:30:00.000Z",
  "responseDocuments": []
}
```

**Response with Files:**
```json
{
  "id": "DGC2502091234567",
  "student_email": "student@sssihl.edu.in",
  "form_type": "Application for Duplicate Grade Card",
  "applicant_name": "John Doe",
  "reg_no": "2021001",
  "campus": "Prashanti Nilayam Campus",
  "status": "COMPLETED",
  "director_status": "APPROVED",
  "controller_status": "APPROVED",
  "created_at": "2025-02-09T10:30:00.000Z",
  "updated_at": "2025-02-09T12:45:00.000Z",
  "responseDocuments": [
    {
      "id": "file123abc",
      "file_name": "duplicate_grade_card.pdf",
      "file_type": "application/pdf",
      "file_size": 204800,
      "created_at": "2025-02-09T12:00:00.000Z"
    }
  ]
}
```

**Status Values Explained:**
- `PENDING`: Application submitted, awaiting approval
- `APPROVED`: Director approved, awaiting Controller
- `COMPLETED`: Fully approved and processed
- `REJECTED`: Application rejected

**Error Response:**
```json
{
  "error": "Application not found"
}
```

---

### 3. GET /download/{fileId} - Download Response Document

**Purpose:** Download a response document attached to your application

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/download/{fileId}?appId={applicationId}`

#### Steps to Test

1. First, get the `fileId` from the `/status` endpoint (see above)
2. Create a new request
3. Set method to `GET`
4. Enter URL: `{{BASE_URL}}/download/file123abc?appId=DGC2502091234567`
   - Replace `file123abc` with actual file ID
   - Replace `DGC2502091234567` with actual application ID

#### Expected Response

**Success:**
- Response will be a binary PDF file
- In Postman, you'll see:
  - Status: `200 OK`
  - Headers: `Content-Type: application/pdf`
  - Body: Binary data or PDF preview

**Saving the File:**
1. Click the **Save Response** dropdown (top right of response area)
2. Select **Save to a file**
3. Choose location and save

**Error Response:**
```json
{
  "error": "File not found or access denied"
}
```

**Causes:**
- Invalid file ID
- Application ID doesn't match the file
- File is not marked as a response document (internal files only accessible to admins)

---

### 4. GET /approve - Director/Controller Approval

**Purpose:** Approve or reject an application (used by Directors and Controllers)

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/approve?id={appId}&role={Director|Controller}&action={Approve|Reject}`

#### Steps to Test

**Example 1: Director Approval**

- **URL:** `{{BASE_URL}}/approve?id=DGC2502091234567&role=Director&action=Approve`
- **Query Params:**
  - `id`: `DGC2502091234567`
  - `role`: `Director`
  - `action`: `Approve`

**Example 2: Director Rejection**

- **URL:** `{{BASE_URL}}/approve?id=DGC2502091234567&role=Director&action=Reject`
- **Query Params:**
  - `id`: `DGC2502091234567`
  - `role`: `Director`
  - `action`: `Reject`

**Example 3: Controller Approval**

- **URL:** `{{BASE_URL}}/approve?id=DGC2502091234567&role=Controller&action=Approve`
- **Query Params:**
  - `id`: `DGC2502091234567`
  - `role`: `Controller`
  - `action`: `Approve`

#### Expected Response

**Success:**
- Returns an HTML page with confirmation message
- Status: `200 OK`
- Content-Type: `text/html`

**HTML Response:**
```html
<!DOCTYPE html>
<html>
<head><title>Application Approved</title></head>
<body>
  <h1>Application DGC2502091234567 has been approved</h1>
  <p>The student has been notified via email.</p>
</body>
</html>
```

**Side Effects:**
- Updates `director_status` or `controller_status` in database
- Updates overall `status`
- Sends email notification to student

**Status Transitions:**
- Director Approve → `status = APPROVED`
- Director Reject → `status = REJECTED`
- Controller Approve → `status = COMPLETED`
- Controller Reject → `status = REJECTED`

---

## Testing Admin Endpoints

These endpoints require authentication. You must first login to get a token.

### Authentication Flow

#### Step 1: Login to Get Token

**Endpoint:** `POST /admin/login`

1. Create a new request
2. Set method to `POST`
3. Enter URL: `{{BASE_URL}}/admin/login`
4. Go to **Body** tab
5. Select **raw** radio button
6. Select **JSON** from the dropdown (right side)
7. Enter this JSON body:

```json
{
  "username": "admin",
  "password": "your_admin_password"
}
```

8. Click **Send**

**Expected Response:**
```json
{
  "success": true,
  "token": "YWRtaW46MTczODk5MTIzNDU2Nw==",
  "username": "admin"
}
```

**Important:** Copy the `token` value - you'll need it for all other admin requests!

#### Step 2: Save Token to Environment

1. Copy the token from the response
2. Click **Environments** in the left sidebar
3. Select your environment (`Student Service - Local`)
4. Find the `ADMIN_TOKEN` variable
5. Paste the token into the **Current Value** column
6. Click **Save**

Now you can use `{{ADMIN_TOKEN}}` in all admin requests!

#### Step 3: Use Token in Requests

For all admin endpoints, add this header:

1. Go to **Headers** tab
2. Add a new header:
   - Key: `Authorization`
   - Value: `Bearer {{ADMIN_TOKEN}}`

**Or use the Authorization tab:**
1. Go to **Authorization** tab
2. Select **Bearer Token** from Type dropdown
3. Enter: `{{ADMIN_TOKEN}}`

---

### 1. POST /admin/login

Already covered above. This is how you get your authentication token.

**Key Points:**
- Token is Base64 encoded `{username}:{timestamp}`
- Token expires after 24 hours
- Password is validated using SHA-256 hash

---

### 2. GET /admin/applications - List All Applications

**Purpose:** Get a list of all submitted applications

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/admin/applications`
- **Authorization:** Bearer Token (see above)

#### Steps to Test

1. Create a new request
2. Set method to `GET`
3. Enter URL: `{{BASE_URL}}/admin/applications`
4. Add Authorization header:
   - Go to **Headers** tab
   - Key: `Authorization`
   - Value: `Bearer {{ADMIN_TOKEN}}`
5. Click **Send**

#### Expected Response

```json
[
  {
    "id": "DGC2502091234567",
    "student_email": "student1@sssihl.edu.in",
    "form_type": "Application for Duplicate Grade Card",
    "applicant_name": "John Doe",
    "reg_no": "2021001",
    "campus": "Prashanti Nilayam Campus",
    "status": "PENDING",
    "director_status": "PENDING",
    "controller_status": "PENDING",
    "created_at": "2025-02-09T10:30:00.000Z",
    "updated_at": "2025-02-09T10:30:00.000Z"
  },
  {
    "id": "CGPA2502091234568",
    "student_email": "student2@sssihl.edu.in",
    "form_type": "Application for CGPA to Marks Conversion",
    "applicant_name": "Jane Smith",
    "reg_no": "2020002",
    "campus": "Anantapur Campus",
    "status": "APPROVED",
    "director_status": "APPROVED",
    "controller_status": "PENDING",
    "created_at": "2025-02-09T09:00:00.000Z",
    "updated_at": "2025-02-09T11:00:00.000Z"
  }
]
```

**Response is an array of all applications**

**Error Response (Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

### 3. GET /admin/application/{id} - Get Application Details

**Purpose:** Get detailed information about a specific application including files

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/admin/application/{id}`
- **Authorization:** Bearer Token

#### Steps to Test

1. Create a new request
2. Set method to `GET`
3. Enter URL: `{{BASE_URL}}/admin/application/DGC2502091234567`
   - Replace with actual application ID
4. Add Authorization header: `Bearer {{ADMIN_TOKEN}}`
5. Click **Send**

#### Expected Response

```json
{
  "application": {
    "id": "DGC2502091234567",
    "student_email": "student@sssihl.edu.in",
    "form_type": "Application for Duplicate Grade Card",
    "applicant_name": "John Doe",
    "reg_no": "2021001",
    "campus": "Prashanti Nilayam Campus",
    "mobile": "9876543210",
    "program": "B.Tech Computer Science",
    "status": "PENDING",
    "director_status": "PENDING",
    "controller_status": "PENDING",
    "created_at": "2025-02-09T10:30:00.000Z",
    "updated_at": "2025-02-09T10:30:00.000Z"
  },
  "files": [
    {
      "id": "file1abc",
      "field_name": "policeComplaint",
      "file_name": "police_complaint.pdf",
      "file_type": "application/pdf",
      "file_size": 102400,
      "created_at": "2025-02-09T10:30:00.000Z"
    },
    {
      "id": "file2def",
      "field_name": "affidavit",
      "file_name": "affidavit.pdf",
      "file_type": "application/pdf",
      "file_size": 153600,
      "created_at": "2025-02-09T10:30:00.000Z"
    },
    {
      "id": "file3ghi",
      "field_name": "sbiReceipt",
      "file_name": "sbi_receipt.pdf",
      "file_type": "application/pdf",
      "file_size": 81920,
      "created_at": "2025-02-09T10:30:00.000Z"
    }
  ],
  "responseDocuments": []
}
```

**Key Information:**
- `application`: Full application details
- `files`: Uploaded documents by student (is_response = FALSE)
- `responseDocuments`: Documents uploaded by admin (is_response = TRUE)

---

### 4. GET /admin/file/{fileId} - Download File

**Purpose:** Download any file (admin access, no restrictions)

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/admin/file/{fileId}`
- **Authorization:** Bearer Token

#### Steps to Test

1. Get a `fileId` from the `/admin/application/{id}` response
2. Create a new request
3. Set method to `GET`
4. Enter URL: `{{BASE_URL}}/admin/file/file1abc`
   - Replace with actual file ID
5. Add Authorization header: `Bearer {{ADMIN_TOKEN}}`
6. Click **Send**

#### Expected Response

- Binary PDF file
- Status: `200 OK`
- Content-Type: `application/pdf`

**Save the file:**
1. Click **Save Response** → **Save to a file**
2. Choose location and save

---

### 5. GET /admin/stats - Get Statistics

**Purpose:** Get application statistics and counts

#### Basic Setup

- **Method:** `GET`
- **URL:** `{{BASE_URL}}/admin/stats`
- **Authorization:** Bearer Token

#### Steps to Test

1. Create a new request
2. Set method to `GET`
3. Enter URL: `{{BASE_URL}}/admin/stats`
4. Add Authorization header: `Bearer {{ADMIN_TOKEN}}`
5. Click **Send**

#### Expected Response

```json
{
  "total": 145,
  "pending": 45,
  "approved": 50,
  "completed": 40,
  "rejected": 10,
  "byFormType": [
    {
      "form_type": "Application for Duplicate Grade Card",
      "count": 30
    },
    {
      "form_type": "Application for CGPA to Marks Conversion",
      "count": 25
    },
    {
      "form_type": "Application for End-Semester Supplementary Examinations",
      "count": 20
    },
    {
      "form_type": "Application for Duplicate Degree Certificate",
      "count": 15
    },
    {
      "form_type": "Application for Registration of Student Name change in the Institute Records",
      "count": 12
    },
    {
      "form_type": "Application for repeating a paper for supplementary examinations(CIE and ESE)",
      "count": 10
    },
    {
      "form_type": "Application for Re-Totalling of Marks",
      "count": 8
    },
    {
      "form_type": "Application for On-Request Degree Certificate",
      "count": 15
    },
    {
      "form_type": "Application for Migration Certificate",
      "count": 10
    }
  ]
}
```

**Response Breakdown:**
- `total`: Total number of applications
- `pending`: Applications awaiting approval
- `approved`: Applications approved by Director, awaiting Controller
- `completed`: Fully processed applications
- `rejected`: Rejected applications
- `byFormType`: Count of applications by form type

---

### 6. POST /admin/complete - Mark Application Complete

**Purpose:** Manually mark an application as completed (admin override)

#### Basic Setup

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/admin/complete`
- **Authorization:** Bearer Token
- **Body Type:** `raw` (JSON)

#### Steps to Test

1. Create a new request
2. Set method to `POST`
3. Enter URL: `{{BASE_URL}}/admin/complete`
4. Add Authorization header: `Bearer {{ADMIN_TOKEN}}`
5. Go to **Body** tab
6. Select **raw** and **JSON**
7. Enter this JSON:

```json
{
  "applicationId": "DGC2502091234567"
}
```

8. Click **Send**

#### Expected Response

```json
{
  "success": true,
  "message": "Application marked as completed"
}
```

**Side Effects:**
- Sets `controller_status = APPROVED`
- Sets `status = COMPLETED`
- Updates `updated_at` timestamp

**Use Cases:**
- Bypassing normal approval flow
- Emergency completion
- Bulk processing

---

### 7. POST /admin/upload-response - Upload Response Document

**Purpose:** Upload a response document for a completed application

#### Basic Setup

- **Method:** `POST`
- **URL:** `{{BASE_URL}}/admin/upload-response`
- **Authorization:** Bearer Token
- **Body Type:** `form-data`

#### Steps to Test

1. Create a new request
2. Set method to `POST`
3. Enter URL: `{{BASE_URL}}/admin/upload-response`
4. Add Authorization header: `Bearer {{ADMIN_TOKEN}}`
5. Go to **Body** tab
6. Select **form-data**
7. Add these fields:

| Key | Value | Type |
|-----|-------|------|
| `applicationId` | `DGC2502091234567` | Text |
| `responseDocument` | (Select PDF file) | File |

8. Click **Send**

**How to attach the file:**
1. Type `responseDocument` in the Key column
2. Hover over the Value area
3. Change dropdown from "Text" to "File"
4. Click "Select Files" and choose a PDF

#### Expected Response

```json
{
  "success": true,
  "message": "Response document uploaded successfully"
}
```

**What Happens:**
- File is stored in `file_blobs` table
- `is_response` is set to `TRUE`
- `uploaded_by` is set to admin username
- Student can now download this file via `/download/{fileId}`

**Use Cases:**
- Uploading processed grade cards
- Uploading certificates
- Uploading official documents

---

## Advanced Features

### 1. Creating Collections

Collections help you organize related requests.

#### Creating a Collection

1. Click **Collections** in the left sidebar
2. Click **"+"** or **"Create a collection"**
3. Name it: `Student Service APIs`
4. Click **Create**

#### Adding Requests to Collection

**Option 1: Save new request to collection**
1. After creating a request, click **Save** (top right)
2. Choose collection: `Student Service APIs`
3. Name the request (e.g., `Submit DGC Application`)
4. Click **Save**

**Option 2: Drag existing request**
1. Find the request in **History**
2. Drag it into your collection

#### Organizing with Folders

Create folders to group endpoints:

1. Right-click on collection → **Add Folder**
2. Create folders like:
   - `Public Endpoints`
   - `Admin Endpoints`
   - `File Operations`

3. Drag requests into appropriate folders

**Example Structure:**
```
Student Service APIs
├── Public Endpoints
│   ├── Submit DGC Application
│   ├── Submit CGPA Application
│   ├── Check Status
│   └── Download File
├── Admin Endpoints
│   ├── Admin Login
│   ├── List Applications
│   ├── Get Application Details
│   ├── Get Statistics
│   ├── Mark Complete
│   └── Upload Response
└── Approval Links
    ├── Director Approve
    └── Controller Approve
```

---

### 2. Using Variables and Scripts

#### Pre-request Scripts

Run JavaScript before sending a request.

**Example: Auto-add timestamp**

1. Go to **Pre-request Script** tab
2. Add this code:

```javascript
pm.environment.set("timestamp", new Date().toISOString());
```

3. Use `{{timestamp}}` in your request

**Example: Auto-refresh expired token**

```javascript
const token = pm.environment.get("ADMIN_TOKEN");
if (!token || isTokenExpired(token)) {
    // Make login request to get new token
    pm.sendRequest({
        url: pm.environment.get("BASE_URL") + "/admin/login",
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: {
            mode: "raw",
            raw: JSON.stringify({
                username: "admin",
                password: "your_password"
            })
        }
    }, function (err, res) {
        const newToken = res.json().token;
        pm.environment.set("ADMIN_TOKEN", newToken);
    });
}

function isTokenExpired(token) {
    // Implement token expiry check (24 hours)
    // Simplified version:
    return false;
}
```

#### Tests (Post-response Scripts)

Run JavaScript after receiving a response.

**Example: Auto-save token after login**

1. Open your `POST /admin/login` request
2. Go to **Tests** tab
3. Add this code:

```javascript
// Check if login was successful
if (pm.response.code === 200) {
    const jsonData = pm.response.json();

    // Save token to environment
    pm.environment.set("ADMIN_TOKEN", jsonData.token);

    // Log success
    console.log("Token saved:", jsonData.token);

    // Set test assertion
    pm.test("Login successful", function () {
        pm.expect(jsonData.success).to.be.true;
    });
} else {
    pm.test("Login failed", function () {
        pm.expect.fail("Login request failed");
    });
}
```

**Example: Auto-save application ID after submission**

1. Open your `POST /submit` request
2. Go to **Tests** tab
3. Add:

```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();

    // Save application ID for later use
    pm.environment.set("LAST_APP_ID", jsonData.appId);

    console.log("Application submitted:", jsonData.appId);

    pm.test("Form submitted successfully", function () {
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.appId).to.exist;
    });
}
```

**Example: Validate response structure**

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("id");
    pm.expect(jsonData).to.have.property("status");
    pm.expect(jsonData).to.have.property("student_email");
});

pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

### 3. Saving Example Responses

Save example responses for documentation and comparison.

1. Send a request
2. In the response area, click **Save Response** dropdown
3. Select **Save as example**
4. Name the example (e.g., `Successful Submission`)
5. Click **Save Example**

**Benefits:**
- Document expected responses
- Compare actual vs. expected responses
- Share examples with team

---

### 4. Exporting/Importing Collections

#### Exporting

1. Right-click on collection
2. Select **Export**
3. Choose format: **Collection v2.1** (recommended)
4. Click **Export**
5. Save JSON file

#### Importing

1. Click **Import** button (top left)
2. Drag & drop JSON file or click **Select Files**
3. Choose the exported collection file
4. Click **Import**

**Use Cases:**
- Share API tests with teammates
- Backup your work
- Version control (commit to Git)

---

## Common Testing Workflows

### Workflow 1: Complete Application Lifecycle

This simulates the entire process from submission to completion.

#### Step 1: Submit Application
- Request: `POST /submit`
- Use Example 1 (Duplicate Grade Card) from above
- Save the `appId` from response

#### Step 2: Check Status (Student View)
- Request: `GET /status?id={appId}`
- Verify status is `PENDING`

#### Step 3: Admin Login
- Request: `POST /admin/login`
- Save token to environment

#### Step 4: Admin Views Application
- Request: `GET /admin/application/{appId}`
- Review application details and files

#### Step 5: Download Student Documents
- Request: `GET /admin/file/{fileId}`
- Download and verify uploaded files

#### Step 6: Director Approval
- Request: `GET /approve?id={appId}&role=Director&action=Approve`
- Verify status changes to `APPROVED`

#### Step 7: Upload Response Document
- Request: `POST /admin/upload-response`
- Upload the processed grade card
- Note the file ID

#### Step 8: Controller Approval
- Request: `GET /approve?id={appId}&role=Controller&action=Approve`
- Verify status changes to `COMPLETED`

#### Step 9: Student Downloads Response
- Request: `GET /download/{fileId}?appId={appId}`
- Download and verify the processed document

---

### Workflow 2: Testing Different Form Types

Test all 9 form types to ensure they work correctly.

#### Create 9 Requests (or use variables)

1. Submit DGC Application (with files)
2. Submit CGPA Application (no files)
3. Submit SE Application (with paper details JSON)
4. Submit DD Application
5. Submit NC Application (name change)
6. Submit RP Application (with paper details)
7. Submit RT Application (re-totalling)
8. Submit ORD Application
9. Submit MC Application

**Pro Tip:** Use a CSV file with test data and Postman's Collection Runner to automate this.

---

### Workflow 3: Testing Error Scenarios

Verify proper error handling.

#### Test 1: Missing Required Fields
- Submit form without `applicantName`
- Expected: `400 Bad Request` with error message

#### Test 2: Invalid Application ID
- Check status with fake ID: `GET /status?id=INVALID123`
- Expected: `{ "error": "Application not found" }`

#### Test 3: Unauthorized Admin Access
- Try `GET /admin/applications` without token
- Expected: `401 Unauthorized` with error message

#### Test 4: Expired Token
- Use an old token (wait 24+ hours or modify token)
- Expected: `401 Unauthorized`

#### Test 5: Invalid File ID
- Try downloading non-existent file
- Expected: `404 Not Found` with error message

#### Test 6: Wrong Application ID for File Download
- Try downloading file with mismatched appId
- Expected: `{ "error": "File not found or access denied" }`

---

### Workflow 4: Bulk Testing with Collection Runner

Test multiple requests in sequence automatically.

#### Setting Up

1. Create a collection with ordered requests
2. Click collection → **Run**
3. Select requests to run
4. Set iterations (e.g., 10 times)
5. Choose environment
6. Click **Run Student Service APIs**

#### Using Data Files (CSV)

Create a CSV file with test data:

```csv
formId,email,applicantName,regNo,campus,mobile,program,periodOfStudy
DGC001,student1@test.com,John Doe,2021001,Prashanti Nilayam Campus,9876543210,B.Tech CS,2021-2025
CGPA002,student2@test.com,Jane Smith,2020002,Anantapur Campus,9876543211,M.Sc Math,2020-2022
SE003,student3@test.com,Mike Johnson,2021003,Brindavan Campus,9876543212,B.A. English,2021-2024
```

1. In Collection Runner, click **Select File**
2. Upload your CSV
3. In your request, use `{{formId}}`, `{{email}}`, etc.
4. Run the collection

**Result:** Postman will run the request once for each row in your CSV!

---

## Troubleshooting

### Issue 1: CORS Errors

**Symptom:**
```
Access to fetch at 'http://localhost:8787/...' from origin 'chrome-extension://...' has been blocked by CORS policy
```

**Solutions:**

1. **Use Postman Desktop App** (Recommended)
   - Desktop app doesn't have CORS restrictions
   - Download from postman.com/downloads

2. **Check Backend CORS Configuration**
   - Ensure backend includes:
     ```javascript
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type, Authorization
     ```

3. **Disable Web Security** (Not recommended)
   - Only for testing in web version
   - Install browser extension like "CORS Unblock"

---

### Issue 2: Authentication Failures

**Symptom:**
```json
{
  "error": "Unauthorized"
}
```

**Solutions:**

1. **Check Token**
   - Verify `ADMIN_TOKEN` is set in environment
   - Check token hasn't expired (24-hour validity)

2. **Check Authorization Header**
   - Must be exactly: `Bearer {{ADMIN_TOKEN}}`
   - Note the space after "Bearer"
   - Check for extra spaces or quotes

3. **Re-login**
   - Get a fresh token with `POST /admin/login`
   - Update environment variable

4. **Check Username/Password**
   - Ensure credentials are correct
   - Password is case-sensitive

---

### Issue 3: File Upload Issues

**Symptom:**
```json
{
  "error": "Missing required fields"
}
```
or file not uploading

**Solutions:**

1. **Check Body Type**
   - Must be `form-data`, NOT `raw` or `x-www-form-urlencoded`

2. **Check File Type**
   - In the Key-Value row, dropdown must be set to "File"
   - Not "Text"

3. **Check File Format**
   - Only PDF files are accepted
   - Check file isn't corrupted

4. **Check Field Names**
   - Must match exactly (case-sensitive):
     - `policeComplaint`
     - `affidavit`
     - `sbiReceipt`
     - `gradeCard`
     - `responseDocument`

5. **Check File Size**
   - Large files may take longer to upload
   - Check for timeout errors

---

### Issue 4: Network Connectivity Problems

**Symptom:**
```
Could not get any response
Error: connect ECONNREFUSED 127.0.0.1:8787
```

**Solutions:**

1. **Check Backend Server is Running**
   ```bash
   cd backend
   npx wrangler dev
   ```
   - Should see: `⛅️ wrangler 3.x.x`
   - Should see: `[wrangler:inf] Ready on http://localhost:8787`

2. **Check Port**
   - Default is 8787
   - Verify in `backend/wrangler.toml` or terminal output

3. **Check BASE_URL**
   - Should be `http://localhost:8787`
   - No trailing slash
   - Check environment variable

4. **Check Firewall**
   - Ensure port 8787 is not blocked
   - Try different port if needed

5. **Check for Port Conflicts**
   - Another app might be using port 8787
   - Kill the process or change port

---

### Issue 5: JSON Parse Errors

**Symptom:**
```json
{
  "error": "Invalid JSON in request body"
}
```

**Solutions:**

1. **Validate JSON**
   - Use a JSON validator (jsonlint.com)
   - Check for:
     - Missing quotes
     - Trailing commas
     - Unescaped special characters

2. **Check Content-Type Header**
   - Should be `Content-Type: application/json`
   - Postman usually adds this automatically for raw JSON

3. **Example of Valid JSON:**
   ```json
   {
     "username": "admin",
     "password": "test123"
   }
   ```

4. **Common Mistakes:**
   ```json
   // ❌ WRONG - Trailing comma
   {
     "username": "admin",
     "password": "test123",
   }

   // ❌ WRONG - Single quotes
   {
     'username': 'admin',
     'password': 'test123'
   }

   // ✅ CORRECT
   {
     "username": "admin",
     "password": "test123"
   }
   ```

---

### Issue 6: paperDetails JSON Array Issues

**Symptom:**
Form submission fails for Supplementary Exam forms

**Solutions:**

1. **Use Correct Format**
   ```json
   [{"paperCode":"ENG301","paperTitle":"Shakespeare Studies","semester":"5"}]
   ```

2. **Must be Valid JSON Array**
   - Starts with `[` and ends with `]`
   - Each object separated by commas
   - All values in double quotes

3. **Example for Multiple Papers:**
   ```json
   [{"paperCode":"ENG301","paperTitle":"Shakespeare Studies","semester":"5"},{"paperCode":"ENG302","paperTitle":"Modern Poetry","semester":"5"}]
   ```

4. **Format in form-data:**
   - Key: `paperDetails`
   - Value: (paste the entire JSON array as text)
   - Type: Text (not File)

---

### Using Postman Console for Debugging

The Postman Console helps you see detailed request/response information.

#### Opening the Console

1. Click **Console** button (bottom left)
   - Or press `Ctrl+Alt+C` (Windows) / `Cmd+Alt+C` (Mac)

2. Keep console open while testing

#### What You'll See

```
POST http://localhost:8787/submit
Request Headers
  Content-Type: multipart/form-data
  User-Agent: PostmanRuntime/7.32.2
Request Body
  formId: DGC123
  formType: Application for Duplicate Grade Card
  email: student@sssihl.edu.in
  ...
Response Headers
  Status: 200 OK
  Content-Type: application/json
Response Body
  {
    "success": true,
    "appId": "DGC2502091234567"
  }
```

#### Using Console Logs

In your **Tests** or **Pre-request Scripts**, use:

```javascript
console.log("Token:", pm.environment.get("ADMIN_TOKEN"));
console.log("Response:", pm.response.json());
console.log("Status Code:", pm.response.code);
```

---

## Summary

You now know how to:

✅ Install and set up Postman
✅ Create and manage environments with variables
✅ Test all 11 API endpoints (4 public + 7 admin)
✅ Handle authentication with Bearer tokens
✅ Upload and download files
✅ Organize requests into collections
✅ Use variables and scripts for automation
✅ Run complete testing workflows
✅ Troubleshoot common issues

### Quick Reference Card

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/submit` | POST | No | Submit application |
| `/status` | GET | No | Check status |
| `/download/{fileId}` | GET | No | Download response doc |
| `/approve` | GET | No | Director/Controller approval |
| `/admin/login` | POST | No | Get admin token |
| `/admin/applications` | GET | Yes | List all applications |
| `/admin/application/{id}` | GET | Yes | Get app details |
| `/admin/file/{fileId}` | GET | Yes | Download any file |
| `/admin/stats` | GET | Yes | Get statistics |
| `/admin/complete` | POST | Yes | Mark as complete |
| `/admin/upload-response` | POST | Yes | Upload response doc |

### Next Steps

1. **Start your backend:**
   ```bash
   cd backend
   npx wrangler dev
   ```

2. **Create your first collection** in Postman

3. **Test each endpoint** following the examples above

4. **Set up environment variables** for easy switching between local and production

5. **Automate your tests** with Collection Runner

Happy testing! 🚀

---

## Additional Resources

- **Postman Learning Center:** [learning.postman.com](https://learning.postman.com)
- **Postman Docs:** [learning.postman.com/docs](https://learning.postman.com/docs)
- **Cloudflare Workers Docs:** [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers)
- **Your Backend Code:** `backend/src/index.js`
