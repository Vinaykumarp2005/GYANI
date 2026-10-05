from pydantic import BaseModel, Field
from typing import Optional


class VisualizationRequest(BaseModel):
    query: str = Field(min_length=3)


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
