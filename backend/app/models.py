from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal


class VisualizationRequest(BaseModel):
    query: str = Field(min_length=2)
    language: Optional[str] = "en"


class GeminiClassification(BaseModel):
    category: Literal["TEXT", "2D_VISUALIZATION", "3D_VISUALIZATION", "IMAGE_GENERATION"]
    reason: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    requires_scientific_data: bool = False
    requires_clarification: bool = False
    clarification_message: Optional[str] = None


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
    gemini_reason: Optional[str] = None


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


class QueryHistoryItem(BaseModel):
    id: str
    query: str
    category: str
    reason: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
    result: Optional[Dict[str, Any]] = None
