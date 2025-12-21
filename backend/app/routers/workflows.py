"""
WickedCRM Workflows Router
Automation workflows for CRM tasks with database persistence.
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from sqlalchemy.orm import Session
import uuid
import httpx

from app.database import get_db
from app.models.workflow import Workflow as WorkflowModel
from app.models.workflow import WorkflowLog as WorkflowLogModel
from app.models.workflow import WebhookEndpoint as WebhookModel

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
    operator: str
    value: str


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
    conditions: Optional[List[dict]] = None
    actions: Optional[List[dict]] = None
    enabled: Optional[bool] = None


class WebhookConfig(BaseModel):
    name: str
    url: str
    secret: Optional[str] = None
    events: List[str] = []
    active: bool = True


class WebhookEvent(BaseModel):
    event_type: str
    payload: dict
    timestamp: Optional[str] = None


# ============== HELPER FUNCTIONS ==============

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        return "00000000-0000-0000-0000-000000000001"
    try:
        import jwt
        from app.config import settings
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub") or payload.get("user_id") or "00000000-0000-0000-0000-000000000001"
    except:
        return "00000000-0000-0000-0000-000000000001"


# ============== WEBHOOK ROUTES ==============

@router.get("/webhooks")
async def get_webhooks(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Get all registered webhook endpoints."""
    webhooks = db.query(WebhookModel).filter(WebhookModel.user_id == user_id).all()
    return {"webhooks": [w.to_dict() for w in webhooks]}


