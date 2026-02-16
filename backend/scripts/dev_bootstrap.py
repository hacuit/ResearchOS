from pathlib import Path

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import Idea
from app.services import bulk_ingest_reports, ensure_owner_context, import_seed


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        user, workspace, _ = ensure_owner_context(db)

        seed_path = Path("../seed/mvp_seed_plan_2026.json")
        imported_ideas, imported_tasks, imported_deliverables = import_seed(db, workspace.id, seed_path)
        print("seed:", imported_ideas, imported_tasks, imported_deliverables)

        first_idea = db.scalar(select(Idea).where(Idea.workspace_id == workspace.id).order_by(Idea.created_at.asc()))
        if not first_idea:
            print("no ideas found after seed")
            return

        reports_dir = Path("C:/Research/07_reports")
        imported_logs = bulk_ingest_reports(db, workspace.id, first_idea.id, reports_dir, "Daily_Report_2026-*.md")
        print("bulk_reports:", imported_logs)
        print("owner_email:", user.email)
        print("workspace:", workspace.name)


if __name__ == "__main__":
    main()
