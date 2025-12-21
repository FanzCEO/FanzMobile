"""
WickedCRM Models
"""

from app.models.user import User
from app.models.contact import Contact
from app.models.event import Event
from app.models.settings import UserSettings
from app.models.dispatch import DispatchResource, DispatchJob, DispatchAlert
from app.models.workflow import Workflow, WorkflowLog, WebhookEndpoint

__all__ = [
    "User",
    "Contact",
    "Event",
    "UserSettings",
    "DispatchResource",
    "DispatchJob",
    "DispatchAlert",
    "Workflow",
    "WorkflowLog",
    "WebhookEndpoint",
]
