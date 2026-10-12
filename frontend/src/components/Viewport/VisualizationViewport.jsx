import React, { useState } from "react";
import UnderwaterScene from "../ThreeD/UnderwaterScene";
import TimelineControls from "../ThreeD/TimelineControls";
import ScientificLegend from "../Common/ScientificLegend";
import { Box, Image as ImageIcon, Video, Compass, Sparkles } from "lucide-react";

export default function VisualizationViewport({
  result,
  apiBase = "http://localhost:8000",
  timeIndex,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  t,
}) {
  if (!result) return null;

  const is3D = result.is_3d && result.grid_3d;
  const [viewMode, setViewMode] = useState(is3D ? "3d" : "2d");

  const media = result.visualization;
  const grid3d = result.grid_3d;
  const times = grid3d?.coordinates?.times || [];
  const bounds = grid3d?.value_bounds || { min: 12, max: 30 };

  return (
    <div className="visualization-viewport-card">
      <div className="viewport-header">
        <div className="viewport-title-block">
          <span className="viewport-eyebrow">
            {result.category === "conceptual" ? "CONCEPTUAL MECHANISM" : "OCEANOGRAPHIC DATA"}
          </span>
          <h2 className="viewport-title">
            {result.intent?.visualization?.replace(/_/g, " ").toUpperCase() || "VISUALIZATION"}
          </h2>
        </div>

        {/* View Mode Switcher (if 3D is active) */}
        <div className="viewport-mode-controls">
          {is3D && (
            <div className="mode-toggle-group">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`mode-btn ${viewMode === "3d" ? "active" : ""}`}
              >
                <Box size={14} />
                <span>Interactive 3D</span>
              </button>
              {media && (
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className={`mode-btn ${viewMode === "2d" ? "active" : ""}`}
                >
                  <ImageIcon size={14} />
                  <span>2D Overview</span>
                </button>
              )}
            </div>
          )}

          <span className={`category-tag ${result.category}`}>
            {result.category === "conceptual" ? "CONCEPTUAL SCHEMATIC" : "DATA-DERIVED"}
          </span>
        </div>
      </div>

      {/* Main Rendering Stage */}
      <div className="viewport-stage">
        {viewMode === "3d" && is3D ? (
          <div className="stage-3d-wrapper">
            <UnderwaterScene gridData={grid3d} timeIndex={timeIndex} />

            {/* Stage Overlays: Legend & Timeline */}
            <div className="stage-3d-footer">
              <ScientificLegend
                variable={grid3d.variable}
                units={grid3d.units}
                min={bounds.min}
                max={bounds.max}
              />
              <TimelineControls
                times={times}
                currentTimeIndex={timeIndex}
                onTimeChange={onTimeChange}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={onChangeSpeed}
              />
            </div>
          </div>
        ) : (
          <div className="stage-2d-wrapper">
            {media?.media_type === "video/mp4" ? (
              <video
                controls
                autoPlay
                loop
                src={`${apiBase}${media.url}`}
                className="visual-media video-media"
              />
            ) : media?.url ? (
              <img
                src={`${apiBase}${media.url}`}
                alt={t?.imageAlt || "Ocean visualization"}
                className="visual-media image-media"
              />
            ) : (
              <div className="no-media-placeholder">
                <Compass size={40} className="placeholder-icon" />
                <p>3D dataset active. Switch to 3D tab above to interact with depth layers.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scientific Explanation Bar */}
      {result.explanation && (
        <div className="explanation-bar">
          <Sparkles size={16} className="explain-icon" />
          <p className="explanation-text">{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
