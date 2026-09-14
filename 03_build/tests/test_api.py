"""
FastAPI Endpoints Test Suite.
Verifies /api/scenarios, /api/scenarios/{id}, /api/optimize, and /api/health.
"""

import pytest
from fastapi.testclient import TestClient
from simulator.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Synthetic" in data["data_mode"]


def test_list_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 4
    ids = [s["id"] for s in scenarios]
    assert "gold_standard" in ids
    assert "normal" in ids
    assert "conflict" in ids
    assert "urgent" in ids
    for s in scenarios:
        assert s["is_synthetic"] is True


def test_optimize_endpoint_gold_standard():
    payload = {"scenario_id": "gold_standard", "horizon": "weekly"}
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["is_synthetic"] is True
    assert "baseline" in data
    assert "optimized" in data
    assert "delta" in data

    # Verify optimizer improved closure hours on gold standard
    assert data["delta"]["block_hours_saved"] >= 3
    assert data["optimized"]["metrics"]["train_conflict_count"] == 0
    assert data["delta"]["integrated_blocks_count"] >= 1


def test_optimize_endpoint_conflict_scenario():
    payload = {"scenario_id": "conflict", "horizon": "weekly"}
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["optimized"]["metrics"]["train_conflict_count"] == 0
    assert len(data["optimized"]["blocks"]) > 0
