"""
llm_service.py
--------------
Modern Google GenAI SDK integration for Project GYANI:
  - Structured Markdown text answering (answer_query) using gemini-flash-lite-latest / gemini-3.8-flash
  - Multimodal intent / modality classification (classify_intent)
  - Scientific prompt refinement (refine_image_prompt)
  - Visual image generation with automatic conceptual schematic fallback (generate_image)

All functions degrade gracefully when the API key is absent or free-tier quotas are
exhausted; callers receive a safe, meaningful response instead of a hard crash.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Auto-load backend/.env if present
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parents[2] / ".env"
    if _env_path.exists():
        load_dotenv(_env_path, override=True)
except Exception:
    pass

_client = None

def _get_api_key() -> str | None:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key or key == "YOUR_API_KEY_HERE":
        try:
            from dotenv import load_dotenv
            _env_file = Path(__file__).resolve().parents[2] / ".env"
            if _env_file.exists():
                load_dotenv(_env_file)
                key = os.environ.get("GEMINI_API_KEY", "").strip()
        except Exception:
            pass
    return key if (key and key != "YOUR_API_KEY_HERE") else None


def _get_client():
    global _client
    key = _get_api_key()
    if not key:
        return None
    if _client is None:
        try:
            from google import genai
            _client = genai.Client(api_key=key)
        except Exception as e:
            logger.warning("Could not initialize google.genai Client: %s", e)
    return _client


def _get_cloudflare_creds() -> tuple[str | None, str | None]:
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not account_id or not api_token:
        try:
            from dotenv import load_dotenv
            _env_file = Path(__file__).resolve().parents[2] / ".env"
            if _env_file.exists():
                load_dotenv(_env_file, override=True)
                account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
                api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
        except Exception:
            pass
    return (account_id or None, api_token or None)


def _client_ready() -> bool:
    return _get_client() is not None


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------
_ANSWER_SYSTEM_PROMPT = """You are GYANI — an expert oceanographic AI assistant for the
Indian National Centre for Ocean Information Services (INCOIS), Ministry of Earth Sciences, Govt. of India.

Your task is to answer natural-language queries about ocean science clearly, accurately, and authoritatively.

## Output Rules
- Respond in **Markdown** with clean headers (##, ###), bullet lists, and code/table blocks where relevant.
- Lead with a concise executive summary (1-2 sentences) before expanding.
- Use standard oceanographic metric units (°C, m, m/s, PSU, dyn cm) consistently.
- When discussing real data, clearly distinguish between observational fact and numerical model output.
- If the query mentions specific regions (e.g., Arabian Sea, Bay of Bengal, Equatorial Indian Ocean), provide geographic and seasonal context (e.g., Summer Monsoon, Winter Monsoon).
- Keep responses focused, insightful, and accessible to both students and research oceanographers (150-400 words).
"""

_CLASSIFY_SYSTEM_PROMPT = """You are a multimodal intent classifier for an ocean-science visualisation platform.

Given a user query, return ONLY a JSON object with these keys:
{
  "primary_modality": "<text|image|3d|chart>",
  "secondary_options": ["<other valid modalities>"],
  "reasoning": "<one concise sentence>"
}

Modality rules:
- "3d"    → spatial structures, depth layers, vertical profiles, 3D temperature/salinity volumes
- "image" → artistic scenes, illustrations, visual concepts (e.g. "draw", "picture", "schematic", "illustrate")
- "chart" → numerical trends, time series, distributions, statistics, comparisons, heatmaps, SST evolution
- "text"  → factual explanations, definitions, code snippets, conceptual Q&A, "what is", "explain", "how does"

Prefer "3d" when depth layers or 3D profiles are queried.
Prefer "chart" over "text" when the user asks about temporal trends or numerical evolution.
Prefer "image" when the user explicitly requests an image or visual scene.
Default to "text" when conceptual or uncertain.

Return ONLY raw JSON, nothing else.
"""

# Candidate text models in order of priority
TEXT_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
    "gemini-flash-latest",
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def answer_query(
    query: str,
    session_history: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Generate a structured Markdown text answer for *query*.
    """
    client = _get_client()
    if not client:
        return {
            "success": True,
            "text": _heuristic_text_answer(query),
            "model": "heuristic-fallback",
            "fallback": True,
        }

    # Construct conversation history
    history = session_history or []
    prompt_with_history = ""
    for turn in history[-6:]:
        prompt_with_history += f"{turn.get('role', 'user').capitalize()}: {turn.get('content', '')}\n"
    prompt_with_history += f"User: {query}"

    last_error = None
    for model_name in TEXT_MODELS:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=prompt_with_history,
                config=types.GenerateContentConfig(
                    system_instruction=_ANSWER_SYSTEM_PROMPT,
                    temperature=0.3,
                ),
            )
            if response and response.text:
                return {
                    "success": True,
                    "text": response.text,
                    "model": model_name,
                    "fallback": False,
                }
        except Exception as exc:
            last_error = exc
            logger.warning("Model %s failed: %s. Trying next candidate...", model_name, exc)
            time.sleep(0.5)

    logger.error("All text models failed: %s", last_error)
    return {
        "success": True,
        "text": _heuristic_text_answer(query),
        "model": "heuristic-fallback",
        "fallback": True,
        "error": str(last_error),
    }


