import React from "react";

export default function ScientificLegend({ variable, units, min = 12, max = 30 }) {
  const formatVal = (v) => (typeof v === "number" ? v.toFixed(1) : v);
  const mid = ((min + max) / 2).toFixed(1);

  return (
    <div className="scientific-legend">
      <div className="legend-header">
        <span className="legend-title">
          {variable ? variable.toUpperCase() : "SCALAR VALUE"}
        </span>
        <span className="legend-units">[{units || "degC"}]</span>
      </div>
      <div className="legend-gradient-bar"></div>
      <div className="legend-ticks">
        <span className="tick-label">{formatVal(min)}</span>
        <span className="tick-label">{mid}</span>
        <span className="tick-label">{formatVal(max)}</span>
      </div>
    </div>
  );
}
