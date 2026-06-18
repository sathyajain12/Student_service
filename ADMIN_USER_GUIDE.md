# Admin User Guide
## SSSIHL Student Services Portal

**Sri Sathya Sai Institute of Higher Learning**
*Student Services Application Management System*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Admin Roles & Permissions](#3-admin-roles--permissions)
4. [Dashboard Overview](#4-dashboard-overview)
5. [Managing Applications](#5-managing-applications)
6. [Application Workflow & Statuses](#6-application-workflow--statuses)
7. [Processing Applications](#7-processing-applications)
8. [File Management](#8-file-management)
9. [Dispatch & Notifications](#9-dispatch--notifications)
10. [Audit Log](#10-audit-log)
11. [Admin User Management](#11-admin-user-management)
12. [Form Settings](#12-form-settings)
13. [Data Export](#13-data-export)
14. [Troubleshooting](#14-troubleshooting)
15. [Security Best Practices](#15-security-best-practices)

---

## 1. Introduction

The SSSIHL Student Services Portal is a web-based system that allows students to submit service requests for academic documents and examinations. As an admin, you are responsible for reviewing, processing, and fulfilling these requests.

### Supported Application Types

| # | Form Name |
|---|-----------|
| 1 | Duplicate Grade Card |
| 2 | CGPA to Percentage Conversion |
| 3 | Supplementary Examinations Registration |
| 4 | Duplicate Degree Certificate |
| 5 | Student Name Change in Institute Records |
| 6 | Repeating Examinations Registration (CIE and ESE) |
| 7 | Re-Totalling of Marks |
| 8 | On-Request Degree Certificate |
| 9 | Migration Certificate |

### Campuses Served

- Prashanti Nilayam Campus
- Anantapur Campus
- Brindavan Campus
- Nandigiri Campus

---

## 2. Getting Started

### Accessing the Admin Portal

1. Open a web browser and navigate to the admin portal URL.
2. Click on the **Admin Login** button or navigate to the `/admin` path.

### Logging In

1. Enter your **Username** and **Password** in the login form.
2. Click **Login**.
3. Your session is tab-specific and expires after **24 hours**. You will be automatically logged out after this period.

> **Note:** Your session is stored per browser tab. If you open the admin portal in a new tab, you will need to log in again in that tab.

### Logging Out

Click the **Logout** button in the top navigation bar. For security, always log out when you are done, especially on shared computers.

---

## 3. Admin Roles & Permissions

There are four admin roles. Each role determines which applications you can view and manage.

| Role | Description | Access |
|------|-------------|--------|
| `admin` | Full administrator | All applications, user management, form settings |
| `ug` | UG Programme Admin | UG applications only (Bachelor's programmes, excluding B.Ed) |
| `pg` | PG Programme Admin | PG applications only (Master's programmes, B.Ed) |
| `phd` | PhD Programme Admin | PhD-related forms only (On-Request Degree, Migration Certificate) |

> **Only `admin` role users** can create or delete other admin accounts and toggle form availability.

---

## 4. Dashboard Overview

After logging in, you will see the main dashboard with the following sections:

### Statistics Panel

Displays counts for each application status:

| Stat | Meaning |
|------|---------|
| **Total** | All applications in the system |
| **Pending** | Newly submitted, awaiting review |
| **Approved** | Fully approved by director and controller |
| **Dispatched** | Document sent to the student |
| **Completed** | Fully processed and closed |
| **Rejected** | Application rejected |

### Application List

- Shows all applications relevant to your role.
- Displays: Application ID, student name, form type, campus, programme, status, and submission date.
- Click any application row to open its detailed view.

### Search & Filters

Use the filter controls to narrow down the list:

- **Search**: Search by student name, registration number, or application ID.
- **Status Filter**: Filter by application status (Pending, Approved, Rejected, etc.).
- **Campus Filter**: Filter by campus (Prashanti Nilayam, Anantapur, Brindavan, Nandigiri).

---

## 5. Managing Applications

### Viewing an Application

Click on any application in the list to open the detailed view. You will see:

- **Student Information**: Name, email, registration number, ABC/APAAR ID, campus, programme.
- **Form Details**: All fields specific to the form type (e.g., exam year, subject details).
- **Uploaded Files**: Documents submitted by the student (click to preview PDFs or download).
- **Status History**: Current status and director/controller decisions.
- **Director Comments** (if any): Comments provided during the approval stage.

### Viewing Files

- Click on a file name or thumbnail to open it in the built-in PDF viewer.
- Files are stored securely and can only be accessed by authenticated admins.

---

## 6. Application Workflow & Statuses

Applications move through a defined approval pipeline. Understanding these statuses is essential for processing applications correctly.

```
PENDING
    ↓  (Campus exam section review, where applicable)
AWAITING_DIRECTOR
    ↓  (Director reviews and acts)
    ├─→ DIRECTOR_APPROVED
    │       ↓  (Controller of Examinations approves)
    │   APPROVED
    │       ↓  (Admin marks done)
    │   COMPLETED
    │       ↓  (Admin dispatches document)
    │   DISPATCHED
    │
    ├─→ DIRECTOR_COMMENTED  (Director requests clarification)
    │       ↓  (Admin resolves the hold)
    │   (Resumes to APPROVED)
    │
    └─→ REJECTED
```

### Status Descriptions

| Status | Description |
|--------|-------------|
| `PENDING` | Student submitted the form; no action taken yet |
| `AWAITING_DIRECTOR` | Sent for director-level review |
| `DIRECTOR_APPROVED` | Director has approved; awaiting controller action |
| `DIRECTOR_COMMENTED` | Director raised a comment or query; application on hold |
| `APPROVED` | Fully approved through all channels |
| `COMPLETED` | Admin has marked the application as fully processed |
| `DISPATCHED` | Physical document has been sent to the student |
| `REJECTED` | Application was rejected at some stage |

---

## 7. Processing Applications

### Step 1 — Review the Application

Open the application and verify:
- Student details are accurate and complete.
- All required documents are uploaded and legible.
- The form type matches the student's request.

### Step 2 — Upload a Response Document (if required)

If your processing generates a document (e.g., a signed certificate, converted grade card):

1. In the application detail view, scroll to the **Upload Response** section.
2. Click **Choose File** and select the document.
3. Click **Upload Response**.
4. The document will be stored and linked to the application for the student to download.

> Supported file types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, GIF, BMP, SVG, TIFF, WebP, ODP.
> Maximum file size: **25 MB**.

### Step 3 — Mark as Completed

Once all internal processing is done:

1. In the application detail view, click **Mark as Completed**.
2. The application status will change to `COMPLETED`.

### Step 4 — Dispatch (if applicable)

If the processed document is being physically sent to the student:

1. Click **Notify Dispatched**.
2. A dialog will appear. Optionally enter a **tracking number**.
3. Click **Confirm Dispatch**.
4. The student will receive an email notification with the tracking number (if provided) and a download link for any digital response document.

### Resolving a Director Comment Hold

When the director has left a comment and the application is in `DIRECTOR_COMMENTED` status:

1. Review the director's comment in the application detail view.
2. Take the appropriate action (contact the student, gather missing information, etc.).
3. Click **Resolve Hold**.
4. The application will move forward in the workflow.

---

## 8. File Management

### Downloading Admin-Accessible Files

- In the application detail view, click any file listed under **Student Documents** to preview or download it.
- Files are served securely through the admin API with your authentication token.

### Downloading Response Documents

- Files uploaded as responses appear separately under **Response Documents**.
- These are the same files the student can access via their download link.

### File Security

All uploaded files pass through the following validation:
- **Type whitelist**: Only approved file types are accepted.
- **Size limit**: Files larger than 25 MB are rejected.
- **Magic number verification**: File headers are verified to match the declared type.
- **Cloudflare DLP scanning**: Optional deep scanning (if configured by the system administrator).

---

## 9. Dispatch & Notifications

### Email Notification on Dispatch

When you click **Notify Dispatched**, the system sends an automated email to the student containing:
- Confirmation that their document has been dispatched.
- Tracking number (if provided).
- A secure download link for the digital response document (if one was uploaded).

### Testing Email Functionality

If you need to verify that emails are working correctly:
- Use **Test Director Email** to send a test email to a director's inbox.
- Use **Test Campus Exam Email** to test campus exam section emails.

These options are available in the admin settings panel (for `admin` role only).

---

## 10. Audit Log

Every significant action taken in the system is recorded in the audit log.

### Accessing the Audit Log

1. From the dashboard, click **Audit Log** in the navigation.
2. The log displays: timestamp, admin username, action type, application ID (if applicable), and details.

### Filtering the Audit Log

Use the **Action Filter** dropdown to filter by action type:
- `LOGIN` — Admin login events
- `COMPLETE` — Application marked as completed
- `DISPATCH` — Application dispatched
- `RESOLVE_HOLD` — Director comment hold resolved
- `UPLOAD_RESPONSE` — Response document uploaded
- `ARCHIVE` — Application archived
- `CREATE_USER` — New admin user created
- `DELETE_USER` — Admin user deleted
- `FORM_SETTINGS` — Form active/inactive toggled

> The audit log is **read-only** and cannot be edited or deleted. It provides a complete trail of all admin activity for accountability.

---

## 11. Admin User Management

> **This section is only available to users with the `admin` role.**

### Viewing All Admin Users

1. Navigate to **User Management** in the admin panel.
2. A list of all admin accounts is displayed, showing username, email, role, and creation date.

### Creating a New Admin User

1. Click **Create User**.
2. Fill in the following fields:
   - **Username**: Unique login identifier.
   - **Email**: Admin's email address.
   - **Password**: Must be a strong password.
   - **Role**: Select from `admin`, `ug`, `pg`, or `phd`.
3. Click **Create**.
4. The new user can immediately log in with the provided credentials.

> Passwords are stored using **PBKDF2-SHA256 with 100,000 iterations** — never stored in plain text.

### Deleting an Admin User

1. In the user list, find the user you want to remove.
2. Click **Delete** next to their name.
3. Confirm the deletion.

> **Warning:** Deleting a user is permanent and cannot be undone. The user will immediately lose access.

### Changing a Password

Currently, password changes must be done by deleting the existing user and creating a new account with the same username and the new password. Contact your system administrator if this workflow needs to be updated.

---

## 12. Form Settings

> **This section is only available to users with the `admin` role.**

You can enable or disable individual form types. When a form is **disabled**, students will not be able to submit new applications of that type.

### Toggling a Form

1. Navigate to **Form Settings** in the admin panel.
2. You will see a list of all 9 form types with their current status (Active / Inactive).
3. Click the toggle next to any form to enable or disable it.
4. The change takes effect immediately.

**Use cases:**
- Disable the Supplementary Exam form after the registration deadline.
- Temporarily disable a form while processing a large backlog.
- Disable forms not applicable to the current academic term.

---

## 13. Data Export

### Exporting a Single Application

1. Open the application detail view.
2. Click **Export Application**.
3. A JSON file containing all application data (form fields, student details, status history) will be downloaded.

### Bulk Export by Form Type

1. From the dashboard, select **Export by Form Type**.
2. Choose the form type from the dropdown.
3. Click **Export**.
4. An **XLSX (Excel) file** containing all applications of that type will be downloaded. This includes all student data and status information, suitable for reporting.

### Monthly Automated Backup

The system runs an automatic monthly backup:
- All application data is exported to **Google Sheets**.
- Backup sheets are timestamped and moved to the designated backup folder in **Google Drive**.
- No admin action is required for this — it runs automatically.

---

## 14. Troubleshooting

### Cannot Log In

- Verify your username and password are correct (passwords are case-sensitive).
- Ensure your account has not been deleted. Contact a full `admin` user.
- Clear your browser cache and try again.
- Check that your session has not expired (sessions last 24 hours).

### Application Not Appearing in My List

- Your role may restrict what applications you see. Check with the system admin if you believe you should have access.
- Use the search bar and make sure no filters are accidentally applied.

### File Upload Fails

- Check that the file type is supported (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, GIF, BMP, SVG, TIFF, WebP, ODP).
- Ensure the file is under **25 MB**.
- Ensure the file is not corrupted or in an unexpected format.

### Student Did Not Receive Email

- Verify the student's email address in the application.
- Use the **Test Director Email** / **Test Campus Exam Email** buttons to verify the email service is functioning.
- Contact your system administrator to check Gmail API credentials and refresh tokens.

### Export Not Downloading

- Check your browser's download settings — it may be blocking automatic downloads.
- Try a different browser.
- For bulk exports, very large datasets may take a few seconds; wait before retrying.

### Application Stuck in a Status

- For `DIRECTOR_COMMENTED`: Use **Resolve Hold** after addressing the director's query.
- For `AWAITING_DIRECTOR`: The director must take action via their email approval link. You can test director emails to re-send the notification.
- For any unexpected status, check the **Audit Log** for recent actions on the application.

---

## 15. Security Best Practices

As an admin, you have access to sensitive student data. Please follow these practices:

1. **Use a strong, unique password** — do not reuse passwords from other systems.
2. **Log out after every session**, especially on shared or public computers.
3. **Do not share your credentials** with anyone, including other staff.
4. **Do not export or store student data** on personal or unsecured devices.
5. **Report suspicious activity** — if you notice actions in the audit log that you did not perform, notify your system administrator immediately.
6. **Do not share download links** — student document download links are personalized; do not forward them to unintended recipients.
7. **Verify file contents before uploading** — ensure any response documents are correct before dispatching.
8. Sessions use **tab-specific storage** — closing the tab logs you out of that tab only. Close all admin tabs when done.

---

## Appendix: Quick Reference

### Application Status Flow

```
PENDING → AWAITING_DIRECTOR → DIRECTOR_APPROVED → APPROVED → COMPLETED → DISPATCHED
                            ↘ DIRECTOR_COMMENTED → (Resolve Hold) → APPROVED
                            ↘ REJECTED
```

### Role → Form Access

| Role | Accessible Forms |
|------|-----------------|
| admin | All forms |
| ug | Bachelor's programmes (excluding B.Ed) |
| pg | Master's programmes + B.Ed |
| phd | On-Request Degree, Migration Certificate |

### Key Actions & When to Use Them

| Action | When to Use |
|--------|-------------|
| Upload Response | After generating the processed document |
| Mark as Completed | After all internal processing is done |
| Notify Dispatched | When physically posting the document to the student |
| Resolve Hold | After addressing a director's comment |
| Toggle Form | To open/close student submissions for a form type |
| Export Application | To download a single application's data for records |
| Export by Form Type | For bulk reporting or audit purposes |

---

*Guide prepared for SSSIHL Student Services Administration — May 2026*