def classify_intent(query: str) -> dict[str, Any]:
    """
    Classify the primary rendering modality for *query*.
    """
    client = _get_client()
    if not client:
        return _heuristic_classify(query)

    for model_name in TEXT_MODELS:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=query,
                config=types.GenerateContentConfig(
                    system_instruction=_CLASSIFY_SYSTEM_PROMPT,
                    temperature=0.1,
                ),
            )
            if response and response.text:
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = "\n".join(raw.splitlines()[1:])
                    raw = raw.rstrip("`").strip()
                data = json.loads(raw)
                data["fallback"] = False
                return data
        except Exception as exc:
            logger.warning("Classification with %s failed: %s", model_name, exc)

    fallback = _heuristic_classify(query)
    return fallback


def refine_image_prompt(user_query: str) -> str:
    """
    Expand a raw user query into a descriptive oceanographic prompt.
    """
    client = _get_client()
    if not client:
        return f"Scientific oceanographic illustration: {user_query}, photorealistic, high detail"

    instruction = (
        "Convert this user request into a high-quality descriptive prompt "
        "for an ocean-science visual illustration. Return ONLY the refined prompt text:\n\n"
        + user_query
    )

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=instruction,
        )
        if response and response.text:
            return response.text.strip()
    except Exception as exc:
        logger.warning("refine_image_prompt failed: %s", exc)

    return f"Scientific oceanographic illustration: {user_query}, high detail, photorealistic"


def _generate_cloudflare_image(prompt: str) -> tuple[bytes | None, str | None, str | None]:
    """
    Generate an image using Cloudflare Workers AI (FLUX.1-schnell or SDXL).
    Returns (raw_image_bytes, model_name, error_message).
    """
    account_id, api_token = _get_cloudflare_creds()
    if not account_id or not api_token:
        return None, None, "Cloudflare credentials not configured"

    import httpx

    models = [
        ("@cf/black-forest-labs/flux-1-schnell", "flux-1-schnell"),
        ("@cf/stabilityai/stable-diffusion-xl-base-1.0", "sdxl-base-1.0"),
    ]

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    last_error = None
    for model_id, model_name in models:
        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_id}"
        try:
            with httpx.Client(timeout=45.0) as client:
                resp = client.post(url, headers=headers, json={"prompt": prompt})
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "").lower()
                    if "application/json" in content_type:
                        data = resp.json()
                        img_b64 = None
                        if isinstance(data, dict):
                            if "result" in data and isinstance(data["result"], dict) and "image" in data["result"]:
                                img_b64 = data["result"]["image"]
                            elif "image" in data:
                                img_b64 = data["image"]
                        if img_b64:
                            return base64.b64decode(img_b64), model_name, None
                    else:
                        # Raw binary image
                        return resp.content, model_name, None
                else:
                    last_error = f"{model_name} HTTP {resp.status_code}: {resp.text[:180]}"
                    logger.warning("Cloudflare AI error: %s", last_error)
        except Exception as exc:
            last_error = str(exc)
            logger.warning("Cloudflare model %s failed: %s", model_id, exc)

    return None, None, last_error


