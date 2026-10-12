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
        "scientific_classification": ds.attrs.get("scientific_classification", "SYNTHETIC_PROTOTYPE"),
        "institution": ds.attrs.get("institution", "INCOIS Prototype Demo"),
        "variables": list(ds.data_vars),
        "time_start": str(ds.time.values[0])[:10],
        "time_end": str(ds.time.values[-1])[:10],
        "latitude_range": [float(ds.lat.min()), float(ds.lat.max())],
        "longitude_range": [float(ds.lon.min()), float(ds.lon.max())],
        "depth_range": [float(ds.depth.min()), float(ds.depth.max())] if "depth" in ds.coords else None,
    }


def extract_3d_grid(ds, intent=None, step: int = 2):
    var_name = intent.variable if intent and intent.variable in ds else "temperature"
    if var_name not in ds:
        var_name = "temperature"

    da = ds[var_name]

    # Subsample spatial coordinates for smooth WebGL streaming
    sub_ds = ds.isel(lat=slice(None, None, step), lon=slice(None, None, step))
    da_sub = sub_ds[var_name]

    lats = [round(float(x), 2) for x in sub_ds.lat.values]
    lons = [round(float(x), 2) for x in sub_ds.lon.values]
    depths = [round(float(x), 1) for x in sub_ds.depth.values] if "depth" in sub_ds.coords else [0.0]
    times = [str(t)[:10] for t in sub_ds.time.values] if "time" in sub_ds.coords else ["2025-06-01"]

    val_min = float(np.nanmin(da_sub.values))
    val_max = float(np.nanmax(da_sub.values))
    units = da.attrs.get("units", "degC" if var_name == "temperature" else "")

    layers = []
    if "depth" in da_sub.dims:
        for d in depths:
            layer_da = da_sub.sel(depth=d)
            raw_vals = layer_da.values
            vals_by_time = []
            for t_idx in range(len(times)):
                t_slice = raw_vals[t_idx] if "time" in da_sub.dims else raw_vals
                t_grid = []
                for row in t_slice:
                    t_grid.append([None if np.isnan(v) else round(float(v), 2) for v in row])
                vals_by_time.append(t_grid)
            layers.append({
                "depth": float(d),
                "values_by_time": vals_by_time
            })
    else:
        raw_vals = da_sub.values
        vals_by_time = []
        for t_idx in range(len(times)):
            t_slice = raw_vals[t_idx] if "time" in da_sub.dims else raw_vals
            t_grid = []
            for row in t_slice:
                t_grid.append([None if np.isnan(v) else round(float(v), 2) for v in row])
            vals_by_time.append(t_grid)
        layers.append({
            "depth": 0.0,
            "values_by_time": vals_by_time
        })

    return {
        "variable": var_name,
        "units": units,
        "data_classification": ds.attrs.get("scientific_classification", "SYNTHETIC_PROTOTYPE"),
        "coordinates": {
            "lats": lats,
            "lons": lons,
            "depths": depths,
            "times": times,
        },
        "value_bounds": {"min": val_min, "max": val_max},
        "layers": layers,
        "metadata": dataset_metadata(ds)
    }
