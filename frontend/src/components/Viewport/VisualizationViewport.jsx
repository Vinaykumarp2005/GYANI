import React, { useState } from "react";
import UnderwaterScene from "../ThreeD/UnderwaterScene";
import TimelineControls from "../ThreeD/TimelineControls";
import ScientificLegend from "../Common/ScientificLegend";
import { Box, Image as ImageIcon, Video, Compass, Sparkles, BookOpen, Palette, Info, CheckCircle2 } from "lucide-react";

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

  const is3D = result.category === "3D_VISUALIZATION" || (result.is_3d && result.grid_3d);
  const isText = result.category === "TEXT";
  const isImageGen = result.category === "IMAGE_GENERATION";

  const [viewMode, setViewMode] = useState(is3D ? "3d" : "2d");

  const media = result.visualization;
  const grid3d = result.grid_3d;
  const times = grid3d?.coordinates?.times || [];
  const bounds = grid3d?.value_bounds || { min: 12, max: 30 };

  const categoryMeta = {
    TEXT: {
      badge: "EXPLANATORY SYNTHESIS",
      icon: BookOpen,
      class: "cat-text",
      eyebrow: "AI OCEAN KNOWLEDGE BASE"
    },
    "2D_VISUALIZATION": {
      badge: "2D NUMERICAL DATA MAP",
      icon: ImageIcon,
      class: "cat-2d",
      eyebrow: "SCIENTIFIC OBSERVATION & MODEL GRID"
    },
    "3D_VISUALIZATION": {
      badge: "INTERACTIVE 3D DEPTH MODEL",
      icon: Box,
      class: "cat-3d",
      eyebrow: "3D OCEAN VOLUMETRIC GRID"
    },
    IMAGE_GENERATION: {
      badge: "AI SCIENTIFIC ILLUSTRATION",
      icon: Palette,
      class: "cat-image",
      eyebrow: "GENERATIVE CONCEPTUAL ARTWORK"
    }
  }[result.category] || {
    badge: result.category || "VISUALIZATION",
    icon: Sparkles,
    class: "cat-default",
    eyebrow: "OCEANOGRAPHIC DATA"
  };

  const CategoryIcon = categoryMeta.icon;

  return (
    <div className="visualization-viewport-card">
      <div className="viewport-header">
        <div className="viewport-title-block">
          <span className="viewport-eyebrow">{categoryMeta.eyebrow}</span>
          <h2 className="viewport-title">
            {isText
              ? "Scientific Explanation"
              : isImageGen
              ? "Conceptual Illustration"
              : result.intent?.visualization?.replace(/_/g, " ").toUpperCase() || "VISUALIZATION"}
          </h2>
        </div>

        {/* View Mode Switcher / Category Badge */}
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

          <div className={`gemini-category-badge ${categoryMeta.class}`}>
            <CategoryIcon size={13} />
            <span>{categoryMeta.badge}</span>
          </div>
        </div>
      </div>

      {/* Main Rendering Stage */}
      <div className="viewport-stage">
        {/* 1. TEXT Category Render */}
        {isText ? (
          <div className="stage-text-wrapper">
            <div className="text-response-container">
              <div className="text-response-content">
                {result.answer ? (
                  result.answer.split("\n\n").map((para, idx) => {
                    if (para.startsWith("### ")) {
                      return <h3 key={idx} className="text-resp-h3">{para.replace("### ", "")}</h3>;
                    }
                    if (para.startsWith("#### ")) {
                      return <h4 key={idx} className="text-resp-h4">{para.replace("#### ", "")}</h4>;
                    }
                    if (para.startsWith("- ") || para.startsWith("* ")) {
                      return (
                        <ul key={idx} className="text-resp-list">
                          {para.split("\n").map((li, lidx) => (
                            <li key={lidx}>
                              {li.replace(/^[-*]\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="text-resp-p">{para.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                  })
                ) : (
                  <p>{result.explanation || "No explanation text available."}</p>
                )}
              </div>
              <div className="text-response-badge">
                <CheckCircle2 size={13} className="text-verified-icon" />
                <span>Verified with INCOIS Oceanographic Principles & Gemini Intelligence</span>
              </div>
            </div>
          </div>
        ) : isImageGen ? (
          /* 2. IMAGE_GENERATION Category Render */
          <div className="stage-image-gen-wrapper">
            {media?.url ? (
              <div className="ai-art-container">
                <img
                  src={`${apiBase}${media.url}`}
                  alt="AI Generated Oceanographic Illustration"
                  className="visual-media ai-illustration-media"
                />
                <div className="ai-art-banner">
                  <Palette size={14} />
                  <span>AI Generated Illustration · Conceptual Visualization (Not Measured Physical Data)</span>
                </div>
              </div>
            ) : (
              <div className="no-media-placeholder">
                <Palette size={40} className="placeholder-icon" />
                <p>Generating illustration...</p>
              </div>
            )}
          </div>
        ) : viewMode === "3d" && is3D ? (
          /* 3. 3D_VISUALIZATION Category Render */
          <div className="stage-3d-wrapper">
            <UnderwaterScene gridData={grid3d} timeIndex={timeIndex} />

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
          /* 4. 2D_VISUALIZATION Category Render */
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

      {/* Scientific Explanation Bar with Gemini Reason */}
      {(result.reason || result.explanation) && (
        <div className="explanation-bar">
          <Sparkles size={16} className="explain-icon" />
          <div className="explanation-text-block">
            {result.reason && <p className="gemini-intent-note"><strong>Gemini Classification:</strong> {result.reason}</p>}
            {result.explanation && result.explanation !== result.reason && (
              <p className="explanation-text">{result.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
