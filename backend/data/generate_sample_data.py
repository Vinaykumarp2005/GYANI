from pathlib import Path
import numpy as np
import xarray as xr

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "sample_ocean.nc"

rng = np.random.default_rng(42)

time = np.arange("2025-06-01", "2025-07-01", dtype="datetime64[D]")
lat = np.linspace(5, 25, 35)
lon = np.linspace(55, 85, 45)
depth = np.array([0, 10, 25, 50, 75, 100, 150, 200])

T, Y, X = np.meshgrid(
    np.arange(len(time)), lat, lon, indexing="ij"
)

# Synthetic but smooth demo fields.
sst = (
    28
    + 1.8*np.sin((X-55)/30*np.pi)
    + 1.2*np.cos((Y-5)/20*np.pi)
    + 0.35*np.sin(T/5)
    + rng.normal(0, 0.08, T.shape)
)

ssh = (
    0.25*np.sin((X-55)/8)
    * np.cos((Y-5)/7)
    + 0.02*np.sin(T/4)
)

u = 0.35*np.cos((Y-5)/8) + 0.03*np.sin(T/4)
v = 0.25*np.sin((X-55)/9) + 0.03*np.cos(T/5)

speed = np.sqrt(u*u + v*v)
mld = 35 + 10*np.sin((Y-5)/20*np.pi) + 4*np.sin(T/6)

# Depth-dependent variables: time x depth x lat x lon.
D = depth[None, :, None, None]
temperature = (
    sst[:, None, :, :]
    - 0.018*D
    + 0.3*np.sin(T[:, None, :, :]/6)
)
salinity = (
    34.8
    + 0.012*D
    + 0.1*np.cos((X[:, None, :, :]-55)/10)
    + 0.03*np.sin(T[:, None, :, :]/4)
)

ds = xr.Dataset(
    {
        "sst": (("time", "lat", "lon"), sst),
        "ssh": (("time", "lat", "lon"), ssh),
        "current_u": (("time", "lat", "lon"), u),
        "current_v": (("time", "lat", "lon"), v),
        "current_speed": (("time", "lat", "lon"), speed),
        "mld": (("time", "lat", "lon"), mld),
        "temperature": (("time", "depth", "lat", "lon"), temperature),
        "salinity": (("time", "depth", "lat", "lon"), salinity),
    },
    coords={
        "time": time,
        "depth": depth,
        "lat": lat,
        "lon": lon,
    },
    attrs={
        "title": "GYANI Prototype Synthetic Ocean Dataset",
        "source": "Synthetic demo data — NOT INCOIS observations/model output",
        "description": "Generated solely for software prototype testing.",
    },
)

ds.sst.attrs.update(units="degC", long_name="Sea Surface Temperature")
ds.ssh.attrs.update(units="m", long_name="Sea Surface Height")
ds.temperature.attrs.update(units="degC", long_name="Temperature")
ds.salinity.attrs.update(units="PSU", long_name="Salinity")
ds.current_speed.attrs.update(units="m/s", long_name="Current Speed")
ds.mld.attrs.update(units="m", long_name="Mixed Layer Depth")

ds.to_netcdf(OUT)
print(f"Created {OUT}")
