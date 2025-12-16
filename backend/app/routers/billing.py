"""
Billing Router
Platform fees are charged to end consumers (not content creators).
Supports percentage (%) and flat ($) fees per transaction type.
Includes membership checkout scaffolding for CCBill/Segpay/Epoch.
"""

import uuid
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payments import PlatformFee, Plan, Transaction, UsagePolicy
from app.deps import require_admin

router = APIRouter(prefix="/api/billing", tags=["billing"])

# Default fees to seed if database is empty
DEFAULT_FEES = {
    "subscription": {"percent": 500, "flat_cents": 99},      # 5% + $0.99
    "tip": {"percent": 1000, "flat_cents": 50},              # 10% + $0.50
    "ppv": {"percent": 1500, "flat_cents": 0},               # 15% + $0
    "message_unlock": {"percent": 1000, "flat_cents": 25},   # 10% + $0.25
    "custom": {"percent": 800, "flat_cents": 100},           # 8% + $1.00
}

DEFAULT_PLAN = {
    "name": "Membership - Weekly",
    "interval": "weekly",
    "amount_cents": 599,  # $5.99/week
    "currency": "USD",
    "gateway_code": "membership-weekly",
}

DEFAULT_USAGE = {
    "name": "ai_usage",
    "free_units": 20000,  # 20k tokens free
    "unit": "1k_tokens",
    "overage_cents_per_unit": 25,  # $0.25 per 1k tokens overage
    "notes": "Small free allowance, then per-1k-token overage billed to consumer.",
}

class FeeConfigResponse(BaseModel):
    """Fee configuration for a transaction type."""
    percent: float  # Percentage fee (e.g., 5.0 = 5%)
    flat_cents: int  # Flat fee in cents (e.g., 99 = $0.99)


class FeeUpdateRequest(BaseModel):
    """Request to update fees for a transaction type."""
    transaction_type: str
    percent: Optional[float] = None
    flat_cents: Optional[int] = None


class FeeCalculation(BaseModel):
    """Calculated fee breakdown."""
    subtotal_cents: int
    percent_fee_cents: int
    flat_fee_cents: int
    total_fee_cents: int
    consumer_total_cents: int
    creator_receives_cents: int


class CreateFeeRequest(BaseModel):
    """Request to create a new fee type."""
    transaction_type: str
    percent: float = 0.0
    flat_cents: int = 0


class CheckoutRequest(BaseModel):
    """Request to create a checkout session."""
    transaction_type: Optional[str] = "subscription"
    amount_cents: Optional[int] = None
    creator_id: Optional[str] = None
    description: Optional[str] = None
    gateway: str = "ccbill"  # ccbill, segpay, epoch
    plan_id: Optional[str] = None  # Optional plan reference


class CheckoutResponse(BaseModel):
    """Checkout session response."""
    checkout_url: str
    session_id: str
    subtotal_cents: int
    fee_cents: int
    total_cents: int
    plan_id: Optional[str] = None


def seed_default_fees(db: Session):
    """Seed default fees if none exist."""
    existing = db.query(PlatformFee).first()
    if not existing:
        for tx_type, config in DEFAULT_FEES.items():
            fee = PlatformFee(
                transaction_type=tx_type,
                percent=config["percent"],
                flat_cents=config["flat_cents"]
            )
            db.add(fee)
        db.commit()


