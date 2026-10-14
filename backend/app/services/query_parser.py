"""
query_parser.py
---------------
Multilingual ocean-science query normaliser and intent classifier.

Classification strategy (layered):
  1. LLM-based modality classification via llm_service.classify_intent()
     → fast, context-aware; result stored on VisualizationIntent.primary_modality
  2. Heuristic keyword matching (existing logic) — always runs for the
     oceanographic variable / region / date extraction regardless of LLM result.
  3. Heuristic is the sole router when LLM is unavailable or errors out.
"""

import re
from datetime import datetime
from ..models import VisualizationIntent


VARIABLES = {
    "sst": ["sst", "sea surface temperature", "surface temperature"],
    "ssh": ["ssh", "sea surface height", "sea level"],
    "temperature": ["temperature", "temp"],
    "salinity": ["salinity", "salt"],
    "current": ["current", "currents", "current pattern", "flow"],
    "mixed_layer_depth": ["mixed layer depth", "mld"],
}


MULTILINGUAL_ALIASES = {
    # Telugu
    "అరేబియా సముద్రం": "arabian sea", "బంగాళాఖాతం": "bay of bengal",
    "ఉష్ణోగ్రత": "temperature", "లోతు": "depth", "సముద్ర ప్రవాహం": "current",
    "ప్రవాహ నమూనా": "current pattern", "మార్పును": "evolution", "మారింది": "change",
    "జూన్": "june", "అప్‌వెల్లింగ్": "upwelling", "అంటే ఏమిటి": "what is",
    "3డి": "3d", "3D దృశ్యం": "3d view", "లోతు పొరలు": "depth layers",
    # Hindi
    "अरब सागर": "arabian sea", "बंगाल की खाड़ी": "bay of bengal",
    "तापमान": "temperature", "गहराई": "depth", "समुद्री धारा": "current",
    "धारा का पैटर्न": "current pattern", "बदलाव": "evolution", "बदला": "change",
    "जून": "june", "अपवेलिंग": "upwelling", "क्या है": "what is",
    "3डी": "3d", "3D दृश्य": "3d view", "गहराई की परतें": "depth layers",
    # Tamil
    "அரபிக்கடலில்": "arabian sea", "அரபிக்கடல்": "arabian sea",
    "வங்காள விரிகுடாவில்": "bay of bengal", "வங்காள விரிகுடா": "bay of bengal",
    "வெப்பநிலை": "temperature", "ஆழம்": "depth", "நீரோட்டம்": "current",
    "நீரோட்ட வடிவம்": "current pattern", "மாற்றத்தைக்": "evolution",
    "மாற்றம்": "evolution", "மாறியது": "change",
    "ஜூன்": "june", "மேலெழுச்சி": "upwelling", "என்றால் என்ன": "what is",
    "3டி": "3d", "3D காட்சி": "3d view", "ஆழ அடுக்குகள்": "depth layers",
}


def normalize_multilingual_query(q: str) -> str:
    normalized = q
    for source, target in sorted(
        MULTILINGUAL_ALIASES.items(), key=lambda item: len(item[0]), reverse=True
    ):
        normalized = normalized.replace(source, target)
    return normalized


def find_variable(q: str):
    ql = q.lower()
    for variable, phrases in VARIABLES.items():
        if any(p in ql for p in phrases):
            return variable
    return None


def find_dates(q: str):
    # Handles "June 2025", "June", and explicit YYYY-MM-DD ranges.
    ql = q.lower()
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }

    m = re.search(
        r"(january|february|march|april|may|june|july|august|"
        r"september|october|november|december)\s+(\d{4})",
        ql,
    )
    if m:
        month = months[m.group(1)]
        year = int(m.group(2))
        import calendar
        last = calendar.monthrange(year, month)[1]
        return f"{year:04d}-{month:02d}-01", f"{year:04d}-{month:02d}-{last:02d}"

    explicit = re.findall(r"\d{4}-\d{2}-\d{2}", q)
    if len(explicit) >= 2:
        return explicit[0], explicit[1]
    if len(explicit) == 1:
        return explicit[0], explicit[0]

    return None, None


