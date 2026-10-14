from pathlib import Path

# Load environment variables from backend/.env if present
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:
    pass  # python-dotenv not yet installed; env vars must be set manually

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .models import (
    VisualizationRequest,
    AnswerRequest,
    ImageGenerationRequest,
)
from .services.query_parser import parse_query
from .services.dataset_service import load_dataset, subset_dataset, dataset_metadata, extract_3d_grid
from .services.visualization_service import generate
from .services.conceptual_service import conceptual_diagram
from .services.history_service import init_db, save_record, fetch_all, fetch_by_id, delete_record
from .services.llm_service import answer_query, generate_image

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="GYANI Intelligent Scientific Visualization API",
    version="2.0.0",
    description=(
        "Multimodal ocean-science exploration platform — text answers, "
        "image generation, 3D depth layers, 2D charts, and query history."
    ),
)

# ---------------------------------------------------------------------------
# Startup: initialise SQLite history DB
# ---------------------------------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")


# ---------------------------------------------------------------------------
# Global error handler — always returns JSON with a uniform shape
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_str = str(exc).lower()
    if "quota" in err_str or "rate" in err_str or "429" in err_str:
        status, code = 429, "QUOTA_EXCEEDED"
    elif "safety" in err_str or "policy" in err_str or "unsafe" in err_str:
        status, code = 400, "CONTENT_FILTERED"
    elif "not found" in err_str or "filenotfound" in err_str:
        status, code = 404, "NOT_FOUND"
    else:
        status, code = 500, "INTERNAL_ERROR"

    return JSONResponse(
        status_code=status,
        content={
            "success": False,
            "error": str(exc),
            "error_code": code,
            "fallback_text": (
                "An error occurred while processing your request. "
                "The data-driven visualisation pipeline remains available — "
                "please try a different query."
            ),
        },
    )


# ===========================================================================
# EXISTING ENDPOINTS  (unchanged behaviour)
# ===========================================================================

@app.get("/")
def root():
    return {
        "service": "GYANI Intelligent Scientific Visualization API",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "frontend_url": "http://localhost:5173",
        "message": "Backend API is running. Open http://localhost:5173 in your browser for the full interactive GYANI visualizer.",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "GYANI Visualization API", "version": "2.0.0"}


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
            response_data = {
                "success": True,
                "category": "conceptual",
                "is_3d": False,
                "intent": intent.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type,
                },
                "explanation": explanation,
                "metadata": {
                    "source": "Prototype conceptual schematic",
                    "scientific_classification": "CONCEPTUAL_SCHEMATIC",
                    "provenance": "Generated scientific illustration",
                },
            }
            # Persist to history
            save_record(
                session_id=request.session_id,
                user_query=request.query,
                visualization_type="conceptual_diagram",
                primary_modality=intent.primary_modality or "text",
                modality_reasoning=intent.modality_reasoning,
                media_url=f"/outputs/{filename}",
                intent=intent.model_dump(),
                metadata=response_data["metadata"],
            )
            return response_data

        ds = load_dataset()
        try:
            if intent.is_3d or intent.visualization == "3d_depth_layers":
                grid_3d = extract_3d_grid(ds, intent)
                explanation = (
                    f"Generated interactive 3D depth-layer visualization for {intent.variable} "
                    f"with {len(grid_3d['coordinates']['depths'])} depth levels across "
                    f"{len(grid_3d['coordinates']['times'])} time steps."
                )
                meta = dataset_metadata(ds)
                response_data = {
                    "success": True,
                    "category": "data",
                    "is_3d": True,
                    "intent": intent.model_dump(),
                    "grid_3d": grid_3d,
                    "explanation": explanation,
                    "metadata": meta,
                }
                save_record(
                    session_id=request.session_id,
                    user_query=request.query,
                    visualization_type="3d_depth_layers",
                    primary_modality=intent.primary_modality or "3d",
                    modality_reasoning=intent.modality_reasoning,
                    intent=intent.model_dump(),
                    metadata=meta,
                )
                return response_data

            subset = subset_dataset(ds, intent)
            filename, media_type = generate(subset, intent)
            meta = dataset_metadata(ds)
            explanation = (
                f"Generated a {intent.visualization} for "
                f"{intent.variable} using the configured dataset."
            )
            response_data = {
                "success": True,
                "category": "data",
                "is_3d": False,
                "intent": intent.model_dump(),
                "visualization": {
                    "url": f"/outputs/{filename}",
                    "media_type": media_type,
                },
                "explanation": explanation,
                "metadata": meta,
            }
            save_record(
                session_id=request.session_id,
                user_query=request.query,
                visualization_type=intent.visualization,
                primary_modality=intent.primary_modality or "chart",
                modality_reasoning=intent.modality_reasoning,
                media_url=f"/outputs/{filename}",
                intent=intent.model_dump(),
                metadata=meta,
            )
            return response_data
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
            "metadata": dataset_metadata(ds),
        }
    finally:
        ds.close()


