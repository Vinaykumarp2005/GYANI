import React, { useState } from "react";
import { Database, ShieldCheck, AlertTriangle, Info, MapPin, Calendar, Layers, ChevronDown, ChevronUp, Palette, Sparkles } from "lucide-react";

export default function ScientificMetadataPanel({ result }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!result) return null;

  const metadata = result.metadata || {};
  const intent = result.intent || {};
  const grid3d = result.grid_3d;

  const classification =
    metadata.scientific_classification ||
    (result.category === "IMAGE_GENERATION"
      ? "AI_GENERATED_ILLUSTRATION"
      : result.category === "TEXT"
      ? "CONCEPTUAL_SCHEMATIC"
      : "SYNTHETIC_PROTOTYPE");

  const classificationConfig = {
    SYNTHETIC_PROTOTYPE: {
      label: "Synthetic Prototype (Demo Model)",
      colorClass: "badge-synthetic",
      icon: AlertTriangle,
      description: "Numerical dataset generated for software evaluation. Not operational INCOIS forecast.",
    },
    CONCEPTUAL_SCHEMATIC: {
      label: "Conceptual Scientific Synthesis",
      colorClass: "badge-conceptual",
      icon: Info,
      description: "Educational synthesis explaining oceanographic physics, atmospheric forces, or marine parameters.",
    },
    AI_GENERATED_ILLUSTRATION: {
      label: "AI Generated Illustration (Non-Measurement)",
      colorClass: "badge-ai-art",
      icon: Palette,
      description: "Generative artistic illustration representing an oceanographic theme. Does not represent in-situ measurements.",
    },
    INCOIS_VERIFIED: {
      label: "INCOIS Verified Data",
      colorClass: "badge-verified",
      icon: ShieldCheck,
      description: "Derived from verified INCOIS observation or operational numerical forecast archives.",
    },
  }[classification] || {
    label: classification,
    colorClass: "badge-synthetic",
    icon: AlertTriangle,
    description: "Ocean prototype data.",
  };

  const BadgeIcon = classificationConfig.icon;

  const variable = grid3d?.variable || intent.variable || (result.category === "TEXT" ? "Ocean Concept" : "SST");
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

      {/* Gemini Classification Reason Banner */}
      {result.reason && (
        <div className="meta-gemini-reason-card">
          <Sparkles size={14} className="gemini-spark-icon" />
          <div className="gemini-reason-content">
            <span className="reason-title">Gemini Decision Logic ({result.category}):</span>
            <span className="reason-text">{result.reason}</span>
          </div>
        </div>
      )}

      <div className="meta-metrics-grid">
        <div className="metric-cell">
          <span className="metric-label">Target Variable</span>
          <span className="metric-val">{variable.toUpperCase()} {units ? `(${units})` : ""}</span>
        </div>

        <div className="metric-cell">
          <span className="metric-label">Execution Category</span>
          <span className="metric-val highlight">{result.category || intent.visualization || "2D Surface Map"}</span>
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
          <span className="metric-label">Engine / Data Source</span>
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
          <span>{showRaw ? "Hide Technical Debug JSON" : "Inspect Raw Gemini Intent & Schema"}</span>
          {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showRaw && (
          <div className="raw-json-inspector">
            <pre>{JSON.stringify({ classification: result.classification, intent: result.intent, metadata: result.metadata }, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
