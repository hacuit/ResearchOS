# Research OS Backend (MVP)

## Run

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Default DB uses SQLite (`backend/researchos.db`).
Set `DATABASE_URL` to PostgreSQL when ready.

## First login

Startup auto-creates owner user/workspace from env:

- `OWNER_EMAIL`
- `OWNER_PASSWORD`

Then call `POST /auth/login` and use returned bearer token.

## Current endpoints

- `GET /health`
- `POST /auth/login`
- `GET /me`
- `GET /dashboard/overview?month=YYYY-MM`
- `GET /ideas`
- `POST /ideas`
- `GET /ideas/{id}`
- `GET /ideas/{id}/tasks`
- `POST /ideas/{id}/tasks`
- `POST /ideas/{id}/update_logs`
- `POST /ingest/daily_report?idea_id={id}`
- `POST /seed/import?path=seed/mvp_seed_plan_2026.json`
- `POST /ingest/daily_reports/bulk?idea_id={id}&reports_dir=C:/Research/07_reports`

## Suggested quick bootstrap

1. Login with owner email/password.
2. Run `/seed/import`.
3. Find target idea id from `/ideas`.
4. Run `/ingest/daily_reports/bulk`.
5. Open `/dashboard/overview?month=2026-02`.

## One-command local bootstrap

```bash
cd backend
python -m scripts.reset_db
python -m scripts.dev_bootstrap
python -m scripts.smoke_test
```