def generate_image(user_query: str, output_dir: Path | None = None) -> dict[str, Any]:
    """
    Generate an image for *user_query*.
    Prioritizes Cloudflare Workers AI (FLUX.1-schnell / SDXL), with fallback to
    Gemini image models, and deterministic conceptual oceanographic schematics.
    """
    refined_prompt = refine_image_prompt(user_query)

    # 1. Cloudflare Workers AI (Fast, high-quality, works seamlessly with free-tier)
    cf_bytes, cf_model, cf_err = _generate_cloudflare_image(refined_prompt)
    if cf_bytes:
        if output_dir is not None:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            fname = f"img_{uuid.uuid4().hex}.png"
            (output_dir / fname).write_bytes(cf_bytes)
            return {
                "success": True,
                "url": f"/outputs/{fname}",
                "base64": None,
                "mime_type": "image/png",
                "refined_prompt": refined_prompt,
                "model": f"cloudflare-{cf_model}",
                "fallback": False,
                "error": None,
            }
        else:
            b64 = base64.b64encode(cf_bytes).decode("ascii")
            return {
                "success": True,
                "url": None,
                "base64": b64,
                "mime_type": "image/png",
                "refined_prompt": refined_prompt,
                "model": f"cloudflare-{cf_model}",
                "fallback": False,
                "error": None,
            }

    if cf_err:
        logger.info("Cloudflare AI generation skipped or failed (%s). Trying Gemini...", cf_err)

    # 2. Attempt Google GenAI Image Models
    client = _get_client()
    if client:
        for img_model in ["gemini-2.5-flash-image", "gemini-3.1-flash-lite-image"]:
            try:
                from google.genai import types
                response = client.models.generate_content(
                    model=img_model,
                    contents=refined_prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                    ),
                )
                if response and response.parts:
                    for part in response.parts:
                        if getattr(part, "inline_data", None):
                            raw_bytes = part.inline_data.data
                            if output_dir is not None:
                                output_dir = Path(output_dir)
                                output_dir.mkdir(parents=True, exist_ok=True)
                                fname = f"img_{uuid.uuid4().hex}.png"
                                (output_dir / fname).write_bytes(raw_bytes)
                                return {
                                    "success": True,
                                    "url": f"/outputs/{fname}",
                                    "base64": None,
                                    "mime_type": "image/png",
                                    "refined_prompt": refined_prompt,
                                    "model": img_model,
                                    "fallback": False,
                                    "error": None,
                                }
                            else:
                                b64 = base64.b64encode(raw_bytes).decode("ascii")
                                return {
                                    "success": True,
                                    "url": None,
                                    "base64": b64,
                                    "mime_type": "image/png",
                                    "refined_prompt": refined_prompt,
                                    "model": img_model,
                                    "fallback": False,
                                    "error": None,
                                }
            except Exception as exc:
                logger.warning("Gemini image model %s failed (%s). Checking next...", img_model, exc)

    # 3. Resilient Fallback: Generate a high-resolution conceptual oceanographic diagram
    try:
        from .conceptual_service import conceptual_diagram
        diagram_filename, media_type = conceptual_diagram(user_query)
        return {
            "success": True,
            "url": f"/outputs/{diagram_filename}",
            "base64": None,
            "mime_type": media_type,
            "refined_prompt": refined_prompt,
            "model": "conceptual-schematic",
            "fallback": True,
            "error": "Cloudflare and Gemini image quotas unavailable. Rendered high-precision conceptual scientific schematic diagram.",
        }
    except Exception as diagram_err:
        logger.error("Conceptual diagram fallback failed: %s", diagram_err)
        return {
            "success": False,
            "url": None,
            "base64": None,
            "mime_type": "image/png",
            "refined_prompt": refined_prompt,
            "fallback": True,
            "error": f"Image generation unavailable: {diagram_err}",
        }


# ---------------------------------------------------------------------------
# Deterministic Fallbacks
# ---------------------------------------------------------------------------

def _heuristic_classify(query: str) -> dict[str, Any]:
    q = query.lower()
    if any(k in q for k in ["3d", "depth", "profile", "vertical", "volume", "layers", "column"]):
        return {
            "primary_modality": "3d",
            "secondary_options": ["chart", "text"],
            "reasoning": "Query mentions 3D depth or volumetric data.",
            "fallback": True,
        }
    if any(k in q for k in ["draw", "picture", "illustrate", "image", "photo", "show me a picture"]):
        return {
            "primary_modality": "image",
            "secondary_options": ["text"],
            "reasoning": "Explicit user request for imagery or illustration.",
            "fallback": True,
        }
    if any(k in q for k in ["evolution", "trend", "change", "time", "monthly", "anomaly", "compare", "chart"]):
        return {
            "primary_modality": "chart",
            "secondary_options": ["text", "2d"],
            "reasoning": "Temporal trend or dataset comparison requested.",
            "fallback": True,
        }
    return {
        "primary_modality": "text",
        "secondary_options": ["3d", "chart"],
        "reasoning": "Conceptual or factual inquiry.",
        "fallback": True,
    }


def _heuristic_text_answer(query: str) -> str:
    q = query.lower()
    if "upwelling" in q:
        return (
            "## Coastal Upwelling\n\n"
            "**Coastal upwelling** is an oceanographic phenomenon where offshore winds and the Earth's rotation (Coriolis effect) "
            "drive surface waters away from the coast, allowing colder, denser, and nutrient-rich waters from the deep ocean "
            "to rise toward the euphotic zone.\n\n"
            "### Key Scientific Mechanisms\n"
            "- **Ekman Transport:** Winds blowing parallel to the coastline induce a net transport of water 90° to the right in the Northern Hemisphere.\n"
            "- **Thermocline Shoaling:** The upward displacement of deeper waters causes the thermocline to rise close to the surface.\n"
            "- **Biological Productivity:** High concentrations of nitrates and phosphates stimulate phytoplankton blooms, driving major fisheries along the Western coast of India."
        )
    if "thermocline" in q:
        return (
            "## The Ocean Thermocline\n\n"
            "The **thermocline** is the transition layer between the warmer mixed layer near the ocean surface and the colder deep water below.\n\n"
            "### Physical Characteristics\n"
            "- **Gradient:** Temperature drops precipitously over a depth range of 50 m to 300 m in the tropical Indian Ocean.\n"
            "- **Barrier Layer:** In the Bay of Bengal, fresh river runoff creates a salinity-stratified barrier layer that inhibits vertical mixing."
        )
    return (
        f"## Ocean Science Inquiry\n\n"
        f"**Query:** {query}\n\n"
        "GYANI integrates operational numerical models from INCOIS with numerical NetCDF grids and AI reasoning. "
        "Explore the 3D depth-layer and temporal chart tabs above to visualize this oceanographic feature."
    )
