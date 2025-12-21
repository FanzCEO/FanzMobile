"""
WickedCRM Dispatch Router
Resource and job management for dispatch operations with database persistence.
"""

from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.dispatch import DispatchResource as ResourceModel
from app.models.dispatch import DispatchJob as JobModel
from app.models.dispatch import DispatchAlert as AlertModel

router = APIRouter(prefix="/api/dispatch", tags=["Dispatch"])


# ============== DATA MODELS ==============

class ResourceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    current_assignment: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    last_checkin: Optional[str] = None

    class Config:
        from_attributes = True


class JobResponse(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    assigned_to: Optional[str] = None
    location: str
    eta: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: str
    type: str
    message: str
    resource_id: Optional[str] = None
    job_id: Optional[str] = None
    acknowledged: bool = False
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class CreateResourceRequest(BaseModel):
    name: str
    type: Literal["driver", "vehicle", "team"] = "driver"
    phone: Optional[str] = None
    location: Optional[str] = None


class CreateJobRequest(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    priority: Literal["low", "normal", "high", "urgent"] = "normal"
    notes: Optional[str] = None


class AssignJobRequest(BaseModel):
    resource_id: str


class UpdateJobRequest(BaseModel):
    status: Optional[Literal["pending", "assigned", "in_progress", "completed", "cancelled"]] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class CreateAlertRequest(BaseModel):
    type: Literal["warning", "error", "info"] = "info"
    message: str
    resource_id: Optional[str] = None
    job_id: Optional[str] = None


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


# ============== RESOURCE ROUTES ==============

@router.get("/resources")
async def get_resources(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all dispatch resources."""
    resources = db.query(ResourceModel).filter(ResourceModel.user_id == user_id).all()
    return [r.to_dict() for r in resources]


@router.get("/resources/{resource_id}")
async def get_resource(
    resource_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get a specific resource."""
    try:
        resource_uuid = uuid.UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    resource = db.query(ResourceModel).filter(
        ResourceModel.id == resource_uuid,
        ResourceModel.user_id == user_id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    return resource.to_dict()


@router.post("/resources")
async def create_resource(
    request: CreateResourceRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new resource."""
    new_resource = ResourceModel(
        user_id=user_id,
        name=request.name,
        type=request.type,
        status="available",
        phone=request.phone,
        location=request.location,
        last_checkin=datetime.utcnow()
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource.to_dict()


@router.patch("/resources/{resource_id}")
async def update_resource_status(
    resource_id: str,
    status: str = Query(...),
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update resource status."""
    try:
        resource_uuid = uuid.UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    resource = db.query(ResourceModel).filter(
        ResourceModel.id == resource_uuid,
        ResourceModel.user_id == user_id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if status not in ["available", "busy", "offline", "break"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    resource.status = status
    resource.last_checkin = datetime.utcnow()
    db.commit()
    db.refresh(resource)
    return resource.to_dict()


@router.delete("/resources/{resource_id}")
async def delete_resource(
    resource_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete a resource."""
    try:
        resource_uuid = uuid.UUID(resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    resource = db.query(ResourceModel).filter(
        ResourceModel.id == resource_uuid,
        ResourceModel.user_id == user_id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    db.delete(resource)
    db.commit()
    return {"status": "deleted", "id": resource_id}


# ============== JOB ROUTES ==============

@router.get("/jobs")
async def get_jobs(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all dispatch jobs."""
    query = db.query(JobModel).filter(JobModel.user_id == user_id)

    if status:
        query = query.filter(JobModel.status == status)
    if priority:
        query = query.filter(JobModel.priority == priority)

    jobs = query.order_by(JobModel.created_at.desc()).all()
    return [j.to_dict() for j in jobs]


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get a specific job."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = db.query(JobModel).filter(
        JobModel.id == job_uuid,
        JobModel.user_id == user_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job.to_dict()


@router.post("/jobs")
async def create_job(
    request: CreateJobRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new dispatch job."""
    new_job = JobModel(
        user_id=user_id,
        title=request.title,
        description=request.description,
        location=request.location,
        priority=request.priority,
        notes=request.notes,
        status="pending"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job.to_dict()


@router.post("/jobs/{job_id}/assign")
async def assign_job(
    job_id: str,
    request: AssignJobRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Assign a job to a resource."""
    try:
        job_uuid = uuid.UUID(job_id)
        resource_uuid = uuid.UUID(request.resource_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    job = db.query(JobModel).filter(
        JobModel.id == job_uuid,
        JobModel.user_id == user_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resource = db.query(ResourceModel).filter(
        ResourceModel.id == resource_uuid,
        ResourceModel.user_id == user_id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    job.assigned_to = resource_uuid
    job.status = "assigned"
    resource.status = "busy"
    resource.current_assignment = job.title

    db.commit()
    return {"status": "assigned", "job_id": job_id, "resource_id": request.resource_id}


@router.patch("/jobs/{job_id}")
async def update_job(
    job_id: str,
    request: UpdateJobRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Update job status or details."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = db.query(JobModel).filter(
        JobModel.id == job_uuid,
        JobModel.user_id == user_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if request.status:
        job.status = request.status

        # If completed or cancelled, free up the resource
        if request.status in ["completed", "cancelled"] and job.assigned_to:
            resource = db.query(ResourceModel).filter(
                ResourceModel.id == job.assigned_to
            ).first()
            if resource:
                resource.status = "available"
                resource.current_assignment = None

    if request.assigned_to is not None:
        try:
            job.assigned_to = uuid.UUID(request.assigned_to) if request.assigned_to else None
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid resource ID")

    if request.notes is not None:
        job.notes = request.notes

    db.commit()
    db.refresh(job)
    return job.to_dict()


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete a job."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = db.query(JobModel).filter(
        JobModel.id == job_uuid,
        JobModel.user_id == user_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"status": "deleted", "id": job_id}


# ============== ALERT ROUTES ==============

@router.get("/alerts")
async def get_alerts(
    acknowledged: Optional[bool] = None,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> List[dict]:
    """Get all dispatch alerts."""
    query = db.query(AlertModel).filter(AlertModel.user_id == user_id)

    if acknowledged is not None:
        query = query.filter(AlertModel.acknowledged == acknowledged)

    alerts = query.order_by(AlertModel.created_at.desc()).all()
    return [a.to_dict() for a in alerts]


@router.post("/alerts")
async def create_alert(
    request: CreateAlertRequest,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Create a new alert."""
    resource_uuid = None
    job_uuid = None

    if request.resource_id:
        try:
            resource_uuid = uuid.UUID(request.resource_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid resource ID")

    if request.job_id:
        try:
            job_uuid = uuid.UUID(request.job_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid job ID")

    new_alert = AlertModel(
        user_id=user_id,
        type=request.type,
        message=request.message,
        resource_id=resource_uuid,
        job_id=job_uuid
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert.to_dict()


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Acknowledge an alert."""
    try:
        alert_uuid = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID")

    alert = db.query(AlertModel).filter(
        AlertModel.id == alert_uuid,
        AlertModel.user_id == user_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    db.commit()
    return {"status": "acknowledged", "id": alert_id}


@router.delete("/alerts/{alert_id}")
async def delete_alert(
    alert_id: str,
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
):
    """Delete an alert."""
    try:
        alert_uuid = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID")

    alert = db.query(AlertModel).filter(
        AlertModel.id == alert_uuid,
        AlertModel.user_id == user_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"status": "deleted", "id": alert_id}


# ============== STATS ==============

@router.get("/stats")
async def get_dispatch_stats(
    user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get dispatch statistics."""
    from sqlalchemy import func

    total_resources = db.query(func.count(ResourceModel.id)).filter(
        ResourceModel.user_id == user_id
    ).scalar() or 0

    available_resources = db.query(func.count(ResourceModel.id)).filter(
        ResourceModel.user_id == user_id,
        ResourceModel.status == "available"
    ).scalar() or 0

    pending_jobs = db.query(func.count(JobModel.id)).filter(
        JobModel.user_id == user_id,
        JobModel.status == "pending"
    ).scalar() or 0

    active_jobs = db.query(func.count(JobModel.id)).filter(
        JobModel.user_id == user_id,
        JobModel.status.in_(["assigned", "in_progress"])
    ).scalar() or 0

    unack_alerts = db.query(func.count(AlertModel.id)).filter(
        AlertModel.user_id == user_id,
        AlertModel.acknowledged == False
    ).scalar() or 0

    return {
        "total_resources": total_resources,
        "available_resources": available_resources,
        "pending_jobs": pending_jobs,
        "active_jobs": active_jobs,
        "unacknowledged_alerts": unack_alerts
    }
