import os
import io
import json
import uuid
import re
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from dotenv import load_dotenv

from ..models import GeminiClassification

# Load environment variables from backend/.env or root .env
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


def get_gemini_api_key() -> Optional[str]:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if key and key.strip() and key.strip() != "your_gemini_api_key_here":
        return key.strip()
    return None


def get_genai_client():
    key = get_gemini_api_key()
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"[GYANI Gemini] Failed to initialize genai.Client: {e}")
        return None


# --------------------------------------------------------------------------
# 1. Local Fallback Classifier (Zero-API-key / Resilience Mode)
# --------------------------------------------------------------------------
def fallback_classify_query(query: str, language: str = "en") -> GeminiClassification:
    ql = query.lower().strip()

    # Detect Image Generation requests
    image_keywords = [
        "generate an illustration", "generate illustration", "illustration of",
        "draw", "artistic", "generate an image", "generate image", "picture of",
        "create an image", "sketch of", "artwork of", "render an illustration"
    ]
    if any(k in ql for k in image_keywords):
        return GeminiClassification(
            category="IMAGE_GENERATION",
            reason="User explicitly requested an artistic illustration or visual creation.",
            parameters={"prompt": query, "style": "scientific_illustration"},
            requires_scientific_data=False,
            requires_clarification=False
        )

    # Detect 3D Visualization requests
    three_d_keywords = [
        "3d", "3-d", "three dimensional", "3 dimensional", "depth layer",
        "depth layers", "at different depths", "vertical profile", "underwater layer",
        "depth profile", "depths", "depth slice"
    ]
    if any(k in ql for k in three_d_keywords):
        var = "temperature"
        if "salin" in ql:
            var = "salinity"
        elif "current" in ql:
            var = "current"
        return GeminiClassification(
            category="3D_VISUALIZATION",
            reason="The query requests three-dimensional spatial representation across multiple ocean depth levels.",
            parameters={
                "variable": var,
                "dimensions": ["latitude", "longitude", "depth", "time"],
                "region": "Arabian Sea" if "arabian" in ql else "Bay of Bengal" if "bengal" in ql else "Indian Ocean"
            },
            requires_scientific_data=True,
            requires_clarification=False
        )

    # Detect Explanatory / Conceptual Text questions
    text_indicators = [
        "what is", "what are", "explain", "how does", "how do", "why is",
        "why do", "importance of", "tell me about", "define", "describe",
        "forecast", "bulletin", "meaning of", "difference between"
    ]
    data_verbs = ["plot", "heatmap", "map", "evolution", "timeseries", "graph", "chart", "show sst", "show ssh"]
    is_text = any(t in ql for t in text_indicators) and not any(v in ql for v in data_verbs)

    if is_text or ql.endswith("?") or ql.startswith("what") or ql.startswith("explain") or ql.startswith("why"):
        return GeminiClassification(
            category="TEXT",
            reason="The query asks for a conceptual explanation, definition, or factual overview.",
            parameters={"topic": query},
            requires_scientific_data=False,
            requires_clarification=False
        )

    # Default to 2D scientific data visualization
    var = "sst"
    if "ssh" in ql or "sea level" in ql or "height" in ql:
        var = "ssh"
    elif "salin" in ql:
        var = "salinity"
    elif "current" in ql or "flow" in ql:
        var = "current"

    viz_type = "static_map"
    if "animat" in ql or "evolution" in ql or "during" in ql:
        viz_type = "animated_map"
    elif "time" in ql and "series" in ql:
        viz_type = "timeseries"

    return GeminiClassification(
        category="2D_VISUALIZATION",
        reason="The query requires spatial or temporal two-dimensional scientific plotting from observational/model data.",
        parameters={
            "variable": var,
            "visualization_type": viz_type,
            "region": "Arabian Sea" if "arabian" in ql else "Bay of Bengal" if "bengal" in ql else "Indian Ocean",
            "dimensions": ["latitude", "longitude", "time"]
        },
        requires_scientific_data=True,
        requires_clarification=False
    )


