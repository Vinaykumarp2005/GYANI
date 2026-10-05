from pathlib import Path
import uuid
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


def conceptual_diagram(query: str):
    q = query.lower()

    if "upwelling" in q:
        title = "Coastal Upwelling — Conceptual Diagram"
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 7)
        ax.fill_between([0, 10], 0, 1.5, alpha=0.25)
        ax.text(0.4, 1.0, "Ocean", fontsize=12)
        ax.annotate("Wind", (2, 5.7), (0.5, 5.7),
                    arrowprops=dict(arrowstyle="->", lw=2))
        for x in [3, 5, 7]:
            ax.annotate("Surface water", (x, 5.0), (x+0.8, 5.0),
                        arrowprops=dict(arrowstyle="->", lw=1.5))
            ax.annotate("Cold nutrient-rich water", (x, 1.6), (x, 4.0),
                        arrowprops=dict(arrowstyle="->", lw=2))
        ax.text(6.7, 0.6, "Deeper water", fontsize=11)
    elif "eddy" in q:
        title = "Ocean Eddy — Conceptual Diagram"
        fig, ax = plt.subplots(figsize=(8, 8))
        t = np.linspace(0, 2*np.pi, 300)
        r = 2.0 + 0.35*np.sin(3*t)
        x = 5 + r*np.cos(t)
        y = 4 + r*np.sin(t)
        ax.plot(x, y, linewidth=3)
        ax.annotate("Rotating water mass", (6.5, 5.0), (7.0, 6.2),
                    arrowprops=dict(arrowstyle="->", lw=2))
        ax.scatter([5], [4], s=100)
        ax.text(4.3, 3.5, "Eddy core")
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 8)
        ax.set_aspect("equal")
    elif "salt finger" in q:
        title = "Salt Fingering — Conceptual Diagram"
        fig, ax = plt.subplots(figsize=(8, 7))
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 10)
        for x in np.linspace(2, 8, 7):
            y = np.linspace(8.5, 1.5, 80)
            xx = x + 0.18*np.sin(y*3 + x)
            ax.plot(xx, y, linewidth=2)
        ax.text(1, 9, "Saltier / denser water", fontsize=12)
        ax.text(1, 0.6, "Fresher / lighter water", fontsize=12)
        ax.axhline(8.8, linewidth=1)
        ax.axhline(1.2, linewidth=1)
    else:
        title = "Ocean Science — Conceptual Diagram"
        fig, ax = plt.subplots(figsize=(9, 6))
        ax.text(0.5, 0.55, "Conceptual visualization", ha="center", va="center",
                fontsize=24, transform=ax.transAxes)
        ax.text(0.5, 0.40, query, ha="center", va="center",
                fontsize=12, transform=ax.transAxes)
        ax.axis("off")

    ax.set_title(title)
    ax.axis("off")
    fig.tight_layout()

    filename = f"{uuid.uuid4().hex}.png"
    path = OUTPUT_DIR / filename
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return filename, "image/png"
