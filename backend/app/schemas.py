from datetime import datetime

from pydantic import BaseModel, Field

from .enums import DeliverableStatus, ItemStatus


class PriorityInputs(BaseModel):
    impact: int = Field(ge=1, le=5)
    effort: int = Field(ge=1, le=5)
    risk: int = Field(ge=1, le=5)
    urgency: int = Field(ge=1, le=5)


class IdeaBase(BaseModel):
    title: str
    description: str = ""
    status: ItemStatus = ItemStatus.PLANNED
    main_topic_flag: bool = False
    start_month: str
    target_month: str
    priority_inputs: PriorityInputs


class IdeaCreate(IdeaBase):
    pass


class IdeaRead(IdeaBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime


class IdeaUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: ItemStatus | None = None
    main_topic_flag: bool | None = None
    start_month: str | None = None
    target_month: str | None = None
    priority_inputs: PriorityInputs | None = None


class TaskBase(BaseModel):
    title: str
    status: ItemStatus = ItemStatus.PLANNED
    importance: int = Field(default=3, ge=1, le=5)
    start_month: str
    end_month: str
    due_month: str
    dependencies: list[str] = Field(default_factory=list)


class TaskCreate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: str
    workspace_id: str
    idea_id: str
    sort_order: int = 0
    updated_at: datetime


class TaskReadWithIdea(TaskRead):
    idea_title: str = ""


class TaskUpdate(BaseModel):
    title: str | None = None
    status: ItemStatus | None = None
    importance: int | None = Field(default=None, ge=1, le=5)
    start_month: str | None = None
    end_month: str | None = None
    due_month: str | None = None


class DeliverableBase(BaseModel):
    title: str
    type: str
    due_month: str
    status: DeliverableStatus = DeliverableStatus.PLANNED


class DeliverableRead(DeliverableBase):
    id: str
    workspace_id: str
    idea_id: str


class DeliverableCreate(DeliverableBase):
    pass


class DeliverableUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    due_month: str | None = None
    status: DeliverableStatus | None = None


class UpdateLogCreate(BaseModel):
    source: str = "manual"
    title: str
    body_md: str
    idea_id: str = ""


class TaskReorderRequest(BaseModel):
    task_ids: list[str]


class TaskReorderResponse(BaseModel):
    reordered: int


class UpdateLogRead(BaseModel):
    id: str
    workspace_id: str
    idea_id: str
    source: str
    title: str
    body_md: str
    ai_summary: str | None = None
    ai_tags: list[str] = Field(default_factory=list)
    ai_risk_flags: list[str] = Field(default_factory=list)
    created_at: datetime


class DashboardOverview(BaseModel):
    total_ideas: int
    idea_status_counts: dict[str, int]
    delayed_tasks: int
    low_activity_tasks: int


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    email: str
    role: str
    workspace_id: str


class SeedImportResponse(BaseModel):
    imported_ideas: int
    imported_tasks: int
    imported_deliverables: int


class BulkIngestResponse(BaseModel):
    imported_logs: int


class IdeaProgress(BaseModel):
    idea_id: str
    task_completion: float
    deliverable_completion: float
    idea_progress: float


class RiskItem(BaseModel):
    code: str
    severity: str
    message: str
    related_entity: str | None = None
    related_id: str | None = None


class NextActionsResponse(BaseModel):
    idea_id: str
    actions: list[str]


class WorkspaceExportResponse(BaseModel):
    workspace_id: str
    exported_at: datetime
    ideas: list[IdeaRead]
    tasks: list[TaskRead]
    deliverables: list[DeliverableRead]
    update_logs: list[UpdateLogRead]
