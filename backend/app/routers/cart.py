"""
Cart Router
Shopping cart management for WickedCRM.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/cart", tags=["Cart"])


# ============== DATA MODELS ==============

class CartItem(BaseModel):
    id: str
    user_id: str
    product_type: str  # membership, credits, addon
    product_id: str
    quantity: int = 1
    price_cents: int
    name: Optional[str] = None
    created_at: str


class AddCartItemRequest(BaseModel):
    product_type: str
    product_id: str
    quantity: int = 1
    price_cents: int
    name: Optional[str] = None


class UpdateCartItemRequest(BaseModel):
    quantity: int


# ============== IN-MEMORY STORAGE ==============

carts: dict[str, List[CartItem]] = {}


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


# ============== ROUTES ==============

@router.get("")
async def get_cart(user_id: str = Depends(get_user_id_from_token)) -> List[CartItem]:
    """Get all items in the user's cart."""
    return carts.get(user_id, [])


@router.post("")
async def add_to_cart(
    request: AddCartItemRequest,
    user_id: str = Depends(get_user_id_from_token)
) -> CartItem:
    """Add an item to the cart."""
    if user_id not in carts:
        carts[user_id] = []

    # Check if item already exists
    for item in carts[user_id]:
        if item.product_id == request.product_id and item.product_type == request.product_type:
            item.quantity += request.quantity
            return item

    # Create new item
    new_item = CartItem(
        id=str(uuid.uuid4()),
        user_id=user_id,
        product_type=request.product_type,
        product_id=request.product_id,
        quantity=request.quantity,
        price_cents=request.price_cents,
        name=request.name,
        created_at=datetime.utcnow().isoformat()
    )
    carts[user_id].append(new_item)
    return new_item


@router.put("/{item_id}")
async def update_cart_item(
    item_id: str,
    request: UpdateCartItemRequest,
    user_id: str = Depends(get_user_id_from_token)
) -> CartItem:
    """Update cart item quantity."""
    if user_id not in carts:
        raise HTTPException(status_code=404, detail="Cart not found")

    for item in carts[user_id]:
        if item.id == item_id:
            if request.quantity <= 0:
                carts[user_id].remove(item)
                return item
            item.quantity = request.quantity
            return item

    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: str,
    user_id: str = Depends(get_user_id_from_token)
):
    """Remove an item from the cart."""
    if user_id not in carts:
        raise HTTPException(status_code=404, detail="Cart not found")

    for item in carts[user_id]:
        if item.id == item_id:
            carts[user_id].remove(item)
            return {"status": "removed", "id": item_id}

    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("")
async def clear_cart(user_id: str = Depends(get_user_id_from_token)):
    """Clear all items from the cart."""
    carts[user_id] = []
    return {"status": "cleared"}


@router.get("/summary")
async def cart_summary(user_id: str = Depends(get_user_id_from_token)):
    """Get cart summary with totals."""
    items = carts.get(user_id, [])

    subtotal = sum(item.price_cents * item.quantity for item in items)
    item_count = sum(item.quantity for item in items)

    # Apply platform fees (from billing)
    platform_fee_percent = 5.0  # 5%
    platform_fee_flat = 50  # $0.50
    platform_fee = int(subtotal * (platform_fee_percent / 100)) + platform_fee_flat if subtotal > 0 else 0

    return {
        "items": items,
        "item_count": item_count,
        "subtotal_cents": subtotal,
        "platform_fee_cents": platform_fee,
        "total_cents": subtotal + platform_fee
    }
