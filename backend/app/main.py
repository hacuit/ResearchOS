from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, SessionLocal, engine, get_db
from .enums import ItemStatus
from .models import Deliverable, Idea, Task, UpdateLog, User, WorkspaceMember
from .schemas import (
    AISettingsResponse,
    BulkIngestResponse,
    DashboardOverview,
    DeliverableCreate,
    DeliverableRead,
    DeliverableUpdate,
    IdeaProgress,
    IdeaCreate,
    IdeaRead,
    IdeaUpdate,
    LoginRequest,
    LoginResponse,
    SeedImportResponse,
    TaskCreate,
    TaskRead,
    TaskReadWithIdea,
    TaskReorderRequest,
    TaskReorderResponse,
    TaskUpdate,
    NextActionsResponse,
    RiskItem,
    UpdateLogCreate,
    UpdateLogRead,
    UserProfile,
    WorkspaceExportResponse,
)
from .security import create_access_token, decode_access_token, verify_password
from .services import (
    bulk_ingest_reports,
    compute_idea_progress,
    dashboard_counts,
    detect_risks,
    ensure_owner_context,
    import_seed,
    recommend_next_actions,
    summarize_markdown,
)

app = FastAPI(title=settings.app_name, version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer = HTTPBearer(auto_error=False)
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_owner_context(db)


def idea_to_schema(idea: Idea) -> IdeaRead:
    return IdeaRead(
        id=idea.id,
        workspace_id=idea.workspace_id,
        title=idea.title,
        description=idea.description,
        status=idea.status,
        main_topic_flag=idea.main_topic_flag,
        start_month=idea.start_month,
        target_month=idea.target_month,
        priority_inputs=idea.priority_inputs,
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


def task_to_schema(task: Task) -> TaskRead:
    return TaskRead(
        id=task.id,
        workspace_id=task.workspace_id,
        idea_id=task.idea_id,
        title=task.title,
        status=task.status,
        importance=task.importance,
        start_month=task.start_month,
        end_month=task.end_month,
        due_month=task.due_month,
        dependencies=task.dependencies,
        sort_order=task.sort_order,
        updated_at=task.updated_at,
    )


def log_to_schema(log: UpdateLog) -> UpdateLogRead:
    return UpdateLogRead(
        id=log.id,
        workspace_id=log.workspace_id,
        idea_id=log.idea_id,
        source=log.source,
        title=log.title,
        body_md=log.body_md,
        ai_summary=log.ai_summary,
        ai_tags=log.ai_tags,
        ai_risk_flags=log.ai_risk_flags,
        created_at=log.created_at,
    )


def deliverable_to_schema(item: Deliverable) -> DeliverableRead:
    return DeliverableRead(
        id=item.id,
        workspace_id=item.workspace_id,
        idea_id=item.idea_id,
        title=item.title,
        type=item.type,
        due_month=item.due_month,
        status=item.status,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> tuple[User, str]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    member = db.scalar(select(WorkspaceMember).where(WorkspaceMember.user_id == user.id))
    if not member:
        raise HTTPException(status_code=403, detail="No workspace membership")
    return user, member.workspace_id


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return """
    <html>
      <head><title>Research OS API</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Research OS API is running</h2>
        <p>Use these endpoints:</p>
        <ul>
          <li><a href="/docs">/docs</a> (Swagger UI)</li>
          <li><a href="/health">/health</a> (health check)</li>
        </ul>
      </body>
    </html>
    """


@app.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    ensure_owner_context(db)
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return LoginResponse(access_token=token)


@app.get("/me", response_model=UserProfile)
def me(context: tuple[User, str] = Depends(get_current_user), db: Session = Depends(get_db)) -> UserProfile:
    user, workspace_id = context
    member = db.scalar(
        select(WorkspaceMember).where(WorkspaceMember.user_id == user.id, WorkspaceMember.workspace_id == workspace_id)
    )
    role = member.role if member else "viewer"
    return UserProfile(id=user.id, email=user.email, role=role, workspace_id=workspace_id)


@app.get("/dashboard/overview", response_model=DashboardOverview)
def dashboard_overview(
    month: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardOverview:
    _, workspace_id = context
    status_counts, total_ideas, delayed, low_activity = dashboard_counts(db, workspace_id, month)
    return DashboardOverview(
        total_ideas=total_ideas,
        idea_status_counts=status_counts,
        delayed_tasks=delayed,
        low_activity_tasks=low_activity,
    )


@app.get("/ideas", response_model=list[IdeaRead])
def list_ideas(
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[IdeaRead]:
    _, workspace_id = context
    ideas = db.scalars(select(Idea).where(Idea.workspace_id == workspace_id).order_by(Idea.created_at.asc())).all()
    return [idea_to_schema(item) for item in ideas]


@app.post("/ideas", response_model=IdeaRead)
def create_idea(
    payload: IdeaCreate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IdeaRead:
    _, workspace_id = context
    idea = Idea(
        workspace_id=workspace_id,
        title=payload.title,
        description=payload.description,
        status=payload.status.value,
        main_topic_flag=payload.main_topic_flag,
        start_month=payload.start_month,
        target_month=payload.target_month,
        priority_inputs=payload.priority_inputs.model_dump(),
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea_to_schema(idea)


@app.patch("/ideas/{idea_id}", response_model=IdeaRead)
def update_idea(
    idea_id: str,
    payload: IdeaUpdate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IdeaRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    patch = payload.model_dump(exclude_none=True)
    if "status" in patch:
        patch["status"] = payload.status.value  # type: ignore[union-attr]
    if "priority_inputs" in patch and payload.priority_inputs is not None:
        patch["priority_inputs"] = payload.priority_inputs.model_dump()
    for key, value in patch.items():
        setattr(idea, key, value)
    idea.updated_at = datetime.utcnow()
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return idea_to_schema(idea)


@app.delete("/ideas/{idea_id}")
def delete_idea(
    idea_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    db.delete(idea)
    db.commit()
    return {"deleted": True}


@app.get("/ideas/{idea_id}", response_model=IdeaRead)
def get_idea(
    idea_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IdeaRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea_to_schema(idea)


@app.get("/tasks", response_model=list[TaskReadWithIdea])
def list_all_tasks(
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskReadWithIdea]:
    _, workspace_id = context
    tasks = db.scalars(
        select(Task).where(Task.workspace_id == workspace_id).order_by(Task.sort_order.asc(), Task.updated_at.asc())
    ).all()
    idea_ids = {t.idea_id for t in tasks}
    ideas = db.scalars(select(Idea).where(Idea.id.in_(idea_ids))).all() if idea_ids else []
    idea_map = {i.id: i.title for i in ideas}
    result = []
    for t in tasks:
        base = task_to_schema(t)
        result.append(TaskReadWithIdea(**base.model_dump(), idea_title=idea_map.get(t.idea_id, "")))
    return result


@app.get("/ideas/{idea_id}/tasks", response_model=list[TaskRead])
def list_tasks(
    idea_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskRead]:
    _, workspace_id = context
    tasks = db.scalars(
        select(Task).where(Task.workspace_id == workspace_id, Task.idea_id == idea_id).order_by(Task.sort_order.asc(), Task.updated_at.asc())
    ).all()
    return [task_to_schema(item) for item in tasks]


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    _, workspace_id = context
    task = db.scalar(select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"deleted": True}


@app.get("/ideas/{idea_id}/deliverables", response_model=list[DeliverableRead])
def list_deliverables(
    idea_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DeliverableRead]:
    _, workspace_id = context
    items = db.scalars(
        select(Deliverable)
        .where(Deliverable.workspace_id == workspace_id, Deliverable.idea_id == idea_id)
        .order_by(Deliverable.due_month.asc())
    ).all()
    return [deliverable_to_schema(item) for item in items]


@app.post("/ideas/{idea_id}/deliverables", response_model=DeliverableRead)
def create_deliverable(
    idea_id: str,
    payload: DeliverableCreate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeliverableRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    item = Deliverable(
        workspace_id=workspace_id,
        idea_id=idea_id,
        title=payload.title,
        type=payload.type,
        due_month=payload.due_month,
        status=payload.status.value,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return deliverable_to_schema(item)


@app.get("/ideas/{idea_id}/update_logs", response_model=list[UpdateLogRead])
def list_update_logs(
    idea_id: str,
    limit: int = 20,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UpdateLogRead]:
    _, workspace_id = context
    logs = db.scalars(
        select(UpdateLog)
        .where(UpdateLog.workspace_id == workspace_id, UpdateLog.idea_id == idea_id)
        .order_by(UpdateLog.created_at.desc())
        .limit(max(1, min(limit, 100)))
    ).all()
    return [log_to_schema(item) for item in logs]


@app.delete("/deliverables/{deliverable_id}")
def delete_deliverable(
    deliverable_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    _, workspace_id = context
    item = db.scalar(
        select(Deliverable).where(Deliverable.id == deliverable_id, Deliverable.workspace_id == workspace_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


@app.delete("/update_logs/{update_log_id}")
def delete_update_log(
    update_log_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    _, workspace_id = context
    item = db.scalar(select(UpdateLog).where(UpdateLog.id == update_log_id, UpdateLog.workspace_id == workspace_id))
    if not item:
        raise HTTPException(status_code=404, detail="Update log not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


@app.post("/ideas/{idea_id}/tasks", response_model=TaskRead)
def create_task(
    idea_id: str,
    payload: TaskCreate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    task = Task(
        workspace_id=workspace_id,
        idea_id=idea_id,
        title=payload.title,
        status=payload.status.value,
        importance=payload.importance,
        start_month=payload.start_month,
        end_month=payload.end_month,
        due_month=payload.due_month,
        dependencies=payload.dependencies,
        updated_at=datetime.utcnow(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_schema(task)


@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskRead:
    _, workspace_id = context
    task = db.scalar(select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    patch = payload.model_dump(exclude_none=True)
    if "status" in patch:
        patch["status"] = payload.status.value  # type: ignore[union-attr]
    for key, value in patch.items():
        setattr(task, key, value)
    task.updated_at = datetime.utcnow()
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_schema(task)


@app.patch("/tasks/reorder", response_model=TaskReorderResponse)
def reorder_tasks(
    payload: TaskReorderRequest,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskReorderResponse:
    _, workspace_id = context
    for idx, task_id in enumerate(payload.task_ids):
        task = db.scalar(select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id))
        if task:
            task.sort_order = idx
            db.add(task)
    db.commit()
    return TaskReorderResponse(reordered=len(payload.task_ids))


@app.patch("/deliverables/{deliverable_id}", response_model=DeliverableRead)
def update_deliverable(
    deliverable_id: str,
    payload: DeliverableUpdate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeliverableRead:
    _, workspace_id = context
    item = db.scalar(
        select(Deliverable).where(Deliverable.id == deliverable_id, Deliverable.workspace_id == workspace_id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    patch = payload.model_dump(exclude_none=True)
    if "status" in patch:
        patch["status"] = payload.status.value  # type: ignore[union-attr]
    for key, value in patch.items():
        setattr(item, key, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return deliverable_to_schema(item)


@app.get("/ideas/{idea_id}/progress", response_model=IdeaProgress)
def idea_progress(
    idea_id: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IdeaProgress:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    task_completion, deliverable_completion, progress = compute_idea_progress(db, workspace_id, idea_id)
    return IdeaProgress(
        idea_id=idea_id,
        task_completion=task_completion,
        deliverable_completion=deliverable_completion,
        idea_progress=progress,
    )


@app.get("/ideas/{idea_id}/risks", response_model=list[RiskItem])
def idea_risks(
    idea_id: str,
    month: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RiskItem]:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    items = detect_risks(db, workspace_id, idea_id, month)
    return [RiskItem(**item) for item in items]


@app.get("/ideas/{idea_id}/next_actions", response_model=NextActionsResponse)
def idea_next_actions(
    idea_id: str,
    month: str,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NextActionsResponse:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    actions = recommend_next_actions(db, workspace_id, idea_id, month)
    return NextActionsResponse(idea_id=idea_id, actions=actions)


@app.get("/export/workspace", response_model=WorkspaceExportResponse)
def export_workspace(
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkspaceExportResponse:
    _, workspace_id = context
    ideas = db.scalars(select(Idea).where(Idea.workspace_id == workspace_id).order_by(Idea.created_at.asc())).all()
    tasks = db.scalars(select(Task).where(Task.workspace_id == workspace_id).order_by(Task.sort_order.asc(), Task.updated_at.asc())).all()
    deliverables = db.scalars(
        select(Deliverable).where(Deliverable.workspace_id == workspace_id).order_by(Deliverable.due_month.asc())
    ).all()
    logs = db.scalars(select(UpdateLog).where(UpdateLog.workspace_id == workspace_id).order_by(UpdateLog.created_at.desc())).all()
    return WorkspaceExportResponse(
        workspace_id=workspace_id,
        exported_at=datetime.utcnow(),
        ideas=[idea_to_schema(item) for item in ideas],
        tasks=[task_to_schema(item) for item in tasks],
        deliverables=[deliverable_to_schema(item) for item in deliverables],
        update_logs=[log_to_schema(item) for item in logs],
    )


@app.post("/ideas/{idea_id}/update_logs", response_model=UpdateLogRead)
def create_update_log(
    idea_id: str,
    payload: UpdateLogCreate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdateLogRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    summary, tags = summarize_markdown(payload.body_md)
    log = UpdateLog(
        workspace_id=workspace_id,
        idea_id=idea_id,
        source=payload.source,
        title=payload.title,
        body_md=payload.body_md,
        ai_summary=summary,
        ai_tags=tags,
        ai_risk_flags=[],
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log_to_schema(log)


@app.post("/ingest/daily_report", response_model=UpdateLogRead)
async def ingest_daily_report(
    idea_id: str,
    file: UploadFile = File(...),
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdateLogRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    raw = await file.read()
    body_md = raw.decode("utf-8", errors="replace")
    summary, tags = summarize_markdown(body_md)

    created_at = datetime.utcnow()
    if file.filename:
        try:
            created_at = datetime.strptime(file.filename.split("Daily_Report_")[-1].replace(".md", ""), "%Y-%m-%d")
        except ValueError:
            pass

    log = UpdateLog(
        workspace_id=workspace_id,
        idea_id=idea_id,
        source="daily_report",
        title=file.filename or "daily_report.md",
        body_md=body_md,
        ai_summary=summary,
        ai_tags=tags,
        ai_risk_flags=[],
        created_at=created_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log_to_schema(log)


@app.post("/seed/import", response_model=SeedImportResponse)
def seed_import(
    path: str = "../seed/mvp_seed_plan_2026.json",
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SeedImportResponse:
    _, workspace_id = context
    seed_path = Path(path)
    if not seed_path.exists():
        seed_path = (BACKEND_DIR / path).resolve()
    if not seed_path.exists():
        seed_path = (ROOT_DIR / path).resolve()
    if not seed_path.exists():
        raise HTTPException(status_code=404, detail=f"Seed file not found: {seed_path}")

    imported_ideas, imported_tasks, imported_deliverables = import_seed(db, workspace_id, seed_path)
    return SeedImportResponse(
        imported_ideas=imported_ideas,
        imported_tasks=imported_tasks,
        imported_deliverables=imported_deliverables,
    )


@app.post("/ingest/daily_reports/bulk", response_model=BulkIngestResponse)
def ingest_daily_reports_bulk(
    idea_id: str,
    reports_dir: str = settings.reports_dir,
    pattern: str = settings.reports_pattern,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkIngestResponse:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    report_path = Path(reports_dir)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail=f"Reports dir not found: {reports_dir}")

    imported = bulk_ingest_reports(db, workspace_id, idea_id, report_path, pattern)
    return BulkIngestResponse(imported_logs=imported)


@app.get("/settings/sync")
def get_sync_settings(
    context: tuple[User, str] = Depends(get_current_user),
) -> dict[str, str | int]:
    return {
        "reports_dir": settings.reports_dir,
        "reports_pattern": settings.reports_pattern,
        "view_year": datetime.utcnow().year,
    }


@app.post("/ingest/direct_report", response_model=UpdateLogRead)
def ingest_direct_report(
    payload: UpdateLogCreate,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpdateLogRead:
    _, workspace_id = context
    idea = db.scalar(select(Idea).where(Idea.id == payload.idea_id, Idea.workspace_id == workspace_id))
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    # Dedup by title
    exists = db.scalar(
        select(UpdateLog).where(
            UpdateLog.workspace_id == workspace_id,
            UpdateLog.idea_id == payload.idea_id,
            UpdateLog.title == payload.title,
        )
    )
    if exists:
        return log_to_schema(exists)

    summary, tags = summarize_markdown(payload.body_md)
    log = UpdateLog(
        workspace_id=workspace_id,
        idea_id=payload.idea_id,
        source=payload.source or "direct_ingest",
        title=payload.title,
        body_md=payload.body_md,
        ai_summary=summary,
        ai_tags=tags,
        ai_risk_flags=[],
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log_to_schema(log)


@app.get("/settings/ai", response_model=AISettingsResponse)
def ai_settings(
    context: tuple[User, str] = Depends(get_current_user),
) -> AISettingsResponse:
    """Check OpenAI API configuration and connectivity status."""
    _ = context  # auth required
    key = settings.openai_api_key
    model = settings.openai_model
    budget = settings.ai_monthly_budget_usd

    if not key:
        return AISettingsResponse(
            configured=False,
            model=model,
            status="inactive",
            message="No API key configured. Using local fallback summarization.",
            monthly_budget_usd=budget,
        )

    # Validate key by making a lightweight API call
    try:
        import openai

        client = openai.OpenAI(api_key=key)
        client.models.list()
        return AISettingsResponse(
            configured=True,
            model=model,
            status="active",
            message="OpenAI API is connected and working.",
            monthly_budget_usd=budget,
        )
    except Exception as exc:
        return AISettingsResponse(
            configured=True,
            model=model,
            status="error",
            message=f"API key set but validation failed: {exc}",
            monthly_budget_usd=budget,
        )


@app.get("/update_logs", response_model=list[UpdateLogRead])
def list_update_logs(
    limit: int = 50,
    offset: int = 0,
    idea_id: str | None = None,
    source: str | None = None,
    context: tuple[User, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UpdateLogRead]:
    """List workspace-wide update logs with optional filters."""
    _, workspace_id = context
    q = select(UpdateLog).where(UpdateLog.workspace_id == workspace_id)
    if idea_id:
        q = q.where(UpdateLog.idea_id == idea_id)
    if source:
        q = q.where(UpdateLog.source == source)
    q = q.order_by(UpdateLog.created_at.desc()).offset(offset).limit(limit)
    logs = db.scalars(q).all()
    return [log_to_schema(log) for log in logs]
