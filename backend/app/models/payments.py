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
