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
