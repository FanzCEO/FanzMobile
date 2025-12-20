"""
WickedCRM Backend - Main Application
FastAPI backend for WickedCRM with AI-powered features.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routers import (
    ai,
    moderation,
    adult_ai,
    llm,
    messages,
    workflows,
    integrations,
    contacts,
    events,
    verification,
    user_data,
    auth,
    help_bot,
    admin,
    livekit,
    websocket,
    threads,
    billing,
    communications,
    cart,
    credits,
    dispatch,
    memberships,
)
from app.database import Base, engine
from app.models import payments  # noqa: F401 - ensure models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print(f"Starting {settings.app_name}...")
    print(f"OpenAI configured: {bool(settings.openai_api_key)}")
    # Ensure billing/admin tables exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="WickedCRM API",
    description="AI-powered CRM for adult content creators",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "https://rent.fanz.website",
        "http://192.168.5.240:5173",
        "capacitor://localhost",  # iOS Capacitor app
        "ionic://localhost",  # Ionic apps
        "http://localhost",  # Android WebView
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router)
app.include_router(moderation.router)
app.include_router(adult_ai.router)
app.include_router(llm.router)
app.include_router(messages.router)
app.include_router(workflows.router)
app.include_router(integrations.router)
app.include_router(contacts.router)
app.include_router(events.router)
app.include_router(verification.router)
app.include_router(user_data.router)
app.include_router(auth.router)
app.include_router(help_bot.router)
app.include_router(admin.router)
app.include_router(livekit.router)
app.include_router(websocket.router)
app.include_router(threads.router)
app.include_router(billing.router)
app.include_router(communications.router)
app.include_router(cart.router)
app.include_router(credits.router)
app.include_router(dispatch.router)
app.include_router(memberships.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ai_configured": bool(settings.openai_api_key)
    }


# Additional auth and resource routes would be added here
# For now, focusing on the AI functionality that the frontend needs
