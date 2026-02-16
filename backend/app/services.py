from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
import json
import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .enums import DeliverableStatus, ItemStatus
from .models import Deliverable, Idea, Task, UpdateLog, User, Workspace, WorkspaceMember
from .schemas import PriorityInputs
from .security import hash_password, verify_password


def _local_summarize_markdown(body_md: str) -> tuple[str, list[str]]:
    lines = [line.strip() for line in body_md.splitlines() if line.strip()]

    # Collect completed and in-progress items, skip generic section headings
    completed: list[str] = []
    in_progress: list[str] = []
    for line in lines:
        if line.startswith("- [x]"):
            text = line[5:].strip().strip("*").strip()
            if len(text.split()) >= 2 or len(text) > 20:
                completed.append(text)
        elif line.startswith("- [/]") or line.startswith("- [ ]"):
            text = line[5:].strip().strip("*").strip()
            if len(text.split()) >= 2 or len(text) > 20:
                in_progress.append(text)

    parts: list[str] = []
    if completed:
        items = "; ".join(completed[:4])
        parts.append(f"Completed ({len(completed)}): {items}")
    if in_progress:
        items = "; ".join(in_progress[:3])
        parts.append(f"In progress: {items}")

    if parts:
        summary = " | ".join(parts)
    else:
        bullet_lines = [line for line in lines if line.startswith("- ")][:5]
        summary = "\n".join(bullet_lines) if bullet_lines else "\n".join(lines[:5])

    tags: list[str] = []
    lowered = body_md.lower()
    if "rtl" in lowered:
        tags.append("rtl")
    if "simulation" in lowered:
        tags.append("simulation")
    if "debug" in lowered:
        tags.append("debug")
    if "vivado" in lowered:
        tags.append("vivado")
    if "matlab" in lowered:
        tags.append("matlab")
    return summary[:1200], tags[:5]


def summarize_markdown(body_md: str) -> tuple[str, list[str]]:
    if not settings.openai_api_key:
        return _local_summarize_markdown(body_md)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.responses.create(
            model=settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You summarize research logs. Return plain text only.\n"
                        "Format:\n"
                        "SUMMARY:\n"
                        "- line 1\n- line 2\n- line 3\n- line 4\n- line 5\n"
                        "TAGS: tag1, tag2, tag3"
                    ),
                },
                {"role": "user", "content": body_md[:15000]},
            ],
            max_output_tokens=300,
        )
        output_text = (response.output_text or "").strip()
        if not output_text:
            return _local_summarize_markdown(body_md)

        lines = [line.strip() for line in output_text.splitlines() if line.strip()]
        summary_lines = [line for line in lines if line.startswith("- ")][:5]
        if not summary_lines:
            summary_lines = lines[:5]
        summary = "\n".join(summary_lines)[:1200]

        tags: list[str] = []
        for line in lines:
            if line.lower().startswith("tags:"):
                raw = line.split(":", 1)[1]
                tags = [item.strip().lower() for item in raw.split(",") if item.strip()]
                break
        if not tags:
            _, tags = _local_summarize_markdown(body_md)

        return summary, tags[:5]
    except Exception:
        return _local_summarize_markdown(body_md)


def extract_report_date(filename: str) -> datetime | None:
    match = re.search(r"(\d{4}-\d{2}-\d{2})", filename)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y-%m-%d")


def ensure_owner_context(db: Session) -> tuple[User, Workspace, WorkspaceMember]:
    user = db.scalar(select(User).where(User.email == settings.owner_email))
    if not user:
        user = User(email=settings.owner_email, password_hash=hash_password(settings.owner_password))
        db.add(user)
        db.flush()
    elif not verify_password(settings.owner_password, user.password_hash):
        user.password_hash = hash_password(settings.owner_password)
        db.add(user)
        db.flush()

    workspace = db.scalar(select(Workspace).where(Workspace.name == settings.owner_workspace_name))
    if not workspace:
        workspace = Workspace(name=settings.owner_workspace_name)
        db.add(workspace)
        db.flush()

    member = db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if not member:
        member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
        db.add(member)
        db.flush()

    db.commit()
    return user, workspace, member


def is_delayed(task: Task, current_month: str) -> bool:
    return task.due_month < current_month and task.status != ItemStatus.COMPLETED.value