# --------------------------------------------------------------------------
# 2. Gemini Live Query Classifier
# --------------------------------------------------------------------------
def classify_query(query: str, language: str = "en") -> GeminiClassification:
    client = get_genai_client()
    if not client:
        return fallback_classify_query(query, language)

    system_instruction = (
        "You are the central query routing classifier for GYANI (Indian National Centre for Ocean Information Services - INCOIS). "
        "Classify the user's inquiry into exactly one of four categories:\n"
        "1. 'TEXT': For questions seeking explanations, definitions, factual answers, summaries, conceptual interpretations, "
        "or advisory guidance (e.g. 'What is ocean forecast', 'Explain the importance of ocean salinity', 'How does coastal upwelling occur?').\n"
        "2. '2D_VISUALIZATION': For requests to generate 2D scientific plots, surface heatmaps, timeseries charts, or animated 2D maps "
        "from numerical ocean model datasets (e.g. 'Generate a heatmap of ocean temperatures', 'Show SST evolution in Arabian Sea').\n"
        "3. '3D_VISUALIZATION': For requests to visualize 3D spatial representations, vertical water-column profiles, or depth layers "
        "(e.g. 'Visualize ocean temperature at different depths', 'Show 3D temperature profile in Arabian Sea').\n"
        "4. 'IMAGE_GENERATION': For creative requests to generate illustrations, artistic drawings, conceptual diagrams, or visual art "
        "(e.g. 'Generate an illustration of underwater ecosystems', 'Draw a marine food web graphic').\n\n"
        "Extract variables (sst, ssh, temperature, salinity, current), dimensions, region, dates if present. "
        "Respond strictly in structured JSON matching the schema."
    )

    prompt = f"User Query: {query}\nPreferred Language: {language}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=dict(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=GeminiClassification,
                temperature=0.1
            ),
        )
        if response.text:
            data = json.loads(response.text)
            return GeminiClassification(**data)
    except Exception as e:
        print(f"[GYANI Gemini Classifier Warning] Error with live Gemini call ({e}). Falling back to local classifier.")

    return fallback_classify_query(query, language)


# --------------------------------------------------------------------------
# 3. Gemini Text Answer Generation
# --------------------------------------------------------------------------
def generate_text_answer(query: str, classification: GeminiClassification, language: str = "en") -> str:
    client = get_genai_client()
    if client:
        system_prompt = (
            "You are GYANI, the official ocean-science intelligence engine for the Indian National Centre for Ocean Information Services (INCOIS), "
            "Ministry of Earth Sciences, Government of India. "
            "Provide a well-structured, authoritative, and educational response to the user's inquiry. "
            "Include:\n"
            "- A clear introductory summary.\n"
            "- Key scientific mechanisms and practical significance (navigation, coastal safety, fisheries, or climate).\n"
            "- Indian Ocean context where relevant (Arabian Sea, Bay of Bengal, Monsoon, INCOIS advisory services).\n"
            "Format in clear markdown with clean headings, bold highlights, and bullet points. "
            f"Respond in language code '{language}' if requested, defaulting to English."
        )
        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=query,
                config=dict(
                    system_instruction=system_prompt,
                    temperature=0.3
                )
            )
            if resp.text:
                return resp.text
        except Exception as e:
            print(f"[GYANI Gemini Text Warning] Error generating live answer ({e}). Falling back to internal knowledge.")

    # High-quality fallback answers for standard oceanographic concepts
    ql = query.lower()
    if "ocean forecast" in ql or "forecast" in ql:
        return (
            "### Ocean State Forecast (OSF) — INCOIS Overview\n\n"
            "**Ocean State Forecasting** is the computational science of predicting the future physical state of the ocean, "
            "including wave heights, swell direction, sea surface temperature (SST), ocean currents, and wind-wave interactions.\n\n"
            "#### Key Components of Ocean Forecasting:\n"
            "- **Wave & Swell Predictions**: Continuous 7-day predictive models forecasting significant wave height (SWH), swell periods, and rough sea states.\n"
            "- **Surface Currents & Drift**: Tracking surface flow velocity to assist search-and-rescue (SAR) operations and marine navigation.\n"
            "- **Coastal Hazards**: Early warnings for high wave alerts, storm surges, and swell surges (*Kallakkadal*) along the Indian coastline.\n\n"
            "#### Practical Significance:\n"
            "Operated operationally by **INCOIS (Ministry of Earth Sciences)**, ocean state forecasts safeguard artisanal and mechanized fishermen, "
            "merchant shipping corridors, offshore oil platforms, and coastal community defense."
        )
    elif "salin" in ql:
        return (
            "### Importance of Ocean Salinity in Marine Dynamics\n\n"
            "**Ocean Salinity** refers to the concentration of dissolved mineral salts (measured in Practical Salinity Units, PSU) "
            "in seawater, averaging approximately **35 PSU** globally.\n\n"
            "#### Why Salinity is Critical:\n"
            "- **Thermohaline Circulation (Ocean Conveyor Belt)**: Density differences driven by temperature and salinity regulate global deep-ocean circulation and heat transport.\n"
            "- **Bay of Bengal vs. Arabian Sea Contrast**: The Bay of Bengal receives enormous freshwater runoff from the Ganges-Brahmaputra basin, creating a buoyant low-salinity surface layer that traps heat and intensifies cyclones. In contrast, high evaporation over the Arabian Sea yields denser, more saline waters.\n"
            "- **Marine Ecosystems**: Salinity gradients determine habitat boundaries for pelagic fish, coral reef resilience, and planktonic distribution."
        )
    elif "upwell" in ql:
        return (
            "### Coastal Upwelling Mechanics\n\n"
            "**Upwelling** is an oceanographic phenomenon where offshore wind stress and the Coriolis force (Ekman transport) "
            "drive warm surface waters away from the coast, drawing cold, nutrient-rich deep waters up to the sunlit euphotic zone.\n\n"
            "#### Key Impacts:\n"
            "- **Fisheries Productivity**: Surfacing nutrients (nitrates and phosphates) trigger phytoplankton blooms, forming the cornerstone of productive fishing zones along the southwest coast of India during the Southwest Monsoon.\n"
            "- **Sea Surface Cooling**: Upwelling moderates coastal climates and depresses SSTs."
        )
    else:
        return (
            f"### Scientific Insight: {query.title()}\n\n"
            "Oceanographic inquiry processed by the **GYANI Scientific Intelligence System**.\n\n"
            "- **Parameter Analysis**: Ocean dynamics in the Indian Ocean basin are heavily modulated by the seasonal monsoon reversal, "
            "equatorial Kelvin and Rossby waves, and the Indian Ocean Dipole (IOD).\n"
            "- **Observational Integration**: INCOIS monitors these conditions via continuous OMNI moored buoys, coastal tide gauges, and global Argo profiling floats.\n"
            "- **Operational Access**: For quantitative maps or 3D water-column profiles, try queries such as *'Show 3D temperature profile in Arabian Sea'* or *'Show SST evolution during June 2025'*."
        )


