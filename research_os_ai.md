# Research OS – Idea Progress Dashboard  
## AI-Implementation-Oriented Specification

---

# 1. Goals and Non-Goals

## 1.1 Goals

- Provide unified progress tracking at the **idea (project/paper topic)** level in a single Dashboard page.
- Monthly Gantt chart (image-level granularity) with expandable Phase/Task hierarchy.
- Display:
  - Progress percentage
  - Delay detection
  - Priority ranking
  - To-do list
  - Activity summary (logs)
- Input structure:
  - **Structured data (SoT)**: Entered directly in the WebApp.
  - **Semi-structured data**: Auto-generated locally → Ingested into WebApp.
  - **Notion**: Secondary (viewer/backup/summary sharing only).

## 1.2 Non-Goals (MVP Exclusions)

- Do not include failure logs in progress calculation.
- No full Notion synchronization.
- Do not support all experiment log formats (support 1–2 formats initially).

---

# 2. Core UX & Data Flow

## 2.1 Dashboard Page

- Summary cards:
  - Total / In Progress / Completed / On Hold / Stopped / Discarded
  - Number of delayed tasks
- Monthly Gantt:
  - Idea → Expand → Phase → Task
- Progress:
  - Percentage + evidence links (completed Tasks/Deliverables)
- Priority & To-do:
  - Main research first
  - Task importance + deadline-based ranking
- Activity Feed:
  - Auto-summarized recent UpdateLogs (daily reports, commits, experiments)

## 2.2 Idea Detail Page

- Plan:
  - Phase / Task / Deliverable / Dependencies
- Logs:
  - Timeline of UpdateLogs + attachments
- Evidence:
  - Files / links / experiment runs
- Risks:
  - Rule-based + AI-suggested
- Next Actions:
  - AI-recommended (3–7 items)

---

# 3. Input Rules

## 3.1 Structured Input (WebApp Only)

Must be entered inside the application:

- Idea:
  - Title
  - main_topic_flag
  - Status
  - Start/Target Month
  - Tags
- Phase / Task / Deliverable:
  - Month-based schedule
  - Dependencies
  - Importance
  - Status
- Priority Inputs:
  - impact / effort / risk / urgency
  - main research weighting

## 3.2 Semi-Structured Ingestion (Local → WebApp)

- UpdateLog:
  - Markdown daily reports
  - Header-based section parsing
- Optional:
  - Git log export (linked to UpdateLog)
  - CSV/JSON experiment logs → Metrics ingestion (P1)

---

# 4. Data Model (Multi-Tenant Ready)

## 4.1 Global Rules

- Every table includes `workspace_id`.
- Audit logs required for critical updates.

## 4.2 Core Tables

### workspaces
- id
- name
- created_at

### users
- id
- email
- password_hash
- created_at

### workspace_members
- workspace_id
- user_id
- role (owner/editor/viewer/approver)

### ideas
- id
- workspace_id
- title
- description
- status (예정, 진행 중, 완료, 보류, 중단, 폐기)
- main_topic_flag
- start_month (YYYY-MM)
- target_month (YYYY-MM)
- priority_inputs (impact/effort/risk/urgency)
- created_at
- updated_at

### phases
- id
- workspace_id
- idea_id
- title
- start_month
- end_month
- order_index

### tasks
- id
- workspace_id
- idea_id
- phase_id
- title
- status
- importance (1–5)
- start_month
- end_month
- due_month
- dependencies (task_id list)
- updated_at

### deliverables
- id
- workspace_id
- idea_id
- title
- type (RTL, Verification, Paper, Prototype, Report, Other)
- due_month
- status
- link

### update_logs
- id
- workspace_id
- idea_id
- source (manual/upload/daily_report/git/experiment)
- title
- body_md
- ai_summary
- ai_tags
- ai_risk_flags
- evidence_refs
- created_at

### attachments
- id
- workspace_id
- idea_id
- storage_key
- filename
- mime
- size
- uploaded_at

### metrics (P1)
- id
- workspace_id
- idea_id
- name
- value
- unit
- ts
- source

### audit_logs
- id
- workspace_id
- actor_user_id
- entity_type
- entity_id
- action
- before_json
- after_json
- timestamp

