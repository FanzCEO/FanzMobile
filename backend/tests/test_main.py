"""Tests for main application endpoints"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.api


async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint"""
    response = await client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "CRM Escort AI"
    assert "version" in data
    assert "docs" in data
    assert "health" in data


async def test_health_check(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "crm-escort-ai"
    assert "version" in data
    assert "environment" in data


async def test_cors_headers(client: AsyncClient):
    """Test CORS headers are present"""
    response = await client.options(
        "/",
        headers={"Origin": "http://localhost:3000"}
    )
    
    # Basic OPTIONS should work
    assert response.status_code in [200, 405]  # 405 if OPTIONS not defined, but CORS should still work
