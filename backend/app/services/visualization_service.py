from pathlib import Path
import uuid
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, FFMpegWriter
import xarray as xr

OUTPUT_DIR = Path(__file__).resolve().parents[2] / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


def _name(variable):
    return {
        "sst": ("Sea Surface Temperature", "°C"),
        "ssh": ("Sea Surface Height", "m"),
        "temperature": ("Temperature", "°C"),
        "salinity": ("Salinity", "PSU"),
        "current": ("Current Speed", "m/s"),
        "mixed_layer_depth": ("Mixed Layer Depth", "m"),
    }.get(variable, (variable.upper(), ""))


def static_map(da, variable):
    title, unit = _name(variable)
    if "time" in da.dims:
        da = da.isel(time=0)

    fig, ax = plt.subplots(figsize=(10, 6))
    mesh = ax.pcolormesh(da.lon, da.lat, da, shading="auto")
    fig.colorbar(mesh, ax=ax, label=unit)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title(title)
    fig.tight_layout()

    filename = f"{uuid.uuid4().hex}.png"
    path = OUTPUT_DIR / filename
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return filename, "image/png"


def time_series(da, variable):
    title, unit = _name(variable)
    if "lat" in da.dims:
        da = da.mean(dim="lat")
    if "lon" in da.dims:
        da = da.mean(dim="lon")

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(da.time.values, da.values)
    ax.set_title(f"{title} Time Series")
    ax.set_xlabel("Time")
    ax.set_ylabel(unit)
    ax.grid(alpha=0.25)
    fig.autofmt_xdate()
    fig.tight_layout()

    filename = f"{uuid.uuid4().hex}.png"
    path = OUTPUT_DIR / filename
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return filename, "image/png"


def depth_time(da, variable):
    title, unit = _name(variable)

    # Demo dataset stores temperature/salinity with depth.
    if "depth" not in da.dims:
        # Fallback: use surface value if depth is unavailable.
        return time_series(da, variable)

    if "lat" in da.dims:
        da = da.mean(dim="lat")
    if "lon" in da.dims:
        da = da.mean(dim="lon")

    fig, ax = plt.subplots(figsize=(10, 6))
    mesh = ax.pcolormesh(
        da.time, da.depth, da.transpose("depth", "time"),
        shading="auto"
    )
    ax.invert_yaxis()
    fig.colorbar(mesh, ax=ax, label=unit)
    ax.set_title(f"{title}: Time-Depth Evolution")
    ax.set_xlabel("Time")
    ax.set_ylabel("Depth (m)")
    fig.autofmt_xdate()
    fig.tight_layout()

    filename = f"{uuid.uuid4().hex}.png"
    path = OUTPUT_DIR / filename
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return filename, "image/png"


def animated_map(da, variable):
    title, unit = _name(variable)

    if "time" not in da.dims:
        da = da.expand_dims(time=[0])

    # Keep animation reasonably small for the prototype.
    da = da.isel(time=slice(0, min(da.sizes["time"], 30)))

    values = da.values
    vmin = float(np.nanmin(values))
    vmax = float(np.nanmax(values))

    fig, ax = plt.subplots(figsize=(10, 6))
    mesh = ax.pcolormesh(
        da.lon, da.lat, values[0],
        shading="auto", vmin=vmin, vmax=vmax
    )
    cbar = fig.colorbar(mesh, ax=ax, label=unit)
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title(title)

    def update(frame):
        mesh.set_array(values[frame].ravel())
        date_text = str(da.time.values[frame])[:10]
        ax.set_title(f"{title} — {date_text}")
        return mesh,

    anim = FuncAnimation(
        fig, update, frames=len(da.time), interval=300, blit=False
    )

    filename = f"{uuid.uuid4().hex}.mp4"
    path = OUTPUT_DIR / filename

    try:
        writer = FFMpegWriter(fps=3, bitrate=1800)
        anim.save(path, writer=writer)
        media_type = "video/mp4"
    except Exception:
        # If ffmpeg is unavailable, save a static fallback.
        fallback = path.with_suffix(".png")
        plt.savefig(fallback, dpi=150)
        filename = fallback.name
        media_type = "image/png"

    plt.close(fig)
    return filename, media_type


def current_map(ds):
    if "current_u" not in ds or "current_v" not in ds:
        raise ValueError("Current vector variables are not available.")

    u = ds.current_u.isel(time=0)
    v = ds.current_v.isel(time=0)

    fig, ax = plt.subplots(figsize=(10, 6))
    speed = np.sqrt(u ** 2 + v ** 2)
    mesh = ax.pcolormesh(speed.lon, speed.lat, speed, shading="auto")
    step = 3
    ax.quiver(
        u.lon.values[::step], u.lat.values[::step],
        u.values[::step, ::step], v.values[::step, ::step]
    )
    fig.colorbar(mesh, ax=ax, label="m/s")
    ax.set_title("Ocean Current Pattern")
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    fig.tight_layout()

    filename = f"{uuid.uuid4().hex}.png"
    path = OUTPUT_DIR / filename
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return filename, "image/png"


def generate(ds, intent):
    from .dataset_service import variable_data

    if intent.visualization == "current_map":
        return current_map(ds)

    da = variable_data(ds, intent.variable)

    if intent.visualization == "animated_map":
        return animated_map(da, intent.variable)
    if intent.visualization == "depth_time":
        return depth_time(da, intent.variable)
    if intent.visualization == "timeseries":
        return time_series(da, intent.variable)

    return static_map(da, intent.variable)