def seed_default_plan(db: Session) -> Plan:
    """Seed a default membership plan if none exist."""
    plan = db.query(Plan).first()
    if plan:
        return plan

    plan = Plan(
        name=DEFAULT_PLAN["name"],
        interval=DEFAULT_PLAN["interval"],
        amount_cents=DEFAULT_PLAN["amount_cents"],
        currency=DEFAULT_PLAN["currency"],
        gateway_code=DEFAULT_PLAN["gateway_code"],
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def seed_usage_policy(db: Session) -> UsagePolicy:
    """Seed AI usage overage policy if not present."""
    policy = db.query(UsagePolicy).filter(UsagePolicy.name == DEFAULT_USAGE["name"]).first()
    if policy:
        return policy

    policy = UsagePolicy(
        name=DEFAULT_USAGE["name"],
        free_units=DEFAULT_USAGE["free_units"],
        unit=DEFAULT_USAGE["unit"],
        overage_cents_per_unit=DEFAULT_USAGE["overage_cents_per_unit"],
        notes=DEFAULT_USAGE["notes"],
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def basis_points_to_percent(bp: int) -> float:
    """Convert basis points to percentage (500 -> 5.0)."""
    return bp / 100.0


def percent_to_basis_points(pct: float) -> int:
    """Convert percentage to basis points (5.0 -> 500)."""
    return int(pct * 100)


@router.get("/fees")
async def list_fees(db: Session = Depends(get_db)):
    """
    List all fee configurations by transaction type.
    Fees are charged to end consumers, not content creators.
    """
    seed_default_fees(db)
    fees = db.query(PlatformFee).filter(PlatformFee.active == True).all()

    fee_dict = {}
    for fee in fees:
        fee_dict[fee.transaction_type] = {
            "percent": basis_points_to_percent(fee.percent),
            "flat_cents": fee.flat_cents
        }

    return {
        "fees": fee_dict,
        "note": "Fees charged to consumer. Creator receives subtotal minus payment processor fees."
    }


@router.get("/fees/{transaction_type}")
async def get_fee(transaction_type: str, db: Session = Depends(get_db)):
    """Get fee configuration for a specific transaction type."""
    fee = db.query(PlatformFee).filter(
        PlatformFee.transaction_type == transaction_type,
        PlatformFee.active == True
    ).first()

    if not fee:
        raise HTTPException(status_code=404, detail=f"Unknown transaction type: {transaction_type}")

    return {
        "transaction_type": fee.transaction_type,
        "percent": basis_points_to_percent(fee.percent),
        "flat_cents": fee.flat_cents
    }


@router.put("/fees/{transaction_type}")
async def update_fee(
    transaction_type: str,
    request: FeeUpdateRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """
    Update fee configuration for a transaction type.
    - percent: Percentage fee (e.g., 5.0 = 5%)
    - flat_cents: Flat fee in cents (e.g., 99 = $0.99)
    """
    fee = db.query(PlatformFee).filter(PlatformFee.transaction_type == transaction_type).first()

    if not fee:
        # Create new fee type
        fee = PlatformFee(
            transaction_type=transaction_type,
            percent=percent_to_basis_points(request.percent) if request.percent is not None else 0,
            flat_cents=request.flat_cents if request.flat_cents is not None else 0
        )
        db.add(fee)
    else:
        if request.percent is not None:
            fee.percent = percent_to_basis_points(request.percent)
        if request.flat_cents is not None:
            fee.flat_cents = request.flat_cents

    db.commit()
    db.refresh(fee)

    return {
        "transaction_type": fee.transaction_type,
        "percent": basis_points_to_percent(fee.percent),
        "flat_cents": fee.flat_cents,
        "message": "Fee updated successfully"
    }


@router.post("/fees")
async def create_fee(
    request: CreateFeeRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """Create a new transaction type with fees."""
    existing = db.query(PlatformFee).filter(PlatformFee.transaction_type == request.transaction_type).first()
    if existing:
        raise HTTPException(status_code=400, detail="Transaction type already exists")

    fee = PlatformFee(
        transaction_type=request.transaction_type,
        percent=percent_to_basis_points(request.percent),
        flat_cents=request.flat_cents
    )
    db.add(fee)
    db.commit()
    db.refresh(fee)

    return {
        "transaction_type": fee.transaction_type,
        "percent": basis_points_to_percent(fee.percent),
        "flat_cents": fee.flat_cents,
        "message": "Fee created successfully"
    }


@router.delete("/fees/{transaction_type}")
async def delete_fee(
    transaction_type: str,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """Delete (deactivate) a fee type."""
    fee = db.query(PlatformFee).filter(PlatformFee.transaction_type == transaction_type).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee type not found")

    fee.active = False
    db.commit()

    return {"message": f"Fee type '{transaction_type}' deleted"}


@router.post("/calculate")
async def calculate_fee(transaction_type: str, amount_cents: int, db: Session = Depends(get_db)):
    """
    Calculate the fee breakdown for a transaction.
    """
    seed_default_fees(db)
    fee = db.query(PlatformFee).filter(
        PlatformFee.transaction_type == transaction_type,
        PlatformFee.active == True
    ).first()

    if not fee:
        raise HTTPException(status_code=404, detail=f"Unknown transaction type: {transaction_type}")

    percent = basis_points_to_percent(fee.percent)
    percent_fee = int(amount_cents * (percent / 100))
    flat_fee = fee.flat_cents
    total_fee = percent_fee + flat_fee

    return FeeCalculation(
        subtotal_cents=amount_cents,
        percent_fee_cents=percent_fee,
        flat_fee_cents=flat_fee,
        total_fee_cents=total_fee,
        consumer_total_cents=amount_cents + total_fee,
        creator_receives_cents=amount_cents
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(request: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Create a checkout session with platform fees applied.
    Returns a URL to redirect the consumer to the payment gateway.
    """
    seed_default_fees(db)
    seed_default_plan(db)

    # Determine base amount and transaction type
    plan = None
    subtotal_cents: Optional[int] = request.amount_cents
    transaction_type = request.transaction_type or "subscription"

    if request.plan_id:
        try:
            plan_uuid = UUID(request.plan_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plan_id format")

        plan = db.query(Plan).filter(Plan.id == plan_uuid, Plan.active == True).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        subtotal_cents = plan.amount_cents
        transaction_type = "subscription"

    if subtotal_cents is None:
        raise HTTPException(status_code=400, detail="amount_cents or plan_id is required")

    # Calculate fees
    fee = db.query(PlatformFee).filter(
        PlatformFee.transaction_type == transaction_type,
        PlatformFee.active == True
    ).first()

    if not fee:
        raise HTTPException(status_code=404, detail=f"Unknown transaction type: {transaction_type}")

    percent = basis_points_to_percent(fee.percent)
    percent_fee = int(subtotal_cents * (percent / 100))
    total_fee = percent_fee + fee.flat_cents
    total_cents = subtotal_cents + total_fee

    # Generate checkout URL based on gateway (scaffolding only)
    session_id = str(uuid.uuid4())

    if request.gateway == "ccbill":
        # CCBill FlexForms URL format
        # In production, you'd use actual CCBill credentials and form
        checkout_url = f"https://bill.ccbill.com/jpost/signup.cgi?clientAccnum=YOUR_ACCOUNT&clientSubacc=0000&formName=YOUR_FORM&amount={total_cents/100:.2f}&currencyCode=840&session_id={session_id}"
    elif request.gateway == "segpay":
        # Segpay URL format
        checkout_url = f"https://secure2.segpay.com/billing/po498/YOUR_PACKAGE?amount={total_cents/100:.2f}&session_id={session_id}"
    elif request.gateway == "epoch":
        # Epoch URL format
        checkout_url = f"https://epoch.com/cgi-bin/epoch.pl?pi_code=YOUR_CODE&amount={total_cents/100:.2f}&session_id={session_id}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported gateway: {request.gateway}")

    return CheckoutResponse(
        checkout_url=checkout_url,
        session_id=session_id,
        subtotal_cents=subtotal_cents,
        fee_cents=total_fee,
        total_cents=total_cents,
        plan_id=str(plan.id) if plan else None,
    )


@router.get("/plans")
async def list_plans(db: Session = Depends(get_db)):
    """List available subscription plans."""
    seed_default_plan(db)
    plans = db.query(Plan).filter(Plan.active == True).all()
    return [
        {
            "id": str(plan.id),
            "name": plan.name,
            "interval": plan.interval,
            "amount_cents": plan.amount_cents,
            "currency": plan.currency
        }
        for plan in plans
    ]


class PlanCreateRequest(BaseModel):
    name: str
    interval: str
    amount_cents: int
    currency: str = "USD"
    gateway_code: Optional[str] = None
    active: bool = True


@router.post("/plans")
async def create_plan(
    req: PlanCreateRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(require_admin)
):
    """Create a new subscription plan."""
    plan = Plan(
        name=req.name,
        interval=req.interval,
        amount_cents=req.amount_cents,
        currency=req.currency,
        gateway_code=req.gateway_code,
        active=req.active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {
        "id": str(plan.id),
        "name": plan.name,
        "interval": plan.interval,
        "amount_cents": plan.amount_cents,
        "currency": plan.currency,
        "gateway_code": plan.gateway_code,
        "active": plan.active,
    }


@router.get("/policy")
async def billing_policy(db: Session = Depends(get_db)):
    """
    Billing policy snapshot for clients.
    - Membership baseline: $5.99/week charged to the end consumer
    - AI usage: small free allowance, overage billed to consumer
    """
    plan = seed_default_plan(db)
    usage = seed_usage_policy(db)
    seed_default_fees(db)

    fees = db.query(PlatformFee).filter(PlatformFee.active == True).all()
    fee_map = {
        f.transaction_type: {
            "percent": basis_points_to_percent(f.percent),
            "flat_cents": f.flat_cents,
        }
        for f in fees
    }

    return {
        "membership": {
            "plan_id": str(plan.id),
            "name": plan.name,
            "interval": plan.interval,
            "amount_cents": plan.amount_cents,
            "currency": plan.currency,
        },
        "ai_usage": {
            "free_units": usage.free_units,
            "unit": usage.unit,
            "overage_cents_per_unit": usage.overage_cents_per_unit,
            "notes": usage.notes,
        },
        "fees": fee_map,
        "note": "Fees and AI overage are charged to the end consumer; creators are not billed platform fees.",
    }


@router.get("/subscription")
async def get_subscription():
    """Get current user subscription."""
    return {"status": "none"}
