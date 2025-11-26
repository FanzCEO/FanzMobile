from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from typing import Dict

# Import routers (will create these next)
from app.routers import auth, messages, contacts, calendar, workflows

# Environment configuration
ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3100").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print(f"🚀 CRM Escort AI starting in {ENV} mode...")
    
    # TODO: Initialize database connection pool
    # TODO: Initialize Redis connection
    # TODO: Load AI models if needed
    
    yield
    
    # Shutdown
    print("👋 Shutting down CRM Escort AI...")
    # TODO: Close database connections
    # TODO: Close Redis connections


# Initialize FastAPI app
app = FastAPI(
    title="CRM Escort AI",
    description="AI Chief of Staff for Messages - Automate contacts, meetings, and follow-ups",
    version="0.1.0",
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "crm-escort-ai",
        "version": "0.1.0",
        "environment": ENV,
    }


# Root endpoint
@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint with API information"""
    return {
        "service": "CRM Escort AI",
        "version": "0.1.0",
        "docs": "/docs" if DEBUG else "disabled",
        "health": "/health",
    }


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["Workflows"])


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all exception handler"""
    if DEBUG:
        raise exc
    return {
        "error": "Internal server error",
        "detail": str(exc) if DEBUG else "An unexpected error occurred",
    }
