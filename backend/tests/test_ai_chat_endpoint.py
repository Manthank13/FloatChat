"""
Integration test suite for FloatChat FastAPI Chat Endpoint (POST /api/v1/chat).
Verifies end-to-end communication from HTTP request through AI Engine, ARGO Data Layer,
and response synthesis with citations, chart data, and map markers.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Verify backend health endpoint is online."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ok", "healthy")


def test_chat_endpoint_chennai_salinity(client):
    """Verify Query 1: Basic retrieval with citations and chart points."""
    payload = {
        "query": "What is the salinity near Chennai at 100 meters?",
        "session_id": "test-session-int-001",
        "use_llm": False,
    }
    resp = client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    # Structural contracts
    assert "query" in data
    assert "answer" in data
    assert "Chennai" in data["answer"]
    assert "citations" in data
    assert len(data["citations"]) > 0
    assert data["citations"][0]["platform_id"] in ("2903334", "2903335")
    assert "chart_data" in data
    assert data["chart_data"]["parameter"] == "PSAL"
    assert "map_markers" in data
    assert len(data["map_markers"]) > 0


def test_chat_endpoint_multi_turn_follow_up(client):
    """Verify Query 2: Contextual follow-up inherits location and parameter."""
    session_id = "test-session-int-multiturn"

    # Turn 1: Establish location and parameter
    t1_payload = {
        "query": "What is the salinity near Chennai at 100 meters?",
        "session_id": session_id,
        "use_llm": False,
    }
    t1_resp = client.post("/api/v1/chat", json=t1_payload)
    assert t1_resp.status_code == 200

    # Turn 2: Follow-up changing depth to 200m
    t2_payload = {
        "query": "What about at 200 meters?",
        "session_id": session_id,
        "use_llm": False,
    }
    t2_resp = client.post("/api/v1/chat", json=t2_payload)
    assert t2_resp.status_code == 200
    t2_data = t2_resp.json()
    assert "Chennai" in t2_data["answer"]

    # Verify session history endpoint
    hist_resp = client.get(f"/api/v1/chat/memory/{session_id}")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["session_id"] == session_id
    assert hist_data["turn_count"] >= 2


def test_chat_endpoint_comparison_arabian_sea_vs_bay_of_bengal(client):
    """Verify Query 3: Scientific comparison query."""
    payload = {
        "query": "Compare salinity in the Arabian Sea and Bay of Bengal.",
        "session_id": "test-session-int-comp",
        "use_llm": False,
    }
    resp = client.post("/api/v1/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "Arabian Sea" in data["answer"] or "Bay of Bengal" in data["answer"]
    assert data["intent"] in ("comparison_query", "profile_query", "spatial_query")


def test_chat_stream_endpoint(client):
    """Verify SSE streaming endpoint yields event stream chunks."""
    payload = {
        "query": "What is the salinity near Chennai at 100 meters?",
        "use_llm": False,
    }
    resp = client.post("/api/v1/chat/stream", json=payload)
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    content = resp.text
    assert "data:" in content
    assert "[DONE]" in content
