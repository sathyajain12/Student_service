# Quick Deployment Guide (Command Line)

## Prerequisites
- Node.js installed
- Terminal access
- npm/npx available

## Step-by-Step Deployment

### 1. Install Wrangler (if not already installed)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```
This opens a browser window - authorize access.

### 3. Set Up Remote Database
```bash
cd backend
npx wrangler d1 execute sssihl-student-services --remote --file=migrate.sql
```

**Verify tables were created:**
```bash
npx wrangler d1 execute sssihl-student-services --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see all 9 form tables.

### 4. Deploy Backend Worker
```bash
cd backend
npx wrangler deploy
```

**IMPORTANT: Copy the deployment URL!**
Example: `https://sssihl-student-services-backend.abc123.workers.dev`

### 5. Update Frontend Configuration
Edit `frontend/.env.production`:
```env
VITE_BACKEND_URL=https://sssihl-student-services-backend.YOUR-ACTUAL-URL.workers.dev
```

Replace `YOUR-ACTUAL-URL` with the URL from Step 4.

### 6. Deploy Frontend to Cloudflare Pages
```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=sssihl-student-services-frontend
```

**Your app is now live!**

Frontend URL: `https://sssihl-student-services-frontend.pages.dev`

---

## Testing Your Deployment

1. Visit your frontend URL
2. Fill out a CGPA conversion form
3. Submit it
4. Check the database:
```bash
cd backend
npx wrangler d1 execute sssihl-student-services --remote --command "SELECT * FROM applications"
```

You should see your submission!

---

## Optional: Set Up Google API (for emails & file uploads)

If you want email notifications and Google Drive integration:

1. Get Google Service Account credentials from Google Cloud Console
2. In Cloudflare Dashboard:
   - Go to Worker → Settings → Variables
   - Add these secrets:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_PRIVATE_KEY`
     - `GOOGLE_DRIVE_FOLDER_ID`

3. Redeploy backend:
```bash
cd backend
npx wrangler deploy
```

---

## Troubleshooting

**Frontend can't connect to backend:**
- Check browser console for CORS errors
- Verify VITE_BACKEND_URL is correct
- Ensure backend is deployed and accessible

**Database queries fail:**
- Make sure you're using `--remote` flag
- Check database binding in Worker settings

**Build fails:**
- Run `npm install` in both frontend and backend
- Check Node.js version (need 18+)

---

## Useful Commands

**View Worker logs:**
```bash
npx wrangler tail sssihl-student-services-backend
```

**Query database:**
```bash
npx wrangler d1 execute sssihl-student-services --remote --command "YOUR_SQL_QUERY"
```

**Redeploy after changes:**
```bash
# Backend
cd backend && npx wrangler deploy

# Frontend
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=sssihl-student-services-frontend
```