---

# 5. Progress Calculation

## 5.1 Formula
idea_progress = 0.7 * task_completion + 0.3 * deliverable_completion

- task_completion = done_tasks / total_tasks (excluding discarded)
- deliverable_completion = done_deliverables / total_deliverables
- Failure logs are NOT counted.

## 5.2 Status Display Rules

- 예정 → progress = 0
- 보류/중단/폐기 → calculated but grouped separately

---

# 6. Priority Model

## 6.1 Idea Score

S = W_main * main_topic_flag

-wI * impact
-wU * urgency
-wR * risk
-wE * effort


## 6.2 Task Score
-T = w_due * due_proximity
-w_imp * importance
-w_blocker * blocked_flag


MVP: weights hard-coded.

---

# 7. Risk Detection

## 7.1 Rule-Based

- due_month < current_month AND status != 완료 → Delayed
- No UpdateLog in 14 days AND status == 진행 중 → Low Activity
- Dependency incomplete but child running → Dependency Violation

## 7.2 AI-Based (P1)

- Detect blocker sentences in summaries
- Recommend next actions (no auto-modification)

---

# 8. Ingestion Design

## 8.1 MVP

- Drag-and-drop Markdown upload
- Store full content in update_logs.body_md
- Generate summary asynchronously

## 8.2 Parser Policy

- Header-based Markdown section detection
- Extract commit hashes (if present)
- Store raw file unchanged

---

# 9. AI Agents

## 9.1 SummarizerAgent

Input:
- update_log.body_md

Output:
- 5-line summary
- tags
- optional evidence references

## 9.2 RiskAgent

Input:
- update_logs
- task due states

Output:
- risk flags (recommendation only)

## 9.3 NextActionAgent

Input:
- plan structure
- recent summaries

Output:
- 3–7 recommended actions

Approval required for:
- schedule changes
- priority changes
- status changes

---

# 10. API (FastAPI)

## Auth

- POST /auth/login
- GET /me

## CRUD

- /ideas
- /ideas/{id}
- /ideas/{id}/phases
- /ideas/{id}/tasks
- /ideas/{id}/deliverables
- /ideas/{id}/update_logs
- /attachments

## Dashboard

- GET /dashboard/overview?month=YYYY-MM

## Ingestion

- POST /ingest/daily_report

---

# 11. Queue (Redis)

Jobs:
- job_summarize_update_log
- job_extract_commits
- job_parse_experiment_metrics

- Retry logic with idempotency key.

---

# 12. Storage Rules
- /{workspace_id}/{idea_id}/{year}/{month}/{filename}
- Workspace prefix mandatory.

---

# 13. Deployment & Mobile

- Stack: Next.js + FastAPI + Postgres + Redis + S3
- MVP: Single VPS or managed services
- Mobile:
  - Phase 1: PWA
  - Phase 2: Capacitor Android wrapper

---

# 14. Multi-Tenant Readiness

- workspace_id in all tables
- workspace-member mapping
- storage isolation
- quota-ready
- audit logs mandatory

---

# 15. MVP Scope

## P0

- CRUD
- Monthly Gantt
- Dashboard aggregation
- Markdown ingestion
- SummarizerAgent

## P1

- RiskAgent
- NextActionAgent
- Metric parsing
- Git export linkage

---

# 16. Confirmed Decisions (2026-02-16)

## 16.1 Unified Status Enum (Idea/Task)
- Internal codes: `planned`, `in_progress`, `completed`, `on_hold`, `stopped`, `discarded`
- Korean labels: `예정`, `진행중`, `완료`, `보류`, `중단`, `폐기`

## 16.2 Gantt Window Policy
- Policy: fixed 12 months per selected year
- Example: 2026 view = `2026-01` .. `2026-12`

## 16.3 AI Budget Policy
- Monthly budget cap: **up to USD 20**
- MVP AI scope: SummarizerAgent only
- P1 AI scope: RiskAgent, NextActionAgent

## 16.4 Personal Usage Authorization
- Primary mode: single owner (private)
- Optional mode: viewer-only sharing
- Authentication: password-based login (JWT session)
