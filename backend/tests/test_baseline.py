import pytest
from app.services.query_parser import parse_query
from app.services.dataset_service import load_dataset, dataset_metadata

def test_query_parser_sst():
    intent = parse_query("Show SST evolution in the Arabian Sea during June 2025")
    assert intent.category == "data"
    assert intent.variable == "sst"
    assert intent.region == "Arabian Sea"
    assert intent.visualization == "animated_map"
    assert intent.start_date == "2025-06-01"
    assert intent.end_date == "2025-06-30"

def test_query_parser_conceptual():
    intent = parse_query("What is coastal upwelling?")
    assert intent.category == "conceptual"
    assert intent.visualization == "conceptual_diagram"

def test_query_parser_multilingual():
    # Telugu query for current pattern
    intent_te = parse_query("జూన్ 2025లో సముద్ర ప్రవాహ నమూనాను చూపించండి")
    assert intent_te.category == "data"
    assert intent_te.variable == "current"

def test_dataset_loading_and_metadata():
    ds = load_dataset()
    meta = dataset_metadata(ds)
    assert meta["scientific_classification"] == "SYNTHETIC_PROTOTYPE"
    assert "sst" in meta["variables"]
    assert "temperature" in meta["variables"]
    assert meta["depth_range"] == [0.0, 200.0]
    ds.close()
