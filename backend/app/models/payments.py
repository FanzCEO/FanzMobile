import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Plan(Base):
    __tablename__ = "billing_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    gateway_code = Column(String(120), nullable=True)  # e.g., CCBill sub account or price point
    interval = Column(String(32), nullable=False, default="weekly")  # weekly, monthly, annual
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(8), nullable=False, default="USD")
    active = Column(Boolean, default=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "billing_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(64), nullable=False)
    plan_id = Column(UUID(as_uuid=True), nullable=False)
    gateway = Column(String(64), nullable=False)  # ccbill, segpay, epoch, vendo, etc.
    gateway_subscription_id = Column(String(128), nullable=True)
    status = Column(String(32), nullable=False, default="active")  # active, past_due, canceled, trialing
    current_period_end = Column(DateTime, nullable=True)
    cancel_at = Column(DateTime, nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "billing_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(64), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), nullable=True)
    gateway = Column(String(64), nullable=False)
    gateway_transaction_id = Column(String(128), nullable=True)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(8), nullable=False, default="USD")
    type = Column(String(32), nullable=False, default="charge")  # charge, refund, payout
    status = Column(String(32), nullable=False, default="succeeded")  # succeeded, pending, failed
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Payout(Base):
    __tablename__ = "billing_payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(64), nullable=False)
    method = Column(String(64), nullable=False)  # paxum, wire, crypto, cosmo_pay
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(8), nullable=False, default="USD")
    destination = Column(JSON, nullable=True)  # e.g., wallet address, bank info
    status = Column(String(32), nullable=False, default="pending")  # pending, processing, paid, failed
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WebhookEvent(Base):
    __tablename__ = "billing_webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(64), nullable=False)
    external_id = Column(String(128), nullable=True)
    event_type = Column(String(128), nullable=True)
    payload = Column(JSON, nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)


class PlatformFee(Base):
    """Platform fees charged to consumers per transaction type."""
    __tablename__ = "platform_fees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_type = Column(String(64), unique=True, nullable=False)  # subscription, tip, ppv, etc.
    percent = Column(Integer, nullable=False, default=0)  # Stored as basis points (500 = 5.00%)
    flat_cents = Column(Integer, nullable=False, default=0)  # Flat fee in cents
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UsagePolicy(Base):
    """Usage-based charging policy (e.g., AI usage over free allowance)."""
    __tablename__ = "usage_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), unique=True, nullable=False)  # e.g., ai_usage
    free_units = Column(Integer, nullable=False, default=0)  # Free units (e.g., 10_000 tokens)
    unit = Column(String(32), nullable=False, default="tokens")  # tokens, seconds, messages
    overage_cents_per_unit = Column(Integer, nullable=False, default=0)  # Cost per unit over free allowance
    notes = Column(String(512), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Thread(Base):
    """Communication threads for PTT/messaging."""
    __tablename__ = "comm_threads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    channel = Column(String(64), nullable=True)  # PTT, SMS, WhatsApp, etc.
    created_by = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ThreadEvent(Base):
    """Events within a thread (messages, voice clips, etc.)."""
    __tablename__ = "comm_thread_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(UUID(as_uuid=True), nullable=False)
    event_type = Column(String(32), nullable=False, default="message")  # message, voice, join, leave, ptt_start, ptt_end
    user_id = Column(String(64), nullable=True)
    body = Column(String(4000), nullable=True)
    channel = Column(String(64), nullable=True)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AdminUser(Base):
    """Admin users with elevated privileges."""
    __tablename__ = "admin_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(64), unique=True, nullable=False)
    role = Column(String(32), nullable=False, default="admin")  # admin, superadmin
    created_at = Column(DateTime, default=datetime.utcnow)


class UserAccess(Base):
    """Admin-managed access flags for users (comped/subscription)."""
    __tablename__ = "user_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    comped = Column(Boolean, default=False)
    active_subscription = Column(Boolean, default=False)
    subscription_plan = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FeatureToggle(Base):
    """Feature toggles controlled by admin panel."""
    __tablename__ = "feature_toggles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(64), unique=True, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
