import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["app"] == "The Lenny Growth Assistant"
        assert data["status"] == "operational"

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "database" in data
        assert data["vector_index_count"] > 0

@pytest.mark.asyncio
async def test_session_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Create session
        create_resp = await client.post("/api/sessions", json={"title": "Test Growth Session"})
        assert create_resp.status_code == 200
        session_data = create_resp.json()
        session_id = session_data["id"]
        assert session_data["title"] == "Test Growth Session"

        # List sessions
        list_resp = await client.get("/api/sessions")
        assert list_resp.status_code == 200
        sessions = list_resp.json()
        assert any(s["id"] == session_id for s in sessions)

        # Get session messages (empty initially)
        msg_resp = await client.get(f"/api/sessions/{session_id}/messages")
        assert msg_resp.status_code == 200
        assert len(msg_resp.json()) == 0

        # Delete session
        del_resp = await client.delete(f"/api/sessions/{session_id}")
        assert del_resp.status_code == 200