def low_activity_task_count(db: Session, workspace_id: str) -> int:
    cutoff = datetime.utcnow() - timedelta(days=14)

    active_tasks = db.scalars(
        select(Task).where(Task.workspace_id == workspace_id, Task.status == ItemStatus.IN_PROGRESS.value)
    ).all()
    if not active_tasks:
        return 0

    active_idea_ids = {task.idea_id for task in active_tasks}
    recent_idea_ids = set(
        db.scalars(
            select(UpdateLog.idea_id)
            .where(UpdateLog.workspace_id == workspace_id, UpdateLog.created_at >= cutoff)
            .distinct()
        ).all()
    )

    return sum(1 for task in active_tasks if task.idea_id in active_idea_ids and task.idea_id not in recent_idea_ids)


def import_seed(db: Session, workspace_id: str, seed_path: Path) -> tuple[int, int, int]:
    data = json.loads(seed_path.read_text(encoding="utf-8-sig"))

    idea_slug_map: dict[str, str] = {}
    imported_ideas = 0
    imported_tasks = 0
    imported_deliverables = 0

    for item in data.get("ideas", []):
        existing = db.scalar(
            select(Idea).where(Idea.workspace_id == workspace_id, Idea.title == item["title"])
        )
        if existing:
            idea_slug_map[item["slug"]] = existing.id
            continue

        priority = PriorityInputs(**item["priority_inputs"])
        idea = Idea(
            workspace_id=workspace_id,
            title=item["title"],
            description=f"Imported from {item.get('source_file', 'seed')}",
            status=ItemStatus(item["status"]).value,
            main_topic_flag=item.get("main_topic_flag", False),
            start_month=item["start_month"],
            target_month=item["target_month"],
            priority_inputs=priority.model_dump(),
        )
        db.add(idea)
        db.flush()
        idea_slug_map[item["slug"]] = idea.id
        imported_ideas += 1

    for item in data.get("tasks", []):
        idea_id = idea_slug_map.get(item["idea_slug"])
        if not idea_id:
            continue

        exists = db.scalar(
            select(Task).where(Task.workspace_id == workspace_id, Task.idea_id == idea_id, Task.title == item["title"])
        )
        if exists:
            continue

        task = Task(
            workspace_id=workspace_id,
            idea_id=idea_id,
            title=item["title"],
            status=ItemStatus(item["status"]).value,
            importance=item["importance"],
            start_month=item["start_month"],
            end_month=item["end_month"],
            due_month=item["due_month"],
            dependencies=item.get("dependencies", []),
        )
        db.add(task)
        imported_tasks += 1

    for item in data.get("deliverables", []):
        idea_id = idea_slug_map.get(item["idea_slug"])
        if not idea_id:
            continue

        exists = db.scalar(
            select(Deliverable).where(
                Deliverable.workspace_id == workspace_id,
                Deliverable.idea_id == idea_id,
                Deliverable.title == item["title"],
            )
        )
        if exists:
            continue

        deliverable = Deliverable(
            workspace_id=workspace_id,
            idea_id=idea_id,
            title=item["title"],
            type=item["type"],
            due_month=item["due_month"],
            status=DeliverableStatus(item["status"]).value,
        )
        db.add(deliverable)
        imported_deliverables += 1

    db.commit()
    return imported_ideas, imported_tasks, imported_deliverables


def bulk_ingest_reports(
    db: Session,
    workspace_id: str,
    idea_id: str,
    reports_path: Path,
    pattern: str = "Daily_Report_2026-*.md",
) -> int:
    imported = 0
    for report_path in sorted(reports_path.glob(pattern)):
        title = report_path.name
        exists = db.scalar(
            select(UpdateLog).where(
                UpdateLog.workspace_id == workspace_id,
                UpdateLog.idea_id == idea_id,
                UpdateLog.title == title,
            )
        )
        if exists:
            continue

        body_md = report_path.read_text(encoding="utf-8", errors="replace")
        summary, tags = summarize_markdown(body_md)
        created_at = extract_report_date(title) or datetime.utcnow()

        log = UpdateLog(
            workspace_id=workspace_id,
            idea_id=idea_id,
            source="daily_report",
            title=title,
            body_md=body_md,
            ai_summary=summary,
            ai_tags=tags,
            ai_risk_flags=[],
            created_at=created_at,
        )
        db.add(log)
        imported += 1

    db.commit()
    return imported


def dashboard_counts(db: Session, workspace_id: str, month: str) -> tuple[dict[str, int], int, int, int]:
    status_counts = {status.value: 0 for status in ItemStatus}

    status_rows = db.execute(
        select(Idea.status, func.count(Idea.id)).where(Idea.workspace_id == workspace_id).group_by(Idea.status)
    ).all()
    for status, count in status_rows:
        if status in status_counts:
            status_counts[status] = count

    total_ideas = sum(status_counts.values())

    tasks = db.scalars(select(Task).where(Task.workspace_id == workspace_id)).all()
    delayed = sum(1 for task in tasks if is_delayed(task, month))
    low_activity = low_activity_task_count(db, workspace_id)
    return status_counts, total_ideas, delayed, low_activity


