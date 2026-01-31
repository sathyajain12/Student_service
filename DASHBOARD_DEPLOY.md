# Cloudflare Dashboard Deployment Guide
## No npm Required - Deploy from Office Browser

This guide helps you deploy the entire application using only the Cloudflare Dashboard (no command line needed).

---

## ⏱️ Total Time: ~30 minutes

---

## STEP 1: Set Up Database Schema (5 minutes)

1. **Login** to Cloudflare: https://dash.cloudflare.com

2. Navigate to: **Workers & Pages** → **D1**

3. Find and click: **sssihl-student-services**

4. Click the **Console** tab

5. **Get the SQL schema**:
   - Open: https://github.com/sathyajain12/Student_service/blob/main/backend/migrate.sql
   - Click the **Raw** button (top right)
   - Select all (Ctrl+A) and copy (Ctrl+C)

6. **Paste** the SQL into the D1 Console and click **Execute**

7. **Verify** tables were created:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table';
   ```

   You should see 11 tables:
   - applications
   - file_attachments
   - form_cgpa_conversion
   - form_duplicate_degree
   - form_duplicate_grade_card
   - form_migration_certificate
   - form_name_change
   - form_on_request_degree
   - form_repeat_paper
   - form_retotaling
   - form_supplementary_exam

✅ **Database is ready!**

---

## STEP 2: Deploy Backend Worker (15 minutes)

### 2A. Create Worker

1. Go to: **Workers & Pages** → **Create Application**

2. Click **Workers** tab → **Create Worker**

3. Enter name: `sssihl-student-services-backend`

4. Click **Deploy** (deploys a sample worker)

### 2B. Add Worker Code

1. Click **Edit code** button

2. **Delete all the sample code** in the editor

3. **Get the simplified backend code**:
   - Open: https://github.com/sathyajain12/Student_service/blob/main/backend/src/index-dashboard.js
   - Click **Raw** button
   - Select all (Ctrl+A) and copy (Ctrl+C)

4. **Paste** into the Worker editor

5. Click **Save and deploy**

### 2C. Bind D1 Database

1. Click **Settings** (top tab)

2. Scroll to **Bindings** section

3. Click **Add** → Select **D1 database**

4. Configure:
   - **Variable name**: `DB`
   - **D1 database**: Select `sssihl-student-services`

5. Click **Save**

### 2D. Get Worker URL

1. Go back to **Worker** overview

2. **Copy your Worker URL** - looks like:
   ```
   https://sssihl-student-services-backend.YOUR-SUBDOMAIN.workers.dev
   ```

3. **Save this URL** - you'll need it for the frontend!

✅ **Backend is deployed!**

---

## STEP 3: Deploy Frontend (10 minutes)

### 3A. Connect GitHub

1. Go to: **Workers & Pages** → **Create Application**

2. Click **Pages** tab → **Connect to Git**

3. **Authorize GitHub** (if not already authorized)

4. Select repository: **sathyajain12/Student_service**

5. Click **Begin setup**

### 3B. Configure Build Settings

```
Project name: sssihl-student-services-frontend
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory (path): frontend
```

### 3C. Add Environment Variable

1. Click **+ Add variable**

2. Configure:
   - **Variable name**: `VITE_BACKEND_URL`
   - **Value**: Paste your Worker URL from Step 2D

   Example: `https://sssihl-student-services-backend.abc123.workers.dev`

3. Click **Save and Deploy**

4. **Wait** for the build to complete (3-5 minutes)

### 3D. Get Frontend URL

Once deployment completes, you'll get a URL like:
```
https://sssihl-student-services-frontend.pages.dev
```

✅ **Frontend is deployed!**

---

## STEP 4: Test Your Application

1. **Open your frontend URL** in a browser

2. Select **CGPA to Marks Conversion** form

3. Fill in test data:
   - Name: Test Student
   - Reg No: 12345
   - Campus: Prashanti Nilayam Campus
   - Program: MSc Data Science
   - Mobile: 9876543210
   - Email: test@example.com
   - Address: Test Address
   - CGPA: 8.5

4. **Submit** the form

5. You should see: `Submitted! ID: APP-xxxxxxxxx`

### Verify Data in Database

1. Go back to **D1** → **sssihl-student-services** → **Console**

2. Run query:
   ```sql
   SELECT * FROM applications;
   ```

3. You should see your test submission!

4. Check form-specific data:
   ```sql
   SELECT * FROM form_cgpa_conversion;
   ```

✅ **Application is working!**

---

## 🎯 Your Deployment URLs

**Frontend (Student Portal):**
```
https://sssihl-student-services-frontend.pages.dev
```

**Backend API:**
```
https://sssihl-student-services-backend.YOUR-SUBDOMAIN.workers.dev
```

**Database:**
- Cloudflare D1: `sssihl-student-services`
- ID: `640c91bf-4c66-484b-afa1-9870996ad70c`

---

## ⚠️ Important Notes

### What's Missing (Disabled for Dashboard Deployment):
- ❌ **File uploads to Google Drive** - requires npm packages
- ❌ **Email notifications** - requires npm packages

### What's Working:
- ✅ All 9 form submissions
- ✅ Database storage
- ✅ Application tracking
- ✅ Approval workflow structure

### To Enable Full Features:
You'll need to deploy using command line (from home or non-restricted environment):
- See [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for CLI deployment
- The full version with Google integration is in `backend/src/index.js`

---

## Troubleshooting

### Frontend shows "Failed to fetch"
- Check that `VITE_BACKEND_URL` is set correctly in Pages settings
- Verify backend Worker is deployed and accessible
- Check browser console for CORS errors

### Form submission fails
- Check Worker logs: Worker → Logs tab
- Verify D1 binding is configured: Settings → Bindings
- Test backend directly: `https://YOUR-WORKER-URL.workers.dev`

### Database is empty after submission
- Verify you're checking the remote database (not local)
- Check Worker logs for errors
- Ensure D1 binding variable name is exactly `DB`

### Build fails on Cloudflare Pages
- Check build logs in Pages deployment
- Verify `Root directory` is set to `frontend`
- Ensure GitHub repository is accessible

---

## Monitoring Your Application

### View Submissions
```sql
-- In D1 Console
SELECT * FROM applications ORDER BY created_at DESC;
```

### Check Worker Activity
- Go to Worker → **Metrics** tab
- View requests, errors, and latency

### View Build Logs
- Go to Pages → **Deployments** tab
- Click on any deployment to see logs

---

## Updating Your Application

### Update Frontend
1. Push changes to GitHub
2. Cloudflare Pages will auto-deploy
3. Or manually trigger: Pages → Deployments → **Retry deployment**

### Update Backend
1. Go to Worker → **Quick edit**
2. Make changes
3. Click **Save and deploy**

### Update Database Schema
1. Go to D1 → Console
2. Run ALTER TABLE or CREATE TABLE statements
3. Or drop and recreate (will lose data!)

---

## Next Steps

✅ **Application is live!**

Share the frontend URL with students to start accepting applications.

For admin features (viewing submissions, approvals), you'll need to build an admin dashboard - that's a future enhancement!
