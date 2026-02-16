# Next Actions (Owner)

## Immediate verify commands

1. Backend bootstrap (one-time)
```powershell
cd C:\Dev\ResearchOS
.\bootstrap_backend.ps1
```

2. Backend run
```powershell
cd C:\Dev\ResearchOS
.\run_backend.ps1
```

3. Frontend run (new terminal)
```powershell
cd C:\Dev\ResearchOS
.\run_frontend.ps1
```

4. Browser checks
- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:3000`

## What is implemented now

- Confirmed spec and decisions reflected
- FastAPI backend with JWT auth and sqlite/postgres-ready structure
- Seed import + bulk daily report ingestion from `C:\Research\07_reports`
- OpenAI-capable summarizer fallback chain (OpenAI -> local heuristic)
- Next.js frontend dashboard page for live API interaction
- Extra APIs:
  - `PATCH /ideas/{id}`, `DELETE /ideas/{id}`
  - `PATCH /tasks/{id}`, `DELETE /tasks/{id}`
  - `POST /ideas/{id}/deliverables`, `PATCH /deliverables/{id}`, `DELETE /deliverables/{id}`
  - `DELETE /update_logs/{id}`
  - `GET /ideas/{id}/progress`
  - `GET /ideas/{id}/risks?month=YYYY-MM`
  - `GET /ideas/{id}/next_actions?month=YYYY-MM`
  - `GET /export/workspace`
- Dev scripts: `bootstrap_backend.ps1`, `run_backend.ps1`, `run_frontend.ps1`

## Quick validation

```powershell
cd C:\Dev\ResearchOS\backend
python -m scripts.smoke_test
```
