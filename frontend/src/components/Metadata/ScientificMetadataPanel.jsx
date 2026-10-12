import React, { useState } from "react";
import { Database, ShieldCheck, AlertTriangle, Info, MapPin, Calendar, Layers, ChevronDown, ChevronUp } from "lucide-react";

export default function ScientificMetadataPanel({ result }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!result) return null;

  const metadata = result.metadata || {};
  const intent = result.intent || {};
  const grid3d = result.grid_3d;

  const classification =
    metadata.scientific_classification ||
    (result.category === "conceptual" ? "CONCEPTUAL_SCHEMATIC" : "SYNTHETIC_PROTOTYPE");

  const classificationConfig = {
    SYNTHETIC_PROTOTYPE: {
      label: "Synthetic Prototype (Demo Model)",
      colorClass: "badge-synthetic",
      icon: AlertTriangle,
      description: "Generated for software testing. Not verified INCOIS observation or operational forecast.",
    },
    CONCEPTUAL_SCHEMATIC: {
      label: "Conceptual Scientific Illustration",
      colorClass: "badge-conceptual",
      icon: Info,
      description: "Educational schematic diagram explaining oceanographic physics, not measured data.",
    },
    INCOIS_VERIFIED: {
      label: "INCOIS Verified Data",
      colorClass: "badge-verified",
      icon: ShieldCheck,
      description: "Derived from verified INCOIS observation or numerical forecast archives.",
    },
  }[classification] || {
    label: classification,
    colorClass: "badge-synthetic",
    icon: AlertTriangle,
    description: "Ocean prototype data.",
  };

  const BadgeIcon = classificationConfig.icon;

  const variable = grid3d?.variable || intent.variable || "SST";
  const units = grid3d?.units || (variable === "temperature" || variable === "sst" ? "°C" : "");
  const timeStart = metadata.time_start || intent.start_date || "2025-06-01";
  const timeEnd = metadata.time_end || intent.end_date || "2025-06-30";
  const latRange = metadata.latitude_range ? `${metadata.latitude_range[0]}°N to ${metadata.latitude_range[1]}°N` : "5°N to 25°N";
  const lonRange = metadata.longitude_range ? `${metadata.longitude_range[0]}°E to ${metadata.longitude_range[1]}°E` : "55°E to 85°E";
  const depthRange = metadata.depth_range ? `${metadata.depth_range[0]}m to ${metadata.depth_range[1]}m` : "0m to 200m";

  return (
    <div className="scientific-metadata-card">
      <div className="meta-card-header">
        <div className="meta-header-title">
          <Database size={16} className="meta-header-icon" />
          <span>Scientific Metadata & Provenance</span>
        </div>

        <div className={`classification-badge ${classificationConfig.colorClass}`}>
          <BadgeIcon size={13} />
          <span>{classificationConfig.label}</span>
        </div>
      </div>

      <p className="classification-disclaimer">
        {classificationConfig.description}
      </p>

      <div className="meta-metrics-grid">
        <div className="metric-cell">
          <span className="metric-label">Target Variable</span>
          <span className="metric-val">{variable.toUpperCase()} {units ? `(${units})` : ""}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Visualization Type</span>
          <span className="metric-val highlight">{intent.visualization || "2D Surface Map"}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">
            <Calendar size={12} className="inline-icon" /> Temporal Span
          </span>
          <span className="metric-val">{timeStart} — {timeEnd}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">
            <MapPin size={12} className="inline-icon" /> Geographic Extent
          </span>
          <span className="metric-val">{latRange}, {lonRange}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">
            <Layers size={12} className="inline-icon" /> Vertical Depth Span
          </span>
          <span className="metric-val">{depthRange}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Data Source</span>
          <span className="metric-val truncate" title={metadata.source || metadata.provenance}>
            {metadata.source || metadata.provenance || "NetCDF Prototype Model"}
          </span>
        </div>
      </div>

      {/* Raw Payload Inspector Toggle */}
      <div className="meta-raw-toggle-section">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="raw-toggle-btn"
        >
          <span>{showRaw ? "Hide Technical Debug JSON" : "Inspect Raw Intent & Schema"}</span>
          {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showRaw && (
          <div className="raw-json-inspector">
            <pre>{JSON.stringify({ intent: result.intent, metadata: result.metadata }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
