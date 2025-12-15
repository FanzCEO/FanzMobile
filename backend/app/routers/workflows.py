"""
WickedCRM Workflows Router
Automation workflows for CRM tasks.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])


# ============== DATA MODELS ==============

TriggerType = Literal[
    "on_message",
    "on_contact_created",
    "on_contact_updated",
    "before_event",
    "after_event",
    "on_schedule",
    "on_tag_added",
    "on_payment"
]

ActionType = Literal[
    "send_message",
    "add_tag",
    "remove_tag",
    "create_task",
    "send_notification",
    "update_contact",
    "trigger_webhook",
    "ai_process"
]


class WorkflowAction(BaseModel):
    type: ActionType
    config: dict = {}


class WorkflowCondition(BaseModel):
    field: str
    operator: str  # "equals", "contains", "greater_than", etc.
    value: str


class Workflow(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    trigger: TriggerType
    conditions: List[WorkflowCondition] = []
    actions: List[WorkflowAction] = []
    enabled: bool = True
    run_count: int = 0
    last_run: Optional[str] = None
    created_at: str
    updated_at: str


class CreateWorkflowRequest(BaseModel):
    name: str
    description: str
    trigger: TriggerType
    conditions: List[WorkflowCondition] = []
    actions: List[WorkflowAction] = []
    enabled: bool = True


class UpdateWorkflowRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[TriggerType] = None
    conditions: Optional[List[WorkflowCondition]] = None
    actions: Optional[List[WorkflowAction]] = None
    enabled: Optional[bool] = None


class WorkflowLog(BaseModel):
    id: str
    workflow_id: str
    status: Literal["success", "failed", "skipped"]
    trigger_data: dict
    actions_executed: List[str]
    error_message: Optional[str] = None
    executed_at: str


# ============== IN-MEMORY STORAGE ==============

workflows_db: List[Workflow] = [
    Workflow(
        id="wf-001",
        user_id="user-1",
        name="Auto-confirm meetings",
        description="Automatically send confirmation when meeting is detected in messages",
        trigger="on_message",
        conditions=[
            WorkflowCondition(field="ai_result.meeting_detected", operator="equals", value="true")
        ],
        actions=[
            WorkflowAction(type="send_message", config={"template": "meeting_confirmation"}),
            WorkflowAction(type="create_task", config={"title": "Follow up on meeting"})
        ],
        enabled=True,
        run_count=24,
        last_run=datetime.now().isoformat(),
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Workflow(
        id="wf-002",
        user_id="user-1",
        name="Tag VIP contacts",
        description="Add VIP tag to contacts with high importance score",
        trigger="on_contact_created",
        conditions=[
            WorkflowCondition(field="importance", operator="greater_than", value="8")
        ],
        actions=[
            WorkflowAction(type="add_tag", config={"tag": "VIP"}),
            WorkflowAction(type="send_notification", config={"message": "New VIP contact added"})
        ],
        enabled=True,
        run_count=12,
        last_run=datetime.now().isoformat(),
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Workflow(
        id="wf-003",
        user_id="user-1",
        name="Send follow-up reminders",
        description="Send reminder 1 hour before scheduled events",
        trigger="before_event",
        conditions=[],
        actions=[
            WorkflowAction(type="send_message", config={"template": "event_reminder", "timing": "-1h"})
        ],
        enabled=False,
        run_count=0,
        last_run=None,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Workflow(
        id="wf-004",
        user_id="user-1",
        name="AI Message Processing",
        description="Automatically analyze incoming messages with AI for intent and entities",
        trigger="on_message",
        conditions=[
            WorkflowCondition(field="direction", operator="equals", value="inbound")
        ],
        actions=[
            WorkflowAction(type="ai_process", config={"extract_entities": True, "detect_intent": True})
        ],
        enabled=True,
        run_count=156,
        last_run=datetime.now().isoformat(),
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
]

workflow_logs_db: List[WorkflowLog] = [
    WorkflowLog(
        id="log-001",
        workflow_id="wf-001",
        status="success",
        trigger_data={"message_id": "msg-001", "contact": "Sarah"},
        actions_executed=["send_message", "create_task"],
        executed_at=datetime.now().isoformat()
    ),
    WorkflowLog(
        id="log-002",
        workflow_id="wf-004",
        status="success",
        trigger_data={"message_id": "msg-002"},
        actions_executed=["ai_process"],
        executed_at=datetime.now().isoformat()
    ),
]


# ============== ROUTES ==============

@router.get("")
async def get_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    enabled: Optional[bool] = None,
    trigger: Optional[str] = None
) -> List[Workflow]:
    """Get all workflows with optional filtering."""
    filtered = workflows_db

    if enabled is not None:
        filtered = [w for w in filtered if w.enabled == enabled]

    if trigger:
        filtered = [w for w in filtered if w.trigger == trigger]

    return filtered[skip:skip + limit]


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str) -> Workflow:
    """Get a specific workflow by ID."""
    for wf in workflows_db:
        if wf.id == workflow_id:
            return wf
    raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("")
async def create_workflow(request: CreateWorkflowRequest) -> Workflow:
    """Create a new workflow."""
    now = datetime.now().isoformat()
    new_workflow = Workflow(
        id=f"wf-{uuid.uuid4().hex[:8]}",
        user_id="user-1",
        name=request.name,
        description=request.description,
        trigger=request.trigger,
        conditions=request.conditions,
        actions=request.actions,
        enabled=request.enabled,
        run_count=0,
        last_run=None,
        created_at=now,
        updated_at=now
    )

    workflows_db.insert(0, new_workflow)
    return new_workflow


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, request: UpdateWorkflowRequest) -> Workflow:
    """Update a workflow."""
    for wf in workflows_db:
        if wf.id == workflow_id:
            if request.name is not None:
                wf.name = request.name
            if request.description is not None:
                wf.description = request.description
            if request.trigger is not None:
                wf.trigger = request.trigger
            if request.conditions is not None:
                wf.conditions = request.conditions
            if request.actions is not None:
                wf.actions = request.actions
            if request.enabled is not None:
                wf.enabled = request.enabled
            wf.updated_at = datetime.now().isoformat()
            return wf

    raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("/{workflow_id}/toggle")
async def toggle_workflow(workflow_id: str) -> Workflow:
    """Toggle workflow enabled/disabled."""
    for wf in workflows_db:
        if wf.id == workflow_id:
            wf.enabled = not wf.enabled
            wf.updated_at = datetime.now().isoformat()
            return wf

    raise HTTPException(status_code=404, detail="Workflow not found")


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    global workflows_db
    for i, wf in enumerate(workflows_db):
        if wf.id == workflow_id:
            workflows_db.pop(i)
            return {"status": "deleted", "id": workflow_id}
    raise HTTPException(status_code=404, detail="Workflow not found")


# ============== WORKFLOW LOGS ==============

@router.get("/{workflow_id}/logs")
async def get_workflow_logs(
    workflow_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
) -> List[WorkflowLog]:
    """Get execution logs for a workflow."""
    logs = [log for log in workflow_logs_db if log.workflow_id == workflow_id]
    return logs[skip:skip + limit]


# ============== TRIGGER TYPES ==============

@router.get("/meta/triggers")
async def get_trigger_types():
    """Get available trigger types."""
    return {
        "triggers": [
            {"id": "on_message", "name": "On Message", "description": "Triggered when a message is received"},
            {"id": "on_contact_created", "name": "On Contact Created", "description": "Triggered when a new contact is added"},
            {"id": "on_contact_updated", "name": "On Contact Updated", "description": "Triggered when contact info changes"},
            {"id": "before_event", "name": "Before Event", "description": "Triggered before a scheduled event"},
            {"id": "after_event", "name": "After Event", "description": "Triggered after an event completes"},
            {"id": "on_schedule", "name": "On Schedule", "description": "Triggered at a specific time"},
            {"id": "on_tag_added", "name": "On Tag Added", "description": "Triggered when a tag is added to contact"},
            {"id": "on_payment", "name": "On Payment", "description": "Triggered when payment is received"},
        ]
    }


@router.get("/meta/actions")
async def get_action_types():
    """Get available action types."""
    return {
        "actions": [
            {"id": "send_message", "name": "Send Message", "description": "Send a message to the contact"},
            {"id": "add_tag", "name": "Add Tag", "description": "Add a tag to the contact"},
            {"id": "remove_tag", "name": "Remove Tag", "description": "Remove a tag from the contact"},
            {"id": "create_task", "name": "Create Task", "description": "Create a follow-up task"},
            {"id": "send_notification", "name": "Send Notification", "description": "Send a push notification"},
            {"id": "update_contact", "name": "Update Contact", "description": "Update contact information"},
            {"id": "trigger_webhook", "name": "Trigger Webhook", "description": "Call an external webhook"},
            {"id": "ai_process", "name": "AI Process", "description": "Process with AI for insights"},
        ]
    }
