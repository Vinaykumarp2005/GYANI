from pathlib import Path
import xarray as xr
import numpy as np

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
DATASET_PATH = DATA_DIR / "sample_ocean.nc"


def load_dataset():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            "sample_ocean.nc not found. Run: python data/generate_sample_data.py"
        )
    return xr.open_dataset(DATASET_PATH)


def subset_dataset(ds, intent):
    out = ds

    if intent.start_date and "time" in ds.coords:
        out = out.sel(time=slice(intent.start_date, intent.end_date or intent.start_date))

    if intent.latitude is not None and "lat" in ds.coords:
        out = out.sel(lat=intent.latitude, method="nearest")

    if intent.longitude is not None and "lon" in ds.coords:
        out = out.sel(lon=intent.longitude, method="nearest")

    return out


def variable_data(ds, variable):
    aliases = {
        "sst": "sst",
        "ssh": "ssh",
        "temperature": "temperature",
        "salinity": "salinity",
        "current": "current_speed",
        "mixed_layer_depth": "mld",
    }
    name = aliases.get(variable, variable)
    if name not in ds:
        raise ValueError(f"Variable '{variable}' is not available in the dataset.")
    return ds[name]


def dataset_metadata(ds):
    return {
        "source": ds.attrs.get("source", "Demo synthetic dataset"),
        "dataset": ds.attrs.get("title", "GYANI Demo Ocean Dataset"),
        "variables": list(ds.data_vars),
        "time_start": str(ds.time.values[0])[:10],
        "time_end": str(ds.time.values[-1])[:10],
        "latitude_range": [float(ds.lat.min()), float(ds.lat.max())],
        "longitude_range": [float(ds.lon.min()), float(ds.lon.max())],
    }
