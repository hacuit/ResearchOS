# ResearchOS Workspace

A comprehensive research management system with AI-powered features.

## 🚀 Quick Start

### For New Developers (First Time Setup)

If you're cloning this repository on a new PC:

```powershell
# 1. Clone the repository
git clone https://github.com/hacuit/ResearchOS.git
cd ResearchOS

# 2. Setup backend environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Configure environment variables
# Copy .env.example to .env and add your API keys
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Setup frontend
cd ..\frontend
npm install

# 5. Return to root directory
cd ..
```

### For Existing Developers

If you already have the repository set up and want to pull latest changes:

```powershell
# Pull latest changes
git pull origin main

# Update backend dependencies (if needed)
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Update frontend dependencies (if needed)
cd ..\frontend
npm install
```

## 📦 What is ready now

- Backend API: FastAPI + DB + JWT + seed import + bulk report ingestion
- Frontend UI: Next.js dashboard page connected to backend

## 🔧 0) One-time backend bootstrap

```powershell
cd C:\Dev\ResearchOS
.\bootstrap_backend.ps1
```

## 1) Run backend (Terminal A)

```powershell
cd C:\Dev\ResearchOS
.\run_backend.ps1
```

Check:
- http://127.0.0.1:8000/
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/health

## 2) Run frontend (Terminal B)

```powershell
cd C:\Dev\ResearchOS
.\run_frontend.ps1
```

Check:
- http://127.0.0.1:3000

## 3) In frontend page do this order

1. Login (`dhkwon@dgist.ac.kr` / `asdf`)
2. Load Profile
3. Import Seed
4. Load Ideas
5. Bulk Ingest Reports
6. Load Dashboard
7. Load Selected Idea Tasks
