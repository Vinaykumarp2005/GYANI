import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.gemini_service import fallback_classify_query, classify_query

client = TestClient(app)


def test_classification_categories():
    # 1. TEXT queries
    c_text1 = fallback_classify_query("What is ocean forecast.")
    assert c_text1.category == "TEXT"

    c_text2 = fallback_classify_query("Explain the importance of ocean salinity.")
    assert c_text2.category == "TEXT"

    # 2. 2D_VISUALIZATION queries
    c_2d = fallback_classify_query("Generate a heatmap of ocean temperatures.")
    assert c_2d.category == "2D_VISUALIZATION"

    # 3. 3D_VISUALIZATION queries
    c_3d = fallback_classify_query("Visualize ocean temperature at different depths.")
    assert c_3d.category == "3D_VISUALIZATION"

    # 4. IMAGE_GENERATION queries
    c_img = fallback_classify_query("Generate an illustration of underwater ecosystems.")
    assert c_img.category == "IMAGE_GENERATION"


def test_visualize_endpoint_text():
    res = client.post("/api/visualize", json={"query": "What is ocean forecast."})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["category"] == "TEXT"
    assert "answer" in data
    assert len(data["answer"]) > 20


def test_visualize_endpoint_image():
    res = client.post("/api/visualize", json={"query": "Generate an illustration of underwater ecosystems."})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["category"] == "IMAGE_GENERATION"
    assert "visualization" in data
    assert "url" in data["visualization"]


def test_visualize_endpoint_3d():
    res = client.post("/api/visualize", json={"query": "Visualize ocean temperature at different depths."})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["category"] == "3D_VISUALIZATION"
    assert data["is_3d"] is True
    assert "grid_3d" in data


def test_visualize_endpoint_2d():
    res = client.post("/api/visualize", json={"query": "Generate a heatmap of ocean temperatures."})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["category"] == "2D_VISUALIZATION"
    assert "visualization" in data


def test_history_endpoints():
    res = client.get("/api/history")
    assert res.status_code == 200
    data = res.json()
    assert "history" in data
    assert isinstance(data["history"], list)
    assert len(data["history"]) > 0
    # The first item should match recent query
    assert data["history"][0]["category"] in ["TEXT", "IMAGE_GENERATION", "2D_VISUALIZATION", "3D_VISUALIZATION"]