# ===========================================================================
# NEW ENDPOINTS
# ===========================================================================

# ---------------------------------------------------------------------------
# POST /api/answer  — LLM-powered structured Markdown text answer
# ---------------------------------------------------------------------------

@app.post("/api/answer")
def answer(request: AnswerRequest):
    """
    Generate an AI text answer for the given query.
    Maintains session context via the optional *history* list.
    Falls back to a heuristic answer when the LLM is unavailable.
    """
    result = answer_query(
        query=request.query,
        session_history=request.history,
    )

    # Persist to history
    query_id = save_record(
        session_id=request.session_id,
        user_query=request.query,
        text_response=result.get("text"),
        visualization_type="text_answer",
        primary_modality="text",
        modality_reasoning="LLM text answer endpoint",
    )

    return {
        "success": result.get("success", True),
        "text": result.get("text", ""),
        "model": result.get("model", "unknown"),
        "fallback": result.get("fallback", False),
        "query_id": query_id,
        "error": result.get("error"),
    }


# ---------------------------------------------------------------------------
# POST /api/generate-image  — Imagen-powered image generation
# ---------------------------------------------------------------------------

@app.post("/api/generate-image")
def generate_image_endpoint(request: ImageGenerationRequest):
    """
    Generate an image for the given query using Imagen.
    Saves the image to /outputs and returns the relative URL.
    Falls back gracefully if API key is not configured.
    """
    result = generate_image(
        user_query=request.query,
        output_dir=OUTPUT_DIR,
    )

    # Persist
    query_id = save_record(
        session_id=request.session_id,
        user_query=request.query,
        visualization_type="generated_image",
        primary_modality="image",
        modality_reasoning="Image generation endpoint",
        media_url=result.get("url"),
    )

    return {
        "success": result["success"],
        "url": result.get("url"),
        "base64": result.get("base64"),
        "mime_type": result.get("mime_type", "image/png"),
        "refined_prompt": result.get("refined_prompt"),
        "model": result.get("model"),
        "fallback": result.get("fallback", False),
        "error": result.get("error"),
        "query_id": query_id,
    }


# ---------------------------------------------------------------------------
# GET /api/history  — Fetch query history (all or by session)
# ---------------------------------------------------------------------------

@app.get("/api/history")
def get_history(session_id: str | None = None, limit: int = 50, offset: int = 0):
    """
    Return stored query history, newest first.
    Optionally filter by *session_id* query param.
    """
    records = fetch_all(session_id=session_id, limit=limit, offset=offset)
    return {"success": True, "count": len(records), "records": records}


# ---------------------------------------------------------------------------
# GET /api/history/{query_id}  — Fetch a single history record
# ---------------------------------------------------------------------------

@app.get("/api/history/{query_id}")
def get_history_record(query_id: str):
    record = fetch_by_id(query_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Record '{query_id}' not found.")
    return {"success": True, "record": record}


# ---------------------------------------------------------------------------
# DELETE /api/history/{query_id}  — Delete a single record
# ---------------------------------------------------------------------------

@app.delete("/api/history/{query_id}")
def delete_history_record(query_id: str):
    ok = delete_record(query_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Record '{query_id}' not found or could not be deleted.")
    return {"success": True, "deleted": query_id}