# --------------------------------------------------------------------------
# 4. Gemini / Imagen Image Generation
# --------------------------------------------------------------------------
def generate_ai_image(prompt: str) -> Tuple[str, str]:
    """
    Generates an artistic or conceptual visual illustration using Google Imagen/Gemini,
    saving the output image to backend/outputs/ and returning (filename, mime_type).
    """
    client = get_genai_client()
    filename = f"ai_illustration_{uuid.uuid4().hex[:8]}.png"
    filepath = OUTPUT_DIR / filename

    if client:
        try:
            enhanced_prompt = (
                f"Detailed scientific illustration of: {prompt}. "
                "Vibrant oceanic environment, educational clarity, highly detailed marine ecosystem or oceanographic concept, digital art style."
            )
            result = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=enhanced_prompt,
                config=dict(
                    number_of_images=1,
                    output_mime_type="image/png",
                    aspect_ratio="4:3",
                ),
            )
            for generated_image in result.generated_images:
                with open(filepath, "wb") as f:
                    f.write(generated_image.image.image_bytes)
                return filename, "image/png"
        except Exception as e:
            print(f"[GYANI Imagen Warning] Live image generation call failed ({e}). Generating high-fidelity procedural illustration.")

    # High-fidelity procedural artistic fallback using Matplotlib & PIL
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    fig, ax = plt.subplots(figsize=(8, 6), dpi=140)
    fig.patch.set_facecolor("#041427")
    ax.set_facecolor("#072343")

    # Generate artistic stylized ocean gradient and depth waves
    y = np.linspace(0, 10, 200)
    x = np.linspace(0, 10, 200)
    X, Y = np.meshgrid(x, y)
    Z = np.sin(X * 0.8) * np.cos(Y * 0.6) + np.sin((X + Y) * 0.5)

    c = ax.contourf(X, Y, Z, levels=30, cmap="viridis", alpha=0.85)

    # Stylized marine features
    ax.text(
        5, 8.8, "GYANI AI SCIENTIFIC ILLUSTRATION",
        color="#00ffcc", fontsize=14, fontweight="bold", ha="center",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#061930", edgecolor="#00ffcc", alpha=0.9)
    )
    ax.text(
        5, 5.0, f"Concept: {prompt}",
        color="#ffffff", fontsize=11, ha="center", style="italic", wrap=True,
        bbox=dict(boxstyle="round,pad=0.4", facecolor="#0a2a50", edgecolor="#38bdf8", alpha=0.8)
    )
    ax.text(
        5, 1.2, "✦ AI Generated Conceptual Visual — Not Measured Data ✦",
        color="#facc15", fontsize=9, ha="center", fontweight="bold"
    )

    ax.axis("off")
    plt.tight_layout()
    plt.savefig(filepath, format="png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)

    return filename, "image/png"
