from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import payments

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/metrics")
def admin_metrics(db: Session = Depends(get_db)):
    """Basic admin metrics for billing tables."""
    plans = db.query(payments.Plan).count()
    subs = db.query(payments.Subscription).count()
    txs = db.query(payments.Transaction).count()
    payouts = db.query(payments.Payout).count()
    webhooks = db.query(payments.WebhookEvent).count()
    return {
        "plans": plans,
        "subscriptions": subs,
        "transactions": txs,
        "payouts": payouts,
        "webhook_events": webhooks,
    }