@router.post("/webhooks")
async def register_webhook(
    config: WebhookConfig,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Register a new webhook endpoint for outgoing events."""
    new_webhook = WebhookModel(
        user_id=user_id,
        name=config.name,
        url=config.url,
        secret=config.secret,
        events=config.events,
        active=config.active
    )
    db.add(new_webhook)
    db.commit()
    db.refresh(new_webhook)
    return new_webhook.to_dict()


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete a webhook endpoint."""
    try:
        webhook_uuid = uuid.UUID(webhook_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid webhook ID")

    webhook = db.query(WebhookModel).filter(
        WebhookModel.id == webhook_uuid,
        WebhookModel.user_id == user_id
    ).first()

    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    db.delete(webhook)
    db.commit()
    return {"status": "deleted", "id": webhook_id}


@router.post("/webhooks/ingest")
async def webhook_ingest(
    event: WebhookEvent,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """
    Ingest webhook from external sources (Zapier, n8n, Fanz, etc.)
    This triggers matching workflows based on the event type.
    """
    event_type = event.event_type
    payload = event.payload
    timestamp = event.timestamp or datetime.utcnow().isoformat()

    # Find workflows that match this trigger
    workflows = db.query(WorkflowModel).filter(
        WorkflowModel.user_id == user_id,
        WorkflowModel.is_active == True,
        WorkflowModel.trigger_type == "on_webhook"
    ).all()

    triggered_count = 0
    for wf in workflows:
        # Log the execution
        log = WorkflowLogModel(
            workflow_id=wf.id,
            user_id=user_id,
            status="success",
            trigger_data=payload,
            actions_executed=[a.get("type") for a in (wf.actions or [])]
        )
        db.add(log)

        wf.run_count = (wf.run_count or 0) + 1
        wf.last_run_at = datetime.utcnow()
        triggered_count += 1

    db.commit()

    return {
        "status": "received",
        "event_type": event_type,
        "workflows_triggered": triggered_count,
        "timestamp": timestamp
    }


@router.post("/webhooks/send/{webhook_id}")
async def send_webhook_to_endpoint(
    webhook_id: str,
    event: WebhookEvent,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Send an event to a specific webhook endpoint."""
    try:
        webhook_uuid = uuid.UUID(webhook_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid webhook ID")

    webhook = db.query(WebhookModel).filter(
        WebhookModel.id == webhook_uuid,
        WebhookModel.user_id == user_id
    ).first()

    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    if not webhook.active:
        raise HTTPException(status_code=400, detail="Webhook is not active")

    # Prepare payload
    payload = {
        "event": event.event_type,
        "data": event.payload,
        "timestamp": event.timestamp or datetime.utcnow().isoformat(),
        "source": "wickedcrm"
    }

    # Add signature if secret is configured
    headers = {"Content-Type": "application/json"}
    if webhook.secret:
        import hmac
        import hashlib
        import json
        signature = hmac.new(
            webhook.secret.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-Webhook-Signature"] = f"sha256={signature}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook.url,
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
async def broadcast_event(
    event: WebhookEvent,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Broadcast an event to all active webhooks that subscribe to this event type."""
    webhooks = db.query(WebhookModel).filter(
        WebhookModel.user_id == user_id,
        WebhookModel.active == True
    ).all()

    results = []
    for webhook in webhooks:
        # Check if webhook subscribes to this event type
        if webhook.events and event.event_type not in webhook.events:
            continue

        try:
            # Prepare payload
            payload = {
                "event": event.event_type,
                "data": event.payload,
                "timestamp": event.timestamp or datetime.utcnow().isoformat(),
                "source": "wickedcrm"
            }

            headers = {"Content-Type": "application/json"}
            if webhook.secret:
                import hmac
                import hashlib
                import json
                signature = hmac.new(
                    webhook.secret.encode(),
                    json.dumps(payload).encode(),
                    hashlib.sha256
                ).hexdigest()
                headers["X-Webhook-Signature"] = f"sha256={signature}"

            async with httpx.AsyncClient() as client:
                await client.post(webhook.url, json=payload, headers=headers, timeout=10.0)
                results.append({"webhook_id": str(webhook.id), "status": "sent"})
        except Exception as e:
            results.append({"webhook_id": str(webhook.id), "status": "failed", "error": str(e)})

    return {
        "broadcast_results": results,
        "total_sent": len([r for r in results if r["status"] == "sent"])
    }


# ============== WORKFLOW ROUTES ==============

@router.get("")
async def get_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    enabled: Optional[bool] = None,
    trigger: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all workflows with optional filtering."""
    query = db.query(WorkflowModel).filter(WorkflowModel.user_id == user_id)

    if enabled is not None:
        query = query.filter(WorkflowModel.is_active == enabled)

    if trigger:
        query = query.filter(WorkflowModel.trigger_type == trigger)

    workflows = query.order_by(WorkflowModel.created_at.desc()).offset(skip).limit(limit).all()
    return [w.to_dict() for w in workflows]


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get a specific workflow by ID."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow ID")

    workflow = db.query(WorkflowModel).filter(
        WorkflowModel.id == workflow_uuid,
        WorkflowModel.user_id == user_id
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow.to_dict()


@router.post("")
async def create_workflow(
    request: CreateWorkflowRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new workflow."""
    new_workflow = WorkflowModel(
        user_id=user_id,
        name=request.name,
        description=request.description,
        trigger_type=request.trigger,
        trigger_config={"conditions": [c.model_dump() for c in request.conditions]},
        actions=[a.model_dump() for a in request.actions],
        is_active=request.enabled,
        run_count=0
    )

    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)
    return new_workflow.to_dict()


@router.patch("/{workflow_id}")
async def update_workflow(
    workflow_id: str,
    request: UpdateWorkflowRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow ID")

    workflow = db.query(WorkflowModel).filter(
        WorkflowModel.id == workflow_uuid,
        WorkflowModel.user_id == user_id
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if request.name is not None:
        workflow.name = request.name
    if request.description is not None:
        workflow.description = request.description
    if request.trigger is not None:
        workflow.trigger_type = request.trigger
    if request.conditions is not None:
        workflow.trigger_config = {"conditions": request.conditions}
    if request.actions is not None:
        workflow.actions = request.actions
    if request.enabled is not None:
        workflow.is_active = request.enabled

    db.commit()
    db.refresh(workflow)
    return workflow.to_dict()


@router.post("/{workflow_id}/toggle")
async def toggle_workflow(
    workflow_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Toggle workflow enabled/disabled."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow ID")

    workflow = db.query(WorkflowModel).filter(
        WorkflowModel.id == workflow_uuid,
        WorkflowModel.user_id == user_id
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow.is_active = not workflow.is_active
    db.commit()
    db.refresh(workflow)
    return workflow.to_dict()


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow ID")

    workflow = db.query(WorkflowModel).filter(
        WorkflowModel.id == workflow_uuid,
        WorkflowModel.user_id == user_id
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    db.delete(workflow)
    db.commit()
    return {"status": "deleted", "id": workflow_id}


# ============== WORKFLOW LOGS ==============

@router.get("/{workflow_id}/logs")
async def get_workflow_logs(
    workflow_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get execution logs for a workflow."""
    try:
        workflow_uuid = uuid.UUID(workflow_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workflow ID")

    logs = db.query(WorkflowLogModel).filter(
        WorkflowLogModel.workflow_id == workflow_uuid,
        WorkflowLogModel.user_id == user_id
    ).order_by(WorkflowLogModel.executed_at.desc()).offset(skip).limit(limit).all()

    return [log.to_dict() for log in logs]


# ============== TRIGGER & ACTION TYPES ==============

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
