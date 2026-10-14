from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ---------------------------------------------------------------------------
# Existing request / intent models (unchanged)
# ---------------------------------------------------------------------------

class VisualizationRequest(BaseModel):
    query: str = Field(min_length=3)
    language: Optional[str] = "en"
    session_id: Optional[str] = None          # NEW – ties the query to a browser session


class VisualizationIntent(BaseModel):
    category: str
    variable: Optional[str] = None
    visualization: str
    region: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    depth: Optional[float] = None
    is_3d: Optional[bool] = False
    # NEW – populated by llm_service.classify_intent()
    primary_modality: Optional[str] = None
    modality_reasoning: Optional[str] = None


class CoordinateGrid(BaseModel):
    lats: List[float]
    lons: List[float]
    depths: List[float]
    times: List[str]


class DepthLayer(BaseModel):
    depth: float
    # Matrix of shape: time x lat x lon
    values_by_time: List[List[List[Optional[float]]]]


class ThreeDGridResponse(BaseModel):
    variable: str
    units: str
    data_classification: str
    coordinates: CoordinateGrid
    value_bounds: Dict[str, float]
    layers: List[DepthLayer]
    metadata: Dict[str, Any]


# ---------------------------------------------------------------------------
# NEW – Modality classification schema
# ---------------------------------------------------------------------------

class ModalityClassification(BaseModel):
    primary_modality: str                       # "text" | "image" | "3d" | "chart"
    secondary_options: List[str] = []
    reasoning: str = ""
    fallback: bool = False


# ---------------------------------------------------------------------------
# NEW – Text-answer request / response
# ---------------------------------------------------------------------------

class AnswerRequest(BaseModel):
    query: str = Field(min_length=3)
    language: Optional[str] = "en"
    session_id: Optional[str] = None
    # Optional previous conversation turns for context
    history: Optional[List[Dict[str, str]]] = None


class AnswerResponse(BaseModel):
    success: bool
    text: str                                   # Markdown-formatted answer
    model: str
    fallback: bool = False
    query_id: Optional[str] = None


# ---------------------------------------------------------------------------
# NEW – Image generation request / response
# ---------------------------------------------------------------------------

class ImageGenerationRequest(BaseModel):
    query: str = Field(min_length=3)
    language: Optional[str] = "en"
    session_id: Optional[str] = None


class ImageGenerationResponse(BaseModel):
    success: bool
    url: Optional[str] = None                  # relative /outputs/... path
    base64: Optional[str] = None               # base64 PNG (fallback)
    mime_type: str = "image/png"
    refined_prompt: Optional[str] = None
    fallback: bool = False
    error: Optional[str] = None
    query_id: Optional[str] = None


# ---------------------------------------------------------------------------
# NEW – History record schema (matches DB columns)
# ---------------------------------------------------------------------------

class HistoryRecord(BaseModel):
    query_id: str
    timestamp: str
    session_id: Optional[str] = None
    user_query: str
    text_response: Optional[str] = None
    visualization_type: Optional[str] = None
    primary_modality: Optional[str] = None
    modality_reasoning: Optional[str] = None
    media_url: Optional[str] = None
    intent: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
