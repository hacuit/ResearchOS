# ResearchOS Workspace

## What is ready now

- Backend API: FastAPI + DB + JWT + seed import + bulk report ingestion
- Frontend UI: Next.js dashboard page connected to backend

## 0) One-time backend bootstrap

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
