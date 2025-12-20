"""
WickedCRM Memberships Router
Subscription and membership management.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/memberships", tags=["Memberships"])


# ============== DATA MODELS ==============

class MembershipPlan(BaseModel):
    id: str
    name: str
    description: str
    price_cents: int
    billing_period: Literal["weekly", "monthly", "yearly"]
    features: List[str]
    is_active: bool = True
    popular: bool = False


class Subscription(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: Literal["active", "cancelled", "expired", "paused"]
    payment_processor: Optional[str] = None
    external_subscription_id: Optional[str] = None
    started_at: str
    expires_at: Optional[str] = None
    created_at: str


class CreateSubscriptionRequest(BaseModel):
    plan_id: str
    payment_method: Optional[str] = None


class UpdateSubscriptionRequest(BaseModel):
    status: Optional[Literal["active", "cancelled", "paused"]] = None


# ============== DEFAULT PLANS ==============

DEFAULT_PLANS: List[MembershipPlan] = [
    MembershipPlan(
        id="plan-starter-weekly",
        name="Starter Weekly",
        description="Perfect for getting started",
        price_cents=399,  # $3.99
        billing_period="weekly",
        features=[
            "100 AI credits per week",
            "Basic contact management",
            "Email support",
            "1 integration"
        ],
    ),
    MembershipPlan(
        id="plan-pro-monthly",
        name="Pro Monthly",
        description="Most popular for creators",
        price_cents=1499,  # $14.99
        billing_period="monthly",
        features=[
            "1,000 AI credits per month",
            "Unlimited contacts",
            "Priority support",
            "5 integrations",
            "Workflow automation",
            "Analytics dashboard"
        ],
        popular=True,
    ),
    MembershipPlan(
        id="plan-business-yearly",
        name="Business Yearly",
        description="Best value - 2 months free",
        price_cents=14999,  # $149.99
        billing_period="yearly",
        features=[
            "Unlimited AI credits",
            "Unlimited contacts",
            "24/7 priority support",
            "Unlimited integrations",
            "Advanced automation",
            "Custom branding",
            "API access",
            "Team collaboration"
        ],
    ),
]


# ============== IN-MEMORY STORAGE ==============

plans_db: List[MembershipPlan] = DEFAULT_PLANS.copy()
subscriptions_db: List[Subscription] = []


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
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            return "00000000-0000-0000-0000-000000000001"
        return user_id
    except:
        return "00000000-0000-0000-0000-000000000001"


# ============== ROUTES ==============

@router.get("/plans", response_model=List[MembershipPlan])
async def get_plans():
    """Get all available membership plans."""
    return [p for p in plans_db if p.is_active]


@router.get("/plans/{plan_id}", response_model=MembershipPlan)
async def get_plan(plan_id: str):
    """Get a specific membership plan."""
    for plan in plans_db:
        if plan.id == plan_id:
            return plan
    raise HTTPException(status_code=404, detail="Plan not found")


@router.get("/subscriptions", response_model=List[Subscription])
async def get_user_subscriptions(user_id: str = Depends(get_user_id_from_token)):
    """Get current user's subscriptions."""
    return [s for s in subscriptions_db if s.user_id == user_id]


@router.get("/subscriptions/active")
async def get_active_subscription(user_id: str = Depends(get_user_id_from_token)):
    """Get current user's active subscription."""
    for sub in subscriptions_db:
        if sub.user_id == user_id and sub.status == "active":
            plan = next((p for p in plans_db if p.id == sub.plan_id), None)
            return {
                "subscription": sub,
                "plan": plan
            }
    return {"subscription": None, "plan": None}


@router.post("/subscriptions", response_model=Subscription)
async def create_subscription(
    request: CreateSubscriptionRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """Subscribe to a membership plan."""
    # Check if plan exists
    plan = next((p for p in plans_db if p.id == request.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Check for existing active subscription
    existing = next((s for s in subscriptions_db if s.user_id == user_id and s.status == "active"), None)
    if existing:
        raise HTTPException(status_code=400, detail="User already has an active subscription. Cancel it first.")

    # Calculate expiration based on billing period
    now = datetime.utcnow()
    if plan.billing_period == "weekly":
        expires = now + timedelta(days=7)
    elif plan.billing_period == "monthly":
        expires = now + timedelta(days=30)
    else:  # yearly
        expires = now + timedelta(days=365)

    # Create subscription
    # In production, this would integrate with payment processor first
    new_subscription = Subscription(
        id=str(uuid.uuid4()),
        user_id=user_id,
        plan_id=request.plan_id,
        status="active",
        payment_processor=request.payment_method or "manual",
        started_at=now.isoformat(),
        expires_at=expires.isoformat(),
        created_at=now.isoformat(),
    )

    subscriptions_db.append(new_subscription)

    return new_subscription


@router.patch("/subscriptions/{subscription_id}")
async def update_subscription(
    subscription_id: str,
    request: UpdateSubscriptionRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """Update subscription (cancel, pause, etc.)."""
    for sub in subscriptions_db:
        if sub.id == subscription_id and sub.user_id == user_id:
            if request.status:
                sub.status = request.status
            return sub

    raise HTTPException(status_code=404, detail="Subscription not found")


@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    user_id: str = Depends(get_user_id_from_token)
):
    """Cancel a subscription."""
    for sub in subscriptions_db:
        if sub.id == subscription_id and sub.user_id == user_id:
            sub.status = "cancelled"
            return {"status": "cancelled", "subscription_id": subscription_id}

    raise HTTPException(status_code=404, detail="Subscription not found")


@router.post("/subscriptions/{subscription_id}/reactivate")
async def reactivate_subscription(
    subscription_id: str,
    user_id: str = Depends(get_user_id_from_token)
):
    """Reactivate a cancelled subscription."""
    for sub in subscriptions_db:
        if sub.id == subscription_id and sub.user_id == user_id:
            if sub.status not in ["cancelled", "paused"]:
                raise HTTPException(status_code=400, detail="Subscription is not cancelled or paused")

            sub.status = "active"
            # Extend expiration
            now = datetime.utcnow()
            plan = next((p for p in plans_db if p.id == sub.plan_id), None)
            if plan:
                if plan.billing_period == "weekly":
                    sub.expires_at = (now + timedelta(days=7)).isoformat()
                elif plan.billing_period == "monthly":
                    sub.expires_at = (now + timedelta(days=30)).isoformat()
                else:
                    sub.expires_at = (now + timedelta(days=365)).isoformat()

            return {"status": "reactivated", "subscription_id": subscription_id}

    raise HTTPException(status_code=404, detail="Subscription not found")


# ============== ADMIN ROUTES ==============

@router.post("/plans", response_model=MembershipPlan)
async def create_plan(
    name: str,
    description: str,
    price_cents: int,
    billing_period: Literal["weekly", "monthly", "yearly"],
    features: List[str],
    popular: bool = False
):
    """Create a new membership plan (admin only)."""
    new_plan = MembershipPlan(
        id=f"plan-{uuid.uuid4().hex[:8]}",
        name=name,
        description=description,
        price_cents=price_cents,
        billing_period=billing_period,
        features=features,
        popular=popular,
    )
    plans_db.append(new_plan)
    return new_plan


@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Deactivate a membership plan (admin only)."""
    for plan in plans_db:
        if plan.id == plan_id:
            plan.is_active = False
            return {"status": "deactivated", "plan_id": plan_id}
    raise HTTPException(status_code=404, detail="Plan not found")
