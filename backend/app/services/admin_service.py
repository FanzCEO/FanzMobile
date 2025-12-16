"""
Admin Service
Handles admin authentication and authorization.
"""

from typing import Optional
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payments import AdminUser
import jwt
from app.config import settings


def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract user ID from JWT token."""
    if not authorization:
        return None

    try:
        # Remove 'Bearer ' prefix
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub") or payload.get("user_id")
    except jwt.exceptions.PyJWTError:
        return None


def is_admin(user_id: str, db: Session) -> bool:
    """Check if a user is an admin."""
    if not user_id:
        return False
    admin = db.query(AdminUser).filter(AdminUser.user_id == user_id).first()
    return admin is not None


def require_admin(
    authorization: Optional[str] = Header(None),
    x_admin_key: Optional[str] = Header(None, convert_underscores=False),
    db: Session = Depends(get_db)
):
    """
    Dependency that requires admin access.
    Accepts either:
    - Bearer JWT for a user present in admin_users table
    - X-Admin-Key header that matches settings.admin_api_key (for service usage)
    """
    if x_admin_key and settings.admin_api_key and x_admin_key == settings.admin_api_key:
        return "admin-key"

    user_id = get_user_id_from_token(authorization)

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not is_admin(user_id, db):
        raise HTTPException(status_code=403, detail="Admin access required")

    return user_id


def add_admin(user_id: str, db: Session, role: str = "admin") -> AdminUser:
    """Add a user as admin."""
    existing = db.query(AdminUser).filter(AdminUser.user_id == user_id).first()
    if existing:
        return existing

    admin = AdminUser(user_id=user_id, role=role)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def remove_admin(user_id: str, db: Session) -> bool:
    """Remove admin status from a user."""
    admin = db.query(AdminUser).filter(AdminUser.user_id == user_id).first()
    if not admin:
        return False

    db.delete(admin)
    db.commit()
    return True


def list_admins(db: Session):
    """List all admin users."""
    return db.query(AdminUser).all()
