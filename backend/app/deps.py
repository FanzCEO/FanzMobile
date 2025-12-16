"""
Application Dependencies
Common dependencies used across routers.
"""

from app.services.admin_service import require_admin, is_admin, get_user_id_from_token

__all__ = ["require_admin", "is_admin", "get_user_id_from_token"]
