from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def main() -> None:
    with TestClient(app) as client:
        login = client.post(
            "/auth/login",
            json={"email": settings.owner_email, "password": settings.owner_password},
        )
        if login.status_code != 200:
            raise SystemExit(f"login failed: {login.status_code} {login.text}")

        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        seed = client.post("/seed/import?path=../seed/mvp_seed_plan_2026.json", headers=headers)
        if seed.status_code != 200:
            raise SystemExit(f"seed import failed: {seed.status_code} {seed.text}")

        ideas = client.get("/ideas", headers=headers)
        if ideas.status_code != 200 or not ideas.json():
            raise SystemExit(f"ideas fetch failed: {ideas.status_code} {ideas.text}")

        idea_id = ideas.json()[0]["id"]
        bulk = client.post(
            f"/ingest/daily_reports/bulk?idea_id={idea_id}&reports_dir=C:/Research/07_reports",
            headers=headers,
        )
        if bulk.status_code != 200:
            raise SystemExit(f"bulk ingest failed: {bulk.status_code} {bulk.text}")

        dashboard = client.get("/dashboard/overview?month=2026-02", headers=headers)
        if dashboard.status_code != 200:
            raise SystemExit(f"dashboard failed: {dashboard.status_code} {dashboard.text}")

        progress = client.get(f"/ideas/{idea_id}/progress", headers=headers)
        if progress.status_code != 200:
            raise SystemExit(f"progress failed: {progress.status_code} {progress.text}")

        risks = client.get(f"/ideas/{idea_id}/risks?month=2026-02", headers=headers)
        if risks.status_code != 200:
            raise SystemExit(f"risks failed: {risks.status_code} {risks.text}")

        actions = client.get(f"/ideas/{idea_id}/next_actions?month=2026-02", headers=headers)
        if actions.status_code != 200:
            raise SystemExit(f"next_actions failed: {actions.status_code} {actions.text}")

        export = client.get("/export/workspace", headers=headers)
        if export.status_code != 200:
            raise SystemExit(f"export failed: {export.status_code} {export.text}")

        print("smoke_ok")
        print("seed:", seed.json())
        print("bulk:", bulk.json())
        print("dashboard:", dashboard.json())
        print("progress:", progress.json())
        print("risks:", len(risks.json()))
        print("next_actions:", actions.json())


if __name__ == "__main__":
    main()
