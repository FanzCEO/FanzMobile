from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import payments
from app.models.user import User
from app.models.contact import Contact
from app.deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])

DEFAULT_FEATURE_TOGGLES = {
    "ptt_enabled": True,
    "ai_enabled": True,
    "logging_enabled": True,
}


class UserAccessRequest(BaseModel):
    email: str
    comped: Optional[bool] = False
    active_subscription: Optional[bool] = False
    subscription_plan: Optional[str] = None


class FeatureToggleRequest(BaseModel):
    ptt_enabled: Optional[bool] = None
    ai_enabled: Optional[bool] = None
    logging_enabled: Optional[bool] = None


class PaymentProviderRequest(BaseModel):
    config: dict


def ensure_feature_toggles(db: Session):
    """Ensure default feature toggles exist."""
    for key, default_enabled in DEFAULT_FEATURE_TOGGLES.items():
        existing = (
            db.query(payments.FeatureToggle)
            .filter(payments.FeatureToggle.key == key)
            .first()
        )
        if not existing:
            toggle = payments.FeatureToggle(key=key, enabled=default_enabled)
            db.add(toggle)
    db.commit()


@router.get("/metrics")
def admin_metrics(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Basic admin metrics for billing tables."""
    plans = db.query(payments.Plan).count()
    subs = db.query(payments.Subscription).count()
    txs = db.query(payments.Transaction).count()
    payouts = db.query(payments.Payout).count()
    webhooks = db.query(payments.WebhookEvent).count()
    users = db.query(payments.UserAccess).count()
    return {
        "plans": plans,
        "subscriptions": subs,
        "transactions": txs,
        "payouts": payouts,
        "webhook_events": webhooks,
        "admin_users": users,
    }


@router.get("/webhooks")
def list_webhooks(db: Session = Depends(get_db), _=Depends(require_admin)):
    return (
        db.query(payments.WebhookEvent)
        .order_by(payments.WebhookEvent.created_at.desc())
        .limit(200)
        .all()
    )


@router.get("/payment-providers")
def list_payment_providers(db: Session = Depends(get_db), _=Depends(require_admin)):
    """List stored payment provider configs (metadata only; secrets remain in config)."""
    providers = db.query(payments.PaymentProviderConfig).all()
    return [
        {
            "provider": p.provider,
            "config": p.config or {},
            "updated_at": p.updated_at.isoformat(),
            "created_at": p.created_at.isoformat(),
        }
        for p in providers
    ]


@router.put("/payment-providers/{provider}")
def upsert_payment_provider(
    provider: str,
    request: PaymentProviderRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Upsert payment provider credentials/config."""
    record = (
        db.query(payments.PaymentProviderConfig)
        .filter(payments.PaymentProviderConfig.provider == provider)
        .first()
    )
    if not record:
        record = payments.PaymentProviderConfig(provider=provider, config=request.config)
        db.add(record)
    else:
        record.config = request.config

    db.commit()
    db.refresh(record)
    return {
        "provider": record.provider,
        "config": record.config or {},
        "updated_at": record.updated_at.isoformat(),
    }


@router.post("/users/access")
def upsert_user_access(
    request: UserAccessRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Create or update access flags for a user (comped, subscription plan)."""
    record = (
        db.query(payments.UserAccess)
        .filter(payments.UserAccess.email == request.email)
        .first()
    )

    if not record:
        record = payments.UserAccess(
            email=request.email,
            comped=bool(request.comped),
            active_subscription=bool(request.active_subscription),
            subscription_plan=request.subscription_plan,
        )
        db.add(record)
    else:
        if request.comped is not None:
            record.comped = request.comped
        if request.active_subscription is not None:
            record.active_subscription = request.active_subscription
        record.subscription_plan = request.subscription_plan

    db.commit()
    db.refresh(record)
    return {
        "email": record.email,
        "comped": record.comped,
        "active_subscription": record.active_subscription,
        "subscription_plan": record.subscription_plan,
    }


@router.get("/users-access")
def list_user_access(db: Session = Depends(get_db), _=Depends(require_admin)):
    """List all user access overrides (legacy)."""
    records = db.query(payments.UserAccess).order_by(payments.UserAccess.created_at.desc()).all()
    return [
        {
            "email": r.email,
            "comped": r.comped,
            "active_subscription": r.active_subscription,
            "subscription_plan": r.subscription_plan,
        }
        for r in records
    ]


@router.post("/features")
def update_features(
    request: FeatureToggleRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Update global feature toggles."""
    ensure_feature_toggles(db)
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    for key, enabled in updates.items():
        toggle = (
            db.query(payments.FeatureToggle)
            .filter(payments.FeatureToggle.key == key)
            .first()
        )
        if toggle:
            toggle.enabled = enabled
    db.commit()
    return get_features(db=db)


@router.get("/features")
def get_features(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Get current feature toggle states."""
    ensure_feature_toggles(db)
    toggles = db.query(payments.FeatureToggle).all()
    return {t.key: t.enabled for t in toggles}


# ============== THEME SETTINGS ==============

class ThemeSettings(BaseModel):
    primary_color: str = "#6366f1"
    secondary_color: str = "#8b5cf6"
    accent_color: str = "#06b6d4"
    background_color: str = "#0a0a0f"
    font_family: str = "Inter"
    border_radius: str = "0.75rem"
    logo_url: Optional[str] = None


# In-memory theme storage (in production, use database)
_theme_settings = ThemeSettings()


@router.get("/theme")
def get_theme():
    """Get current theme settings."""
    return _theme_settings.model_dump()


@router.put("/theme")
def update_theme(settings: ThemeSettings, _=Depends(require_admin)):
    """Update theme settings."""
    global _theme_settings
    _theme_settings = settings
    return _theme_settings.model_dump()


# ============== USER MANAGEMENT ==============

@router.get("/users", response_model=List[dict])
def list_users_full(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """List all users with their details."""
    query = db.query(User)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(User.email).like(search_term)) |
            (func.lower(User.full_name).like(search_term))
        )

    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": getattr(u, 'role', 'user'),
            "comped": u.comped,
            "active_subscription": u.active_subscription,
            "subscription_plan": u.subscription_plan,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "is_active": getattr(u, 'is_active', True),
        }
        for u in users
    ]


@router.get("/users/count")
def get_user_count(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Get total user count."""
    query = db.query(func.count(User.id))

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(User.email).like(search_term)) |
            (func.lower(User.full_name).like(search_term))
        )

    total = query.scalar()
    return {"total": total}


@router.get("/users/{user_id}")
def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Get a specific user by ID."""
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": getattr(user, 'role', 'user'),
        "comped": user.comped,
        "active_subscription": user.active_subscription,
        "subscription_plan": user.subscription_plan,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "is_active": getattr(user, 'is_active', True),
    }


class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    comped: Optional[bool] = None
    active_subscription: Optional[bool] = None
    subscription_plan: Optional[str] = None
    is_active: Optional[bool] = None


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Update a user's details."""
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.comped is not None:
        user.comped = request.comped
    if request.active_subscription is not None:
        user.active_subscription = request.active_subscription
    if request.subscription_plan is not None:
        user.subscription_plan = request.subscription_plan

    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "comped": user.comped,
        "active_subscription": user.active_subscription,
        "subscription_plan": user.subscription_plan,
    }


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Deactivate a user (soft delete)."""
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete - just mark as inactive
    user.active_subscription = False
    user.comped = False
    db.commit()

    return {"status": "deactivated", "id": user_id}


# ============== SYSTEM STATS ==============

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Get system-wide statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    subscribers = db.query(func.count(User.id)).filter(User.active_subscription == True).scalar() or 0
    comped_users = db.query(func.count(User.id)).filter(User.comped == True).scalar() or 0
    total_contacts = db.query(func.count(Contact.id)).scalar() or 0

    # Count messages from ThreadEvent if exists
    total_messages = 0
    try:
        total_messages = db.query(func.count(payments.ThreadEvent.id)).scalar() or 0
    except:
        pass

    return {
        "total_users": total_users,
        "subscribers": subscribers,
        "comped_users": comped_users,
        "total_contacts": total_contacts,
        "total_messages": total_messages,
    }
