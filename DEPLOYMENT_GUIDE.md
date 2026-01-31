# SSSIHL Student Services - Cloudflare Deployment Guide

## Prerequisites
- Cloudflare account
- Access to npm/node (can run from home if office blocks it)
- Wrangler CLI installed globally: `npm install -g wrangler`

---

## STEP 1: Set Up Remote D1 Database

### Option A: Via Cloudflare Dashboard (Can do from office)
1. Login to https://dash.cloudflare.com
2. Go to **Workers & Pages** → **D1**
3. Find database: `sssihl-student-services` (ID: 640c91bf-4c66-484b-afa1-9870996ad70c)
4. Click **Console** tab
5. Copy entire content from `backend/migrate.sql` and execute

### Option B: Via Command Line (From home)
```bash
cd backend
npx wrangler d1 execute sssihl-student-services --remote --file=migrate.sql
```

**Verify it worked:**
```bash
npx wrangler d1 execute sssihl-student-services --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see all 9 form tables listed.

---

## STEP 2: Deploy Backend (Cloudflare Worker)

**From terminal (home):**
```bash
cd backend
npx wrangler login  # Login to Cloudflare (only needed once)
npx wrangler deploy
```

**Save the deployment URL!** It will look like:
```
https://sssihl-student-services-backend.YOUR-SUBDOMAIN.workers.dev
```

**Test the backend:**
```bash
curl https://YOUR-WORKER-URL.workers.dev
```

---

## STEP 3: Configure Frontend for Production

**Edit `frontend/.env.production`:**
```env
VITE_BACKEND_URL=https://YOUR-ACTUAL-WORKER-URL.workers.dev
```

Replace `YOUR-ACTUAL-WORKER-URL` with the URL from Step 2.

---

## STEP 4: Deploy Frontend (Cloudflare Pages)

### Option A: Via GitHub (Recommended)

1. **Push code to GitHub**
2. **In Cloudflare Dashboard:**
   - Go to **Workers & Pages** → **Create Application** → **Pages**
   - Connect to your GitHub repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
     - **Root directory:** `frontend`
   - Add environment variable:
     - `VITE_BACKEND_URL` = `https://YOUR-WORKER-URL.workers.dev`
   - Click **Save and Deploy**

### Option B: Via Command Line (Direct Upload)

```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=sssihl-student-services-frontend
```

**Your frontend will be live at:**
```
https://sssihl-student-services-frontend.pages.dev
```

---

## STEP 5: Configure Google API (Optional - for email & file uploads)

If you want email notifications and Google Drive file uploads:

1. **Get Google Service Account credentials** (from Google Cloud Console)
2. **In Cloudflare Dashboard:**
   - Go to your Worker: `sssihl-student-services-backend`
   - Click **Settings** → **Variables**
   - Add secrets:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `GOOGLE_PRIVATE_KEY`
     - `GOOGLE_DRIVE_FOLDER_ID`

3. **Redeploy backend:**
```bash
cd backend
npx wrangler deploy
```

---

## Testing Your Deployment

1. Visit your frontend URL: `https://sssihl-student-services-frontend.pages.dev`
2. Fill out and submit a form
3. Check data in D1:
```bash
cd backend
npx wrangler d1 execute sssihl-student-services --remote --command "SELECT * FROM applications"
```

---

## Troubleshooting

### Frontend can't connect to backend
- Check CORS headers in backend allow your frontend domain
- Verify `VITE_BACKEND_URL` is set correctly in frontend environment variables
- Check browser console for errors

### Database is empty after submission
- Verify you're querying the remote database (use `--remote` flag)
- Check Worker logs: `npx wrangler tail sssihl-student-services-backend`

### Build fails
- Ensure all dependencies are installed: `npm install`
- Check Node version compatibility

---

## Quick Commands Reference

**Backend:**
```bash
# Deploy backend
cd backend && npx wrangler deploy

# View logs
npx wrangler tail sssihl-student-services-backend

# Query remote database
npx wrangler d1 execute sssihl-student-services --remote --command "YOUR SQL"
```

**Frontend:**
```bash
# Build locally
cd frontend && npm run build

# Deploy to Pages
npx wrangler pages deploy dist --project-name=sssihl-student-services-frontend
```

---

## URLs After Deployment

- **Backend API:** https://sssihl-student-services-backend.YOUR-SUBDOMAIN.workers.dev
- **Frontend:** https://sssihl-student-services-frontend.pages.dev
- **Cloudflare Dashboard:** https://dash.cloudflare.com

---

## Support

For issues with Cloudflare deployment, check:
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