def find_coordinates(q: str):
    patterns = [
        r"(-?\d+(?:\.\d+)?)\s*[°]?\s*(?:n|north)\D+(-?\d+(?:\.\d+)?)\s*[°]?\s*(?:e|east)",
        r"latitude\s*(-?\d+(?:\.\d+)?)\D+longitude\s*(-?\d+(?:\.\d+)?)",
    ]
    for pattern in patterns:
        m = re.search(pattern, q.lower())
        if m:
            return float(m.group(1)), float(m.group(2))
    return None, None


def detect_region(q: str):
    ql = q.lower()
    regions = {
        "Arabian Sea": ["arabian sea"],
        "Bay of Bengal": ["bay of bengal"],
        "Indian Ocean": ["indian ocean"],
        "North Indian Ocean": ["north indian ocean"],
    }
    for name, aliases in regions.items():
        if any(a in ql for a in aliases):
            return name
    return None


def _heuristic_visualization_type(ql: str) -> tuple[str, bool]:
    """
    Return (visualization_type, is_3d) from keyword heuristics.
    Unchanged from original logic.
    """
    three_d_keywords = [
        "3d", "3-d", "three dimensional", "3 dimensional",
        "depth layer", "depth layers", "underwater layer", "underwater layers", "3d view",
    ]
    if any(k in ql for k in three_d_keywords):
        return "3d_depth_layers", True
    if "depth" in ql or "vertical" in ql or "profile" in ql:
        return "depth_time", False
    if "compare" in ql or ("observation" in ql and "model" in ql):
        return "comparison", False
    if "time series" in ql or "timeseries" in ql:
        return "timeseries", False
    if "current" in ql or "vector" in ql:
        return "current_map", False
    if "animation" in ql or "evolution" in ql or "during" in ql:
        return "animated_map", False
    return "static_map", False


def parse_query(query: str) -> VisualizationIntent:
    """
    Parse a natural-language query into a VisualizationIntent.

    Attempts LLM-based modality classification first; falls back to
    heuristics if the LLM is unavailable or fails.
    """
    q = normalize_multilingual_query(query.strip())
    ql = q.lower()

    # ------------------------------------------------------------------
    # Step 1 – LLM modality classification (non-blocking, best-effort)
    # ------------------------------------------------------------------
    primary_modality: str | None = None
    modality_reasoning: str | None = None
    try:
        from .llm_service import classify_intent  # lazy import to avoid circular deps
        llm_result = classify_intent(q)
        primary_modality = llm_result.get("primary_modality")
        modality_reasoning = llm_result.get("reasoning")
    except Exception:
        pass  # silently fall through to heuristics

    # ------------------------------------------------------------------
    # Step 2 – Heuristic conceptual detection (always checked)
    # ------------------------------------------------------------------
    conceptual_terms = [
        "what are", "what is", "explain", "how does",
        "how do", "formation of", "what causes",
    ]
    conceptual_topics = [
        "salt finger", "ocean eddy", "upwelling", "el niño",
        "enso", "iod", "thermocline", "ocean wave",
        "wind sea", "swell", "stratification", "air-sea interaction",
    ]

    if any(t in ql for t in conceptual_terms) and any(t in ql for t in conceptual_topics):
        return VisualizationIntent(
            category="conceptual",
            visualization="conceptual_diagram",
            region=detect_region(q),
            primary_modality=primary_modality or "text",
            modality_reasoning=modality_reasoning,
        )

    # ------------------------------------------------------------------
    # Step 3 – Entity extraction (variable, dates, coords, region)
    # ------------------------------------------------------------------
    variable = find_variable(q)
    start, end = find_dates(q)
    lat, lon = find_coordinates(q)
    region = detect_region(q)

    # ------------------------------------------------------------------
    # Step 4 – Visualization type from heuristics
    # ------------------------------------------------------------------
    viz, is_3d = _heuristic_visualization_type(ql)

    # If LLM says "3d" and heuristic didn't catch it, honour LLM
    if primary_modality == "3d" and not is_3d:
        viz = "3d_depth_layers"
        is_3d = True

    if is_3d and not variable:
        variable = "temperature"

    return VisualizationIntent(
        category="data",
        variable=variable or "sst",
        visualization=viz,
        region=region,
        start_date=start,
        end_date=end,
        latitude=lat,
        longitude=lon,
        is_3d=is_3d,
        primary_modality=primary_modality,
        modality_reasoning=modality_reasoning,
    )
