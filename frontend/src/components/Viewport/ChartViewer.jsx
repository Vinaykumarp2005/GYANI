/**
 * ChartViewer.jsx
 * ---------------
 * Interactive chart renderer for GYANI using Chart.js (via CDN-style
 * dynamic import or direct package import).
 *
 * Accepts a `chartData` payload from the backend structured as:
 * {
 *   type: "line" | "bar" | "scatter" | "doughnut" | "radar",
 *   title: string,
 *   labels: string[],
 *   datasets: [{ label, data, borderColor?, backgroundColor? }],
 *   xLabel?: string,
 *   yLabel?: string,
 * }
 *
 * Falls back to a styled data table if Chart.js is unavailable or
 * the payload is malformed.
 */

import React, { useEffect, useRef, useState } from "react";
import { BarChart2, AlertCircle, Download, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Palette — GYANI ocean colour scheme
// ---------------------------------------------------------------------------
const OCEAN_PALETTE = [
  "rgba(0, 168, 204, 0.85)",
  "rgba(0, 120, 180, 0.85)",
  "rgba(32, 208, 160, 0.85)",
  "rgba(100, 70, 200, 0.85)",
  "rgba(255, 180, 40, 0.85)",
  "rgba(220, 80, 80, 0.85)",
  "rgba(80, 200, 120, 0.85)",
];

const OCEAN_BORDERS = OCEAN_PALETTE.map((c) => c.replace("0.85", "1"));

// ---------------------------------------------------------------------------
// Fallback: plain data table
// ---------------------------------------------------------------------------
function DataTable({ chartData }) {
  if (!chartData?.labels || !chartData?.datasets?.length) return null;
  return (
    <div className="chart-fallback-table-wrap">
      <p className="chart-fallback-note">
        <AlertCircle size={13} /> Chart.js unavailable — showing data table.
      </p>
      <div className="chart-table-scroll">
        <table className="chart-data-table">
          <thead>
            <tr>
              <th>{chartData.xLabel || "Label"}</th>
              {chartData.datasets.map((ds) => (
                <th key={ds.label}>{ds.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.labels.map((label, i) => (
              <tr key={i}>
                <td>{label}</td>
                {chartData.datasets.map((ds) => (
                  <td key={ds.label}>{ds.data[i] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Normalise the chart payload — apply palette, ensure required fields
// ---------------------------------------------------------------------------
function normaliseChartData(raw) {
  if (!raw || !raw.labels || !raw.datasets) return null;
  return {
    ...raw,
    datasets: raw.datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.borderColor || OCEAN_BORDERS[i % OCEAN_BORDERS.length],
      backgroundColor:
        ds.backgroundColor || OCEAN_PALETTE[i % OCEAN_PALETTE.length],
      tension: ds.tension ?? 0.4,
      fill: ds.fill ?? false,
      pointRadius: ds.pointRadius ?? 3,
    })),
  };
}

// ---------------------------------------------------------------------------
// Canvas-based Chart renderer
// ---------------------------------------------------------------------------
function CanvasChart({ chartData, onError }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let destroyed = false;

    async function renderChart() {
      try {
        // Dynamic import — Chart.js must be installed (added to package.json)
        const { Chart, registerables } = await import("chart.js");
        Chart.register(...registerables);

        if (destroyed || !canvasRef.current) return;

        // Destroy previous instance if any
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        const normalised = normaliseChartData(chartData);
        if (!normalised) {
          onError("Invalid chart data structure.");
          return;
        }

        chartRef.current = new Chart(canvasRef.current, {
          type: normalised.type || "line",
          data: {
            labels: normalised.labels,
            datasets: normalised.datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: "rgba(200, 220, 240, 0.9)",
                  font: { family: "'Inter', sans-serif", size: 12 },
                },
              },
              title: {
                display: !!normalised.title,
                text: normalised.title || "",
                color: "rgba(200, 220, 240, 0.95)",
                font: { family: "'Inter', sans-serif", size: 14, weight: "600" },
                padding: { bottom: 12 },
              },
              tooltip: {
                backgroundColor: "rgba(10, 20, 40, 0.92)",
                titleColor: "#a0c8f0",
                bodyColor: "#d0e8ff",
                borderColor: "rgba(0, 168, 204, 0.4)",
                borderWidth: 1,
              },
            },
            scales:
              normalised.type === "doughnut" || normalised.type === "radar"
                ? {}
                : {
                    x: {
                      ticks: {
                        color: "rgba(160, 200, 230, 0.8)",
                        font: { size: 11 },
                      },
                      grid: { color: "rgba(0, 120, 180, 0.1)" },
                      title: normalised.xLabel
                        ? {
                            display: true,
                            text: normalised.xLabel,
                            color: "rgba(160, 200, 230, 0.7)",
                          }
                        : undefined,
                    },
                    y: {
                      ticks: {
                        color: "rgba(160, 200, 230, 0.8)",
                        font: { size: 11 },
                      },
                      grid: { color: "rgba(0, 120, 180, 0.12)" },
                      title: normalised.yLabel
                        ? {
                            display: true,
                            text: normalised.yLabel,
                            color: "rgba(160, 200, 230, 0.7)",
                          }
                        : undefined,
                    },
                  },
          },
        });
      } catch (err) {
        if (!destroyed) onError(String(err));
      }
    }

    renderChart();

    return () => {
      destroyed = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <div className="chart-canvas-wrapper">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChartViewer
// ---------------------------------------------------------------------------
export default function ChartViewer({
  chartData,        // structured chart payload (see file header)
  isLoading = false,
  fallbackText = null,
}) {
  const [chartError, setChartError] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const handleDownload = () => {
    const canvas = document.querySelector(".chart-canvas-wrapper canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `gyani-chart-${Date.now()}.png`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="chart-viewer-skeleton">
        <div className="skeleton-shimmer" />
        <p className="skeleton-caption">Building chart…</p>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="chart-viewer-empty">
        <BarChart2 size={40} className="chart-empty-icon" />
        <p>No chart data available.</p>
        {fallbackText && <p className="chart-fallback-msg">{fallbackText}</p>}
      </div>
    );
  }

  return (
    <div className="chart-viewer-card">
      {/* Header */}
      <div className="chart-viewer-header">
        <div className="chart-viewer-title-group">
          <BarChart2 size={16} className="chart-header-icon" />
          <span className="chart-viewer-title">
            {chartData.title || "Ocean Science Chart"}
          </span>
        </div>
        <div className="chart-viewer-actions">
          <button
            type="button"
            className="chart-action-btn"
            onClick={() => setShowTable(!showTable)}
            title="Toggle data table"
          >
            <RefreshCw size={13} />
            {showTable ? "Chart" : "Table"}
          </button>
          <button
            type="button"
            className="chart-action-btn"
            onClick={handleDownload}
            title="Download chart as PNG"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Chart or Table */}
      {showTable || chartError ? (
        <DataTable chartData={chartData} />
      ) : (
        <CanvasChart
          chartData={chartData}
          onError={(e) => {
            setChartError(e);
            setShowTable(true);
          }}
        />
      )}

      {/* Type badge */}
      <div className="chart-type-badge">
        {(chartData.type || "line").toUpperCase()} CHART
      </div>
    </div>
  );
}
