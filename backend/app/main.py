from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import VisualizationRequest
from .services.query_parser import parse_query
from .services.dataset_service import load_dataset, subset_dataset, dataset_metadata, extract_3d_grid
from .services.visualization_service import generate
from .services.conceptual_service import conceptual_diagram
from .services.gemini_service import classify_query, generate_text_answer, generate_ai_image, get_gemini_api_key
from .services.history_service import load_history, add_history_entry, clear_history

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="GYANI Intelligent Oceanographic AI API",
    version="2.0.0",
    description="Gemini-powered intelligent classification, synthesis, and visualization service for INCOIS."
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
    has_gemini_key = bool(get_gemini_api_key())
    return {
        "status": "ok",
        "service": "GYANI Ocean-AI Visualization API",
        "gemini_active": has_gemini_key
    }


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


@app.get("/api/history")
def get_history():
    return {"history": load_history()}


@app.delete("/api/history")
def delete_history():
    cleared = clear_history()
    return {"success": cleared}


@app.post("/api/visualize")
def visualize(request: VisualizationRequest):
    # 1. Step: Gemini-powered structured query classification & intent extraction
    classification = classify_query(request.query, request.language or "en")
    cat = classification.category

    try:
        # A. TEXT Category: Explanatory, conceptual, or advisory questions
        if cat == "TEXT":
            text_answer = generate_text_answer(request.query, classification, request.language or "en")
            result = {
                "success": True,
                "category": "TEXT",
                "is_3d": False,
                "reason": classification.reason,
                "classification": classification.model_dump(),
                "answer": text_answer,
                "explanation": classification.reason,
                "intent": {
                    "category": "TEXT",
                    "visualization": "text_explanation",
                    "gemini_reason": classification.reason,
                    **classification.parameters
                },
                "metadata": {
                    "source": "Google Gemini Intelligence Engine (INCOIS Knowledge Base)",
                    "scientific_classification": "CONCEPTUAL_SCHEMATIC",
                    "provenance": "Gemini-powered text synthesis",
                    "model": "gemini-2.5-flash",
                }
            }
            add_history_entry(request.query, "TEXT", classification.reason, classification.parameters, result)
            return result

        # B. IMAGE_GENERATION Category: Artistic or illustrative creations
        if cat == "IMAGE_GENERATION":
            filename, media_type = generate_ai_image(request.query)
            result = {
                "success": True,
                "category": "IMAGE_GENERATION",
                "is_3d": False,
                "reason": classification.reason,
                "classification": classification.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type
                },
                "explanation": classification.reason,
                "intent": {
                    "category": "IMAGE_GENERATION",
                    "visualization": "ai_illustration",
                    "gemini_reason": classification.reason,
                    **classification.parameters
                },
                "metadata": {
                    "source": "Gemini / Imagen Generative Visual Model",
                    "scientific_classification": "AI_GENERATED_ILLUSTRATION",
                    "provenance": "Generative AI illustration (Non-measurement)",
                    "model": "imagen-3.0-generate-002",
                }
            }
            add_history_entry(request.query, "IMAGE_GENERATION", classification.reason, classification.parameters, result)
            return result

        # C & D. 3D_VISUALIZATION & 2D_VISUALIZATION: Scientific Numerical Data Processing
        ds = load_dataset()
        try:
            # Map Gemini classification to query intent
            intent = parse_query(request.query)
            intent.gemini_reason = classification.reason

            # If Gemini specifically categorized as 3D or parameter extraction found depth
            if cat == "3D_VISUALIZATION" or intent.is_3d or intent.visualization == "3d_depth_layers":
                intent.is_3d = True
                intent.visualization = "3d_depth_layers"
                if classification.parameters.get("variable"):
                    intent.variable = classification.parameters["variable"]

                grid_3d = extract_3d_grid(ds, intent)
                result = {
                    "success": True,
                    "category": "3D_VISUALIZATION",
                    "is_3d": True,
                    "reason": classification.reason,
                    "classification": classification.model_dump(),
                    "intent": intent.model_dump(),
                    "grid_3d": grid_3d,
                    "explanation": (
                        f"Generated interactive 3D depth-layer visualization for {intent.variable} "
                        f"with {len(grid_3d['coordinates']['depths'])} depth levels across "
                        f"{len(grid_3d['coordinates']['times'])} time steps. {classification.reason}"
                    ),
                    "metadata": dataset_metadata(ds)
                }
                add_history_entry(request.query, "3D_VISUALIZATION", classification.reason, classification.parameters, result)
                return result

            # Otherwise 2D_VISUALIZATION
            if classification.parameters.get("variable"):
                intent.variable = classification.parameters["variable"]

            subset = subset_dataset(ds, intent)
            filename, media_type = generate(subset, intent)
            result = {
                "success": True,
                "category": "2D_VISUALIZATION",
                "is_3d": False,
                "reason": classification.reason,
                "classification": classification.model_dump(),
                "intent": intent.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type
                },
                "explanation": (
                    f"Generated {intent.visualization} for {intent.variable} using INCOIS numerical model data. "
                    f"{classification.reason}"
                ),
                "metadata": dataset_metadata(ds)
            }
            add_history_entry(request.query, "2D_VISUALIZATION", classification.reason, classification.parameters, result)
            return result
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
            "category": "3D_VISUALIZATION",
            "is_3d": True,
            "intent": intent.model_dump(),
            "grid_3d": grid_3d,
            "explanation": f"Generated interactive 3D depth-layer grid for {intent.variable}.",
            "metadata": dataset_metadata(ds)
        }
    finally:
        ds.close()