def compute_idea_progress(db: Session, workspace_id: str, idea_id: str) -> tuple[float, float, float]:
    tasks = db.scalars(select(Task).where(Task.workspace_id == workspace_id, Task.idea_id == idea_id)).all()
    deliverables = db.scalars(
        select(Deliverable).where(Deliverable.workspace_id == workspace_id, Deliverable.idea_id == idea_id)
    ).all()

    task_pool = [t for t in tasks if t.status != ItemStatus.DISCARDED.value]
    completed_tasks = [t for t in task_pool if t.status == ItemStatus.COMPLETED.value]
    task_completion = (len(completed_tasks) / len(task_pool)) if task_pool else 0.0

    completed_deliverables = [d for d in deliverables if d.status == DeliverableStatus.COMPLETED.value]
    deliverable_completion = (len(completed_deliverables) / len(deliverables)) if deliverables else 0.0

    progress = 0.7 * task_completion + 0.3 * deliverable_completion
    return round(task_completion, 4), round(deliverable_completion, 4), round(progress, 4)


def detect_risks(db: Session, workspace_id: str, idea_id: str, month: str) -> list[dict]:
    risks: list[dict] = []
    tasks = db.scalars(select(Task).where(Task.workspace_id == workspace_id, Task.idea_id == idea_id)).all()
    logs = db.scalars(select(UpdateLog).where(UpdateLog.workspace_id == workspace_id, UpdateLog.idea_id == idea_id)).all()

    for task in tasks:
        if task.due_month < month and task.status != ItemStatus.COMPLETED.value:
            risks.append(
                {
                    "code": "DELAYED",
                    "severity": "high",
                    "message": f"Task is delayed: {task.title}",
                    "related_entity": "task",
                    "related_id": task.id,
                }
            )

    latest_log_at = max([l.created_at for l in logs], default=None)
    if latest_log_at and latest_log_at < datetime.utcnow() - timedelta(days=14):
        risks.append(
            {
                "code": "LOW_ACTIVITY",
                "severity": "medium",
                "message": "No update log in last 14 days",
                "related_entity": "idea",
                "related_id": idea_id,
            }
        )
    elif not latest_log_at:
        risks.append(
            {
                "code": "NO_LOG",
                "severity": "medium",
                "message": "No update logs found for this idea",
                "related_entity": "idea",
                "related_id": idea_id,
            }
        )

    task_status_map = {t.id: t.status for t in tasks}
    for task in tasks:
        for dep in task.dependencies:
            dep_status = task_status_map.get(dep)
            if dep_status and dep_status != ItemStatus.COMPLETED.value and task.status == ItemStatus.IN_PROGRESS.value:
                risks.append(
                    {
                        "code": "DEPENDENCY_VIOLATION",
                        "severity": "medium",
                        "message": f"Dependency incomplete while task in progress: {task.title}",
                        "related_entity": "task",
                        "related_id": task.id,
                    }
                )
                break

    # Deduplicate by code+related_id
    unique = {}
    for item in risks:
        key = f"{item['code']}:{item.get('related_id')}"
        unique[key] = item
    return list(unique.values())


def recommend_next_actions(db: Session, workspace_id: str, idea_id: str, month: str) -> list[str]:
    actions: list[str] = []
    tasks = db.scalars(select(Task).where(Task.workspace_id == workspace_id, Task.idea_id == idea_id)).all()
    deliverables = db.scalars(
        select(Deliverable).where(Deliverable.workspace_id == workspace_id, Deliverable.idea_id == idea_id)
    ).all()

    in_progress = [t for t in tasks if t.status == ItemStatus.IN_PROGRESS.value]
    planned = [t for t in tasks if t.status == ItemStatus.PLANNED.value]
    delayed = [t for t in tasks if t.due_month < month and t.status != ItemStatus.COMPLETED.value]

    if delayed:
        actions.append(f"Resolve delayed task first: {delayed[0].title}")
    if in_progress:
        actions.append(f"Close current in-progress task: {in_progress[0].title}")
    if planned:
        actions.append(f"Start highest-priority planned task: {planned[0].title}")

    pending_deliverables = [d for d in deliverables if d.status != DeliverableStatus.COMPLETED.value]
    if pending_deliverables:
        nearest = sorted(pending_deliverables, key=lambda d: d.due_month)[0]
        actions.append(f"Prepare deliverable for due month {nearest.due_month}: {nearest.title}")

    if not actions:
        actions.append("No immediate blockers found. Review and set next quarterly target.")

    return actions[:7]
