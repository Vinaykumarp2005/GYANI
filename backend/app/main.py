from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import VisualizationRequest
from .services.query_parser import parse_query
from .services.dataset_service import load_dataset, subset_dataset, dataset_metadata, extract_3d_grid
from .services.visualization_service import generate
from .services.conceptual_service import conceptual_diagram

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="GYANI Intelligent Scientific Visualization API",
    version="1.0.0",
    description="Prototype scientific visualization service for GYANI."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "GYANI Visualization API"}


@app.get("/api/datasets")
def datasets():
    try:
        ds = load_dataset()
        try:
            return {"datasets": [dataset_metadata(ds)]}
        finally:
            ds.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/visualize")
def visualize(request: VisualizationRequest):
    intent = parse_query(request.query)

    try:
        if intent.category == "conceptual":
            filename, media_type = conceptual_diagram(request.query)
            explanation = (
                "This is a conceptual visualization. It is generated as a "
                "scientific schematic and is not a visualization of measured/model data."
            )
            return {
                "success": True,
                "category": "conceptual",
                "is_3d": False,
                "intent": intent.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type
                },
                "explanation": explanation,
                "metadata": {
                    "source": "Prototype conceptual schematic",
                    "scientific_classification": "CONCEPTUAL_SCHEMATIC",
                    "provenance": "Generated scientific illustration"
                }
            }

        ds = load_dataset()
        try:
            if intent.is_3d or intent.visualization == "3d_depth_layers":
                grid_3d = extract_3d_grid(ds, intent)
                return {
                    "success": True,
                    "category": "data",
                    "is_3d": True,
                    "intent": intent.model_dump(),
                    "grid_3d": grid_3d,
                    "explanation": (
                        f"Generated interactive 3D depth-layer visualization for {intent.variable} "
                        f"with {len(grid_3d['coordinates']['depths'])} depth levels across "
                        f"{len(grid_3d['coordinates']['times'])} time steps."
                    ),
                    "metadata": dataset_metadata(ds)
                }

            subset = subset_dataset(ds, intent)
            filename, media_type = generate(subset, intent)
            return {
                "success": True,
                "category": "data",
                "is_3d": False,
                "intent": intent.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type
                },
                "explanation": (
                    f"Generated a {intent.visualization} for "
                    f"{intent.variable} using the configured dataset."
                ),
                "metadata": dataset_metadata(ds)
            }
        finally:
            ds.close()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/visualize/3d")
def visualize_3d(request: VisualizationRequest):
    intent = parse_query(request.query)
    intent.is_3d = True
    intent.visualization = "3d_depth_layers"
    ds = load_dataset()
    try:
        grid_3d = extract_3d_grid(ds, intent)
        return {
            "success": True,
            "category": "data",
            "is_3d": True,
            "intent": intent.model_dump(),
            "grid_3d": grid_3d,
            "explanation": f"Generated interactive 3D depth-layer grid for {intent.variable}.",
            "metadata": dataset_metadata(ds)
        }
    finally:
        ds.close()
