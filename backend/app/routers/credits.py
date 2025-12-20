"""
AI Credits Router
Manages AI usage credits for WickedCRM users.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/credits", tags=["Credits"])


# ============== DATA MODELS ==============

class CreditBalance(BaseModel):
    user_id: str
    balance: int  # Current credit balance
    free_credits: int  # Free credits included in plan
    purchased_credits: int  # Additional purchased credits
    used_this_period: int  # Credits used in current billing period
    period_start: str
    period_end: str


class CreditTransaction(BaseModel):
    id: str
    user_id: str
    amount: int  # Positive for additions, negative for usage
    type: str  # grant, purchase, usage, refund
    description: str
    created_at: str


class PurchaseCreditsRequest(BaseModel):
    amount: int  # Number of credits to purchase
    payment_method: Optional[str] = None


# ============== IN-MEMORY STORAGE ==============

credit_balances: dict[str, CreditBalance] = {}
credit_transactions: dict[str, List[CreditTransaction]] = {}

# Credit pricing
CREDIT_PRICE_CENTS = 10  # $0.10 per credit
CREDIT_PACKAGES = [
    {"credits": 100, "price_cents": 999, "bonus": 0},      # $9.99
    {"credits": 500, "price_cents": 3999, "bonus": 50},    # $39.99 + 50 bonus
    {"credits": 1000, "price_cents": 6999, "bonus": 200},  # $69.99 + 200 bonus
    {"credits": 5000, "price_cents": 29999, "bonus": 1500}, # $299.99 + 1500 bonus
]


# ============== HELPER FUNCTIONS ==============

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    """Extract user ID from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        import jwt
        from app.config import settings
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub") or payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_or_create_balance(user_id: str) -> CreditBalance:
    """Get or create credit balance for user."""
    if user_id not in credit_balances:
        now = datetime.utcnow()
        credit_balances[user_id] = CreditBalance(
            user_id=user_id,
            balance=100,  # Start with 100 free credits
            free_credits=100,
            purchased_credits=0,
            used_this_period=0,
            period_start=now.isoformat(),
            period_end=now.replace(month=now.month + 1 if now.month < 12 else 1).isoformat()
        )
    return credit_balances[user_id]


# ============== ROUTES ==============

@router.get("")
async def get_credits(user_id: str = Depends(get_user_id_from_token)) -> CreditBalance:
    """Get current credit balance."""
    return get_or_create_balance(user_id)


@router.get("/balance")
async def get_credit_balance(user_id: str = Depends(get_user_id_from_token)):
    """Get simplified credit balance."""
    balance = get_or_create_balance(user_id)
    return {
        "balance": balance.balance,
        "used_this_period": balance.used_this_period,
        "free_remaining": max(0, balance.free_credits - balance.used_this_period)
    }


@router.get("/transactions")
async def get_transactions(
    user_id: str = Depends(get_user_id_from_token),
    limit: int = 50
) -> List[CreditTransaction]:
    """Get credit transaction history."""
    transactions = credit_transactions.get(user_id, [])
    return sorted(transactions, key=lambda x: x.created_at, reverse=True)[:limit]


@router.get("/packages")
async def get_credit_packages():
    """Get available credit purchase packages."""
    return {
        "packages": CREDIT_PACKAGES,
        "per_credit_price_cents": CREDIT_PRICE_CENTS
    }


@router.post("/purchase")
async def purchase_credits(
    request: PurchaseCreditsRequest,
    user_id: str = Depends(get_user_id_from_token)
):
    """Purchase additional credits."""
    # Find matching package or calculate custom price
    package = next((p for p in CREDIT_PACKAGES if p["credits"] == request.amount), None)

    if package:
        price_cents = package["price_cents"]
        bonus = package["bonus"]
    else:
        price_cents = request.amount * CREDIT_PRICE_CENTS
        bonus = 0

    total_credits = request.amount + bonus

    # In production, this would integrate with payment processor
    # For now, just add the credits

    balance = get_or_create_balance(user_id)
    balance.balance += total_credits
    balance.purchased_credits += total_credits

    # Record transaction
    if user_id not in credit_transactions:
        credit_transactions[user_id] = []

    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        amount=total_credits,
        type="purchase",
        description=f"Purchased {request.amount} credits" + (f" + {bonus} bonus" if bonus else ""),
        created_at=datetime.utcnow().isoformat()
    )
    credit_transactions[user_id].append(transaction)

    return {
        "status": "success",
        "credits_added": total_credits,
        "new_balance": balance.balance,
        "price_cents": price_cents,
        "transaction_id": transaction.id
    }


@router.post("/use")
async def use_credits(
    amount: int,
    description: str = "AI usage",
    user_id: str = Depends(get_user_id_from_token)
):
    """Use credits (internal endpoint for AI services)."""
    balance = get_or_create_balance(user_id)

    if balance.balance < amount:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "Insufficient credits",
                "required": amount,
                "available": balance.balance
            }
        )

    balance.balance -= amount
    balance.used_this_period += amount

    # Record transaction
    if user_id not in credit_transactions:
        credit_transactions[user_id] = []

    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        amount=-amount,
        type="usage",
        description=description,
        created_at=datetime.utcnow().isoformat()
    )
    credit_transactions[user_id].append(transaction)

    return {
        "status": "success",
        "credits_used": amount,
        "remaining_balance": balance.balance
    }


@router.post("/grant")
async def grant_credits(
    user_id_target: str,
    amount: int,
    reason: str = "Admin grant",
    admin_user: str = Depends(get_user_id_from_token)
):
    """Grant credits to a user (admin only)."""
    # In production, verify admin_user is actually an admin

    balance = get_or_create_balance(user_id_target)
    balance.balance += amount
    balance.free_credits += amount

    # Record transaction
    if user_id_target not in credit_transactions:
        credit_transactions[user_id_target] = []

    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user_id_target,
        amount=amount,
        type="grant",
        description=f"Admin grant: {reason}",
        created_at=datetime.utcnow().isoformat()
    )
    credit_transactions[user_id_target].append(transaction)

    return {
        "status": "success",
        "credits_granted": amount,
        "new_balance": balance.balance
    }
