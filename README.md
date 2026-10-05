# GYANI Intelligent Scientific Visualization Prototype

A runnable prototype of the visualization module described in the GYANI project specification.

## What this prototype does

1. Accepts a natural-language ocean-science query.
2. Detects whether it is a data-driven visualization or conceptual visualization.
3. Extracts:
   - variable
   - region/location
   - date range
   - visualization type
4. Loads a sample NetCDF ocean dataset with `xarray`.
5. Generates:
   - SST animated maps
   - SSH animated maps
   - temperature time/depth plots
   - salinity time/depth plots
   - current/vector visualizations
   - time-series plots
   - conceptual ocean-science diagrams
6. Returns the generated visualization and metadata through FastAPI.
7. Provides a React frontend for testing.
8. Includes multilingual UI and query support for English, Telugu, Hindi, and Tamil.

The sample data is synthetic and clearly marked as demo data. Replace the dataset adapter later with verified INCOIS NetCDF/Zarr/model/observation data.

## Architecture

```text
React UI
   |
   v
FastAPI /api/visualize
   |
   +--> Query parser
   |
   +--> Visualization selector
   |
   +--> Dataset adapter
   |       |
   |       +--> sample NetCDF now
   |       +--> INCOIS NetCDF/Zarr later
   |
   +--> Matplotlib / xarray
   |
   +--> MP4/PNG output
   |
   v
Visualization + metadata
```

## Requirements

- Python 3.10+
- Node.js 18+

## 1. Start backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

Generate demo NetCDF:

```bash
python data/generate_sample_data.py
```

Start API:

```bash
uvicorn app.main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/docs
```

## 2. Start frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

## Example queries

```text
Show SST evolution in the Arabian Sea during June 2025
```

```text
Show SSH evolution in the Bay of Bengal
```

```text
How did temperature change with depth at 10 N 75 E during June 2025?
```

```text
Show the current pattern during June 2025
```

```text
What is coastal upwelling?
```

## API

### POST `/api/visualize`

Example:

```json
{
  "query": "Show SST evolution in the Arabian Sea during June 2025"
}
```

The API returns a visualization URL, metadata, parsed intent and explanation.

### GET `/api/datasets`

Returns the currently configured datasets.

### GET `/api/health`

Health check.

## Replacing the sample dataset with INCOIS data

The important integration point is:

```text
backend/app/services/dataset_service.py
```

Replace the demo dataset path/adapter with the INCOIS NetCDF/Zarr source.

The visualization functions already consume an xarray Dataset, so the visualization layer can remain largely unchanged.

## Scientific integrity

The prototype does NOT use generative AI to invent scientific data.

For data-driven requests:

```text
Dataset -> subset -> visualization
```

For conceptual requests, the prototype uses deterministic schematic diagrams. A generative-AI conceptual illustration service can be added later as a separate module.

This separation is intentional and follows the project requirement that data-derived visualizations preserve the underlying dataset.

## Project structure

```text
gyani_visualization_prototype/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   └── services/
│   │       ├── query_parser.py
│   │       ├── dataset_service.py
│   │       ├── visualization_service.py
│   │       └── conceptual_service.py
│   ├── data/
│   │   └── generate_sample_data.py
│   ├── outputs/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```


## Multilingual support

Use the language selector in the top-right of the React interface to switch between **English, Telugu, Hindi, and Tamil**. Labels, help text, example prompts, and the prototype notice are localized. The backend also normalizes common ocean-science terms in these languages so users can submit supported scientific queries directly in their selected language.
