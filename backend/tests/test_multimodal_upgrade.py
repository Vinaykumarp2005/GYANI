import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.history_service import (
    init_db,
    save_record,
    fetch_all,
    fetch_by_id,
    delete_record,
)
from app.services.llm_service import answer_query, classify_intent, generate_image

client = TestClient(app)

def test_history_crud():
    init_db()
    test_session = "test_sess_123"
    
    # Save a record
    qid = save_record(
        session_id=test_session,
        user_query="What is thermocline?",
        text_response="Thermocline is the layer in the ocean where temperature decreases rapidly with depth.",
        visualization_type="text_answer",
        primary_modality="text",
        modality_reasoning="Explanation inquiry",
    )
    assert qid is not None
    assert isinstance(qid, str)

    # Fetch by id
    rec = fetch_by_id(qid)
    assert rec is not None
    assert rec["user_query"] == "What is thermocline?"
    assert rec["primary_modality"] == "text"
    assert rec["session_id"] == test_session

    # Fetch all with session filter
    records = fetch_all(session_id=test_session)
    assert any(r["query_id"] == qid for r in records)

    # Delete record
    deleted = delete_record(qid)
    assert deleted is True

    # Verify deleted
    assert fetch_by_id(qid) is None

def test_llm_service_graceful_fallbacks():
    # Without an API key configured, services must return structured fallbacks without crashing
    ans = answer_query("What is coastal upwelling?")
    assert ans["success"] is True
    assert "text" in ans
    assert len(ans["text"]) > 0

    intent = classify_intent("Show 3D temperature profile in Arabian Sea")
    assert "primary_modality" in intent
    assert intent["primary_modality"] in ["3d", "image", "chart", "text"]

def test_api_answer_endpoint():
    res = client.post(
        "/api/answer",
        json={"query": "Explain thermohaline circulation", "session_id": "test_session_api"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "text" in data
    assert len(data["text"]) > 0

def test_api_history_endpoint():
    res = client.get("/api/history")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "records" in data
    assert isinstance(data["records"], list)

def test_api_generate_image_fallback():
    res = client.post(
        "/api/generate-image",
        json={"query": "Tsunami wave simulation", "session_id": "test_session_api"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "success" in data
    assert "refined_prompt" in data
