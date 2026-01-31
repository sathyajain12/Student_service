# SSSIHL Student Services Application

A full-stack student services portal for Sri Sathya Sai Institute of Higher Learning, built with React frontend and Cloudflare Workers backend.

## Features

- 📝 **9 Different Form Types**:
  - Duplicate Grade Card
  - CGPA to Marks Conversion
  - Supplementary Examination
  - Duplicate Degree Certificate
  - Name Change Registration
  - Repeat Paper Application
  - Re-Totalling of Marks
  - On-Request Degree Certificate
  - Migration Certificate

- ☁️ **Cloudflare Infrastructure**:
  - Backend: Cloudflare Workers
  - Database: Cloudflare D1 (SQLite)
  - Frontend: Cloudflare Pages
  - File Storage: Google Drive integration

- 🔄 **Approval Workflow**:
  - Director approval
  - Controller approval
  - Status tracking for each application

## Tech Stack

**Frontend:**
- React 19
- Vite
- React DatePicker

**Backend:**
- Cloudflare Workers
- Cloudflare D1 Database
- Google APIs (Gmail & Drive)

## Project Structure

```
Student_service-main/
├── backend/              # Cloudflare Worker API
│   ├── src/
│   │   ├── index.js     # Main worker logic
│   │   └── google-api.js # Google API integration
│   ├── schema.sql       # Database schema
│   ├── migrate.sql      # Migration script
│   └── wrangler.toml    # Worker configuration
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── formConfigs.js # Form definitions
│   │   └── App.jsx
│   └── wrangler.toml    # Pages configuration
│
└── DEPLOYMENT_GUIDE.md  # Detailed deployment instructions
```

## Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd Student_service-main
```

2. **Set up backend:**
```bash
cd backend
npm install
npx wrangler dev
```

3. **Set up frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8787

### Database Setup

Local database schema is automatically created. For remote database:
```bash
cd backend
npx wrangler d1 execute sssihl-student-services --remote --file=migrate.sql
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete deployment instructions to Cloudflare.

**Quick deploy:**
```bash
# Deploy backend
cd backend
npx wrangler deploy

# Deploy frontend
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=sssihl-student-services-frontend
```

## Environment Variables

### Frontend
Create `frontend/.env.local`:
```env
VITE_BACKEND_URL=http://localhost:8787
```

For production, edit `frontend/.env.production`:
```env
VITE_BACKEND_URL=https://your-worker-url.workers.dev
```

### Backend
Configure in Cloudflare Dashboard under Worker Settings → Variables:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`

## Database Schema

The application uses 9 form-specific tables plus 2 shared tables:
- `applications` - Central metadata and status tracking
- `file_attachments` - Centralized file storage
- `form_*` - Individual form data (9 tables)

See [schema.sql](backend/schema.sql) for complete schema.

## Campus Director Emails

Configured in backend ([index.js:744-753](backend/src/index.js#L744-L753)):
- Prashanti Nilayam Campus
- Anantapur Campus
- Brindavan Campus
- Nandigiri Campus

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## License

This project is developed for Sri Sathya Sai Institute of Higher Learning.

## Support

For issues or questions:
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review Cloudflare Workers documentation
- Contact the development team
