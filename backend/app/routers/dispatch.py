"""
WickedCRM Dispatch Router
Resource and job management for dispatch operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/dispatch", tags=["Dispatch"])


# ============== DATA MODELS ==============

class DispatchResource(BaseModel):
    id: str
    name: str
    type: Literal["driver", "vehicle", "team"]
    status: Literal["available", "busy", "offline", "break"]
    current_assignment: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    last_checkin: Optional[str] = None


class DispatchJob(BaseModel):
    id: str
    title: str
    status: Literal["pending", "assigned", "in_progress", "completed", "cancelled"]
    priority: Literal["low", "normal", "high", "urgent"]
    assigned_to: Optional[str] = None
    location: str
    eta: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class DispatchAlert(BaseModel):
    id: str
    type: Literal["warning", "error", "info"]
    message: str
    resource_id: Optional[str] = None
    job_id: Optional[str] = None
    created_at: str
    acknowledged: bool = False


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


# ============== IN-MEMORY STORAGE ==============

resources_db: List[DispatchResource] = [
    DispatchResource(id="1", name="Driver A", type="driver", status="available", phone="+1234567890", location="Downtown", last_checkin="5 min ago"),
    DispatchResource(id="2", name="Driver B", type="driver", status="busy", current_assignment="Delivery #1045", location="Highway 101", last_checkin="2 min ago"),
    DispatchResource(id="3", name="Driver C", type="driver", status="break", location="Rest Stop", last_checkin="15 min ago"),
    DispatchResource(id="4", name="Team Alpha", type="team", status="available", location="Warehouse", last_checkin="1 min ago"),
    DispatchResource(id="5", name="Driver D", type="driver", status="offline", location="Unknown", last_checkin="2 hours ago"),
]

jobs_db: List[DispatchJob] = [
    DispatchJob(id="j1", title="Pickup at 123 Main St", status="pending", priority="high", location="123 Main St", created_at="10:30 AM"),
    DispatchJob(id="j2", title="Delivery to Bay 4", status="in_progress", priority="normal", assigned_to="2", location="Bay 4", eta="15 min", created_at="09:45 AM"),
    DispatchJob(id="j3", title="Service call - HVAC", status="assigned", priority="normal", assigned_to="4", location="456 Oak Ave", created_at="08:00 AM"),
    DispatchJob(id="j4", title="Emergency repair", status="pending", priority="urgent", location="789 Pine Rd", created_at="11:00 AM"),
    DispatchJob(id="j5", title="Routine inspection", status="completed", priority="low", assigned_to="1", location="Site C", created_at="Yesterday"),
]

alerts_db: List[DispatchAlert] = [
    DispatchAlert(id="a1", type="warning", message="Driver B running behind schedule", resource_id="2", created_at="5 min ago"),
    DispatchAlert(id="a2", type="error", message="Vehicle 3 needs maintenance", resource_id="3", created_at="30 min ago"),
    DispatchAlert(id="a3", type="info", message="New high-priority job added", job_id="j4", created_at="10 min ago", acknowledged=True),
]


# ============== ROUTES ==============

@router.get("/resources", response_model=List[DispatchResource])
async def get_resources():
    """Get all dispatch resources."""
    return resources_db


@router.get("/resources/{resource_id}", response_model=DispatchResource)
async def get_resource(resource_id: str):
    """Get a specific resource."""
    for resource in resources_db:
        if resource.id == resource_id:
            return resource
    raise HTTPException(status_code=404, detail="Resource not found")


@router.patch("/resources/{resource_id}")
async def update_resource_status(resource_id: str, status: str):
    """Update resource status."""
    for resource in resources_db:
        if resource.id == resource_id:
            if status in ["available", "busy", "offline", "break"]:
                resource.status = status
                resource.last_checkin = "Just now"
                return resource
            raise HTTPException(status_code=400, detail="Invalid status")
    raise HTTPException(status_code=404, detail="Resource not found")


@router.get("/jobs", response_model=List[DispatchJob])
async def get_jobs():
    """Get all dispatch jobs."""
    return jobs_db


@router.get("/jobs/{job_id}", response_model=DispatchJob)
async def get_job(job_id: str):
    """Get a specific job."""
    for job in jobs_db:
        if job.id == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")


@router.post("/jobs", response_model=DispatchJob)
async def create_job(request: CreateJobRequest):
    """Create a new dispatch job."""
    new_job = DispatchJob(
        id=f"j{uuid.uuid4().hex[:8]}",
        title=request.title,
        status="pending",
        priority=request.priority,
        location=request.location,
        notes=request.notes,
        created_at=datetime.now().strftime("%I:%M %p"),
    )
    jobs_db.insert(0, new_job)
    return new_job


@router.post("/jobs/{job_id}/assign")
async def assign_job(job_id: str, request: AssignJobRequest):
    """Assign a job to a resource."""
    job = None
    for j in jobs_db:
        if j.id == job_id:
            job = j
            break

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resource = None
    for r in resources_db:
        if r.id == request.resource_id:
            resource = r
            break

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    job.assigned_to = request.resource_id
    job.status = "assigned"
    resource.status = "busy"
    resource.current_assignment = job.title

    return {"status": "assigned", "job_id": job_id, "resource_id": request.resource_id}


@router.patch("/jobs/{job_id}")
async def update_job(job_id: str, request: UpdateJobRequest):
    """Update job status or details."""
    for job in jobs_db:
        if job.id == job_id:
            if request.status:
                job.status = request.status

                # If completed or cancelled, free up the resource
                if request.status in ["completed", "cancelled"] and job.assigned_to:
                    for resource in resources_db:
                        if resource.id == job.assigned_to:
                            resource.status = "available"
                            resource.current_assignment = None
                            break

            if request.assigned_to is not None:
                job.assigned_to = request.assigned_to
            if request.notes is not None:
                job.notes = request.notes

            return job

    raise HTTPException(status_code=404, detail="Job not found")


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job."""
    global jobs_db
    for i, job in enumerate(jobs_db):
        if job.id == job_id:
            jobs_db.pop(i)
            return {"status": "deleted", "id": job_id}
    raise HTTPException(status_code=404, detail="Job not found")


@router.get("/alerts", response_model=List[DispatchAlert])
async def get_alerts():
    """Get all dispatch alerts."""
    return alerts_db


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert."""
    for alert in alerts_db:
        if alert.id == alert_id:
            alert.acknowledged = True
            return {"status": "acknowledged", "id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")


@router.post("/alerts")
async def create_alert(type: str, message: str, resource_id: Optional[str] = None, job_id: Optional[str] = None):
    """Create a new alert."""
    if type not in ["warning", "error", "info"]:
        raise HTTPException(status_code=400, detail="Invalid alert type")

    new_alert = DispatchAlert(
        id=f"a{uuid.uuid4().hex[:8]}",
        type=type,
        message=message,
        resource_id=resource_id,
        job_id=job_id,
        created_at="Just now",
    )
    alerts_db.insert(0, new_alert)
    return new_alert
