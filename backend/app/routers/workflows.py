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
    "on_payment",
    "on_webhook"
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

# Workflows come from user creation - no demo data
workflows_db: List[Workflow] = []

# Workflow execution logs
workflow_logs_db: List[WorkflowLog] = []

# Registered webhook endpoints
webhook_endpoints: List[dict] = []


# ============== WEBHOOK MODELS ==============

import httpx


class WebhookConfig(BaseModel):
    name: str
    url: str
    secret: Optional[str] = None
    events: List[str] = []  # Which events to send
    active: bool = True


class WebhookEvent(BaseModel):
    event_type: str
    payload: dict
    timestamp: Optional[str] = None


# ============== WEBHOOK ROUTES (must come before /{workflow_id}) ==============

@router.get("/webhooks")
async def get_webhooks():
    """Get all registered webhook endpoints."""
    return {"webhooks": webhook_endpoints}


@router.post("/webhooks")
async def register_webhook(config: WebhookConfig):
    """Register a new webhook endpoint for outgoing events."""
    webhook_id = f"wh-{uuid.uuid4().hex[:8]}"
    webhook = {
        "id": webhook_id,
        "name": config.name,
        "url": config.url,
        "secret": config.secret,
        "events": config.events,
        "active": config.active,
        "created_at": datetime.now().isoformat()
    }
    webhook_endpoints.append(webhook)
    return webhook


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str):
    """Delete a webhook endpoint."""
    global webhook_endpoints
    for i, wh in enumerate(webhook_endpoints):
        if wh["id"] == webhook_id:
            webhook_endpoints.pop(i)
            return {"status": "deleted", "id": webhook_id}
    raise HTTPException(status_code=404, detail="Webhook not found")


@router.post("/webhooks/ingest")
async def webhook_ingest(event: WebhookEvent):
    """
    Ingest webhook from external sources (Zapier, n8n, Fanz, etc.)
    This triggers matching workflows based on the event type.
    """
    event_type = event.event_type
    payload = event.payload
    timestamp = event.timestamp or datetime.now().isoformat()

    # Find workflows that match this trigger
    triggered_count = 0
    for wf in workflows_db:
        if wf.enabled and wf.trigger == "on_webhook" or event_type in [f"webhook:{wf.trigger}"]:
            # Log the execution
            log = WorkflowLog(
                id=f"log-{uuid.uuid4().hex[:8]}",
                workflow_id=wf.id,
                status="success",
                trigger_data=payload,
                actions_executed=[a.type for a in wf.actions],
                executed_at=timestamp
            )
            workflow_logs_db.append(log)
            wf.run_count += 1
            wf.last_run = timestamp
            triggered_count += 1

    return {
        "status": "received",
        "event_type": event_type,
        "workflows_triggered": triggered_count,
        "timestamp": timestamp
    }


@router.post("/webhooks/send/{webhook_id}")
async def send_webhook_to_endpoint(webhook_id: str, event: WebhookEvent):
    """Send an event to a specific webhook endpoint."""
    webhook = next((wh for wh in webhook_endpoints if wh["id"] == webhook_id), None)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    if not webhook["active"]:
        raise HTTPException(status_code=400, detail="Webhook is not active")

    # Prepare payload
    payload = {
        "event": event.event_type,
        "data": event.payload,
        "timestamp": event.timestamp or datetime.now().isoformat(),
        "source": "wickedcrm"
    }

    # Add signature if secret is configured
    headers = {"Content-Type": "application/json"}
    if webhook.get("secret"):
        import hmac
        import hashlib
        import json
        signature = hmac.new(
            webhook["secret"].encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-Webhook-Signature"] = f"sha256={signature}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook["url"],
                json=payload,
                headers=headers,
                timeout=10.0
            )
            return {
                "status": "sent",
                "webhook_id": webhook_id,
                "response_status": response.status_code
            }
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to send webhook: {str(e)}")


@router.post("/webhooks/broadcast")
async def broadcast_event(event: WebhookEvent):
    """Broadcast an event to all active webhooks that subscribe to this event type."""
    results = []
    for webhook in webhook_endpoints:
        if not webhook["active"]:
            continue
        # Check if webhook subscribes to this event type (empty = all events)
        if webhook["events"] and event.event_type not in webhook["events"]:
            continue

        try:
            result = await send_webhook_to_endpoint(webhook["id"], event)
            results.append({"webhook_id": webhook["id"], "status": "sent"})
        except Exception as e:
            results.append({"webhook_id": webhook["id"], "status": "failed", "error": str(e)})

    return {"broadcast_results": results, "total_sent": len([r for r in results if r["status"] == "sent"])}


# ============== WORKFLOW ROUTES ==============

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
            {"id": "on_webhook", "name": "On Webhook", "description": "Triggered by incoming webhook from Fanz/Zapier/n8n"},
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
            {"id": "fanz_automation", "name": "Fanz Automation", "description": "Trigger Fanz platform automation"},
        ]
    }
