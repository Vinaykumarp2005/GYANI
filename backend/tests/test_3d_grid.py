import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.query_parser import parse_query
from app.services.dataset_service import load_dataset, extract_3d_grid

client = TestClient(app)

def test_query_parser_3d():
    intent = parse_query("Show 3D temperature profile in Arabian Sea")
    assert intent.is_3d is True
    assert intent.visualization == "3d_depth_layers"
    assert intent.variable == "temperature"

def test_query_parser_3d_multilingual():
    # Telugu: 3D దృశ్యం
    intent_te = parse_query("అరేబియా సముద్రంలో ఉష్ణోగ్రత 3D దృశ్యం")
    assert intent_te.is_3d is True
    assert intent_te.visualization == "3d_depth_layers"

def test_extract_3d_grid_structure():
    ds = load_dataset()
    grid = extract_3d_grid(ds)
    assert grid["variable"] == "temperature"
    assert "coordinates" in grid
    assert len(grid["coordinates"]["depths"]) == 8
    assert len(grid["coordinates"]["times"]) == 30
    assert len(grid["layers"]) == 8
    # verify first layer has 30 time steps
    assert len(grid["layers"][0]["values_by_time"]) == 30
    ds.close()

def test_api_visualize_3d_endpoint():
    response = client.post("/api/visualize", json={"query": "Show 3D depth layers for temperature"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_3d"] is True
    assert "grid_3d" in data
    assert len(data["grid_3d"]["layers"]) == 8
    assert data["grid_3d"]["data_classification"] == "SYNTHETIC_PROTOTYPE"

def test_api_dedicated_3d_endpoint():
    response = client.post("/api/visualize/3d", json={"query": "temperature underwater view"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "grid_3d" in data
