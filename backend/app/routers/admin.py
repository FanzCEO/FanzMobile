from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import payments
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


@router.get("/users")
def list_user_access(db: Session = Depends(get_db), _=Depends(require_admin)):
    """List all user access overrides."""
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
