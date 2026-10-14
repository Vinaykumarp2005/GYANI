import React, { useState, useEffect } from "react";
import UnderwaterScene from "../ThreeD/UnderwaterScene";
import TimelineControls from "../ThreeD/TimelineControls";
import ScientificLegend from "../Common/ScientificLegend";
import MarkdownRenderer from "./MarkdownRenderer";
import ImageViewer from "./ImageViewer";
import ChartViewer from "./ChartViewer";
import {
  Box,
  Image as ImageIcon,
  Compass,
  Sparkles,
  FileText,
  BarChart2,
  Wand2,
  Layers,
  ArrowRight,
} from "lucide-react";

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
  onRequestGenerateImage,
  isGeneratingImage = false,
  onRequestAnswer,
  isGeneratingAnswer = false,
}) {
  if (!result) return null;

  const is3D = Boolean(result.is_3d && result.grid_3d);
  const has2DMedia = Boolean(result.visualization?.url);
  const hasTextAnswer = Boolean(result.text_answer || result.text);
  const hasImageData = Boolean(result.image_data?.url || result.image_data?.base64);
  const hasChartData = Boolean(result.chart_data);

  // Intent classification info
  const primaryModality = result.primary_modality || result.intent?.primary_modality;
  const secondaryOptions = result.secondary_options || result.intent?.secondary_options || [];
  const modalityReasoning = result.modality_reasoning || result.intent?.modality_reasoning;

  // Determine initial view mode based on primary modality and available data
  const determineInitialMode = () => {
    if (primaryModality === "image" && hasImageData) return "image";
    if (primaryModality === "text" && hasTextAnswer) return "text";
    if (primaryModality === "chart" && hasChartData) return "chart";
    if (is3D) return "3d";
    if (has2DMedia) return "2d";
    if (hasTextAnswer) return "text";
    if (hasImageData) return "image";
    return is3D ? "3d" : "2d";
  };

  const [viewMode, setViewMode] = useState(determineInitialMode);

  // Sync mode if result changes to a distinct primary modality
  useEffect(() => {
    if (result) {
      if (primaryModality === "image" && hasImageData) {
        setViewMode("image");
      } else if (primaryModality === "text" && hasTextAnswer) {
        setViewMode("text");
      } else if (primaryModality === "chart" && hasChartData) {
        setViewMode("chart");
      } else if (is3D) {
        setViewMode("3d");
      } else if (has2DMedia) {
        setViewMode("2d");
      }
    }
  }, [result?.query_id, result?.intent?.visualization, primaryModality]);

  const media = result.visualization;
  const grid3d = result.grid_3d;
  const times = grid3d?.coordinates?.times || [];
  const bounds = grid3d?.value_bounds || { min: 12, max: 30 };

  const handleGenerateImageClick = () => {
    if (onRequestGenerateImage) {
      setViewMode("image");
      onRequestGenerateImage();
    }
  };

  const handleGenerateAnswerClick = () => {
    if (onRequestAnswer) {
      setViewMode("text");
      onRequestAnswer();
    }
  };

  return (
    <div className="visualization-viewport-card">
      {/* 1. Header with Metadata, Title, and Multimodal Tabs */}
      <div className="viewport-header">
        <div className="viewport-title-block">
          <div className="viewport-eyebrow-row">
            <span className="viewport-eyebrow">
              {result.category === "conceptual" ? "CONCEPTUAL MECHANISM" : "OCEANOGRAPHIC DATA"}
            </span>
            {primaryModality && (
              <span className={`modality-primary-tag mod-${primaryModality}`}>
                Primary: {primaryModality.toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="viewport-title">
            {result.intent?.visualization?.replace(/_/g, " ").toUpperCase() ||
              (primaryModality ? `${primaryModality.toUpperCase()} ANALYSIS` : "VISUALIZATION")}
          </h2>
        </div>

        {/* Multimodal Switcher Tabs */}
        <div className="viewport-mode-controls">
          <div className="mode-toggle-group">
            {is3D && (
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`mode-btn ${viewMode === "3d" ? "active" : ""}`}
                title="Interactive 3D Depth Layers"
              >
                <Box size={14} />
                <span>3D Layers</span>
              </button>
            )}

            {has2DMedia && (
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                className={`mode-btn ${viewMode === "2d" ? "active" : ""}`}
                title="2D Scientific Visualisation"
              >
                <ImageIcon size={14} />
                <span>2D Overview</span>
              </button>
            )}

            {/* AI Scientific Synthesis (Markdown) */}
            <button
              type="button"
              onClick={() => {
                setViewMode("text");
                if (!hasTextAnswer && onRequestAnswer) {
                  onRequestAnswer();
                }
              }}
              className={`mode-btn ${viewMode === "text" ? "active" : ""}`}
              title="AI Scientific Synthesis & Detailed Explanation"
            >
              <FileText size={14} />
              <span>AI Synthesis</span>
              {hasTextAnswer && <span className="tab-dot" />}
            </button>

            {/* AI Generated Imagery */}
            <button
              type="button"
              onClick={() => {
                if (!hasImageData && onRequestGenerateImage) {
                  handleGenerateImageClick();
                } else {
                  setViewMode("image");
                }
              }}
              className={`mode-btn ${viewMode === "image" ? "active" : ""}`}
              title="AI Generated Ocean Imagery"
            >
              <Wand2 size={14} />
              <span>AI Imagery</span>
              {hasImageData && <span className="tab-dot" />}
            </button>

            {/* Scientific Chart (if chart data exists or primary modality is chart) */}
            {(hasChartData || primaryModality === "chart") && (
              <button
                type="button"
                onClick={() => setViewMode("chart")}
                className={`mode-btn ${viewMode === "chart" ? "active" : ""}`}
                title="Scientific Data Chart"
              >
                <BarChart2 size={14} />
                <span>Chart</span>
              </button>
            )}
          </div>

          <span className={`category-tag ${result.category || "data"}`}>
            {result.category === "conceptual" ? "CONCEPTUAL SCHEMATIC" : "DATA-DERIVED"}
          </span>
        </div>
      </div>

      {/* 2. Reasoning Banner if LLM classified routing */}
      {modalityReasoning && (
        <div className="modality-reasoning-banner">
          <Sparkles size={14} className="reasoning-icon" />
          <div className="reasoning-text">
            <strong>AI Visualization Router:</strong> {modalityReasoning}
          </div>
          {secondaryOptions.length > 0 && (
            <div className="secondary-options-list">
              <span className="secondary-label">Alternative views:</span>
              {secondaryOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (opt === "3d" && is3D) setViewMode("3d");
                    else if (opt === "2d" && has2DMedia) setViewMode("2d");
                    else if (opt === "text") {
                      if (!hasTextAnswer && onRequestAnswer) onRequestAnswer();
                      setViewMode("text");
                    } else if (opt === "image") {
                      if (!hasImageData && onRequestGenerateImage) onRequestGenerateImage();
                      setViewMode("image");
                    } else if (opt === "chart") setViewMode("chart");
                  }}
                  className="secondary-opt-pill"
                >
                  {opt.toUpperCase()} <ArrowRight size={10} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Main Stage Content */}
      <div className="viewport-stage">
        {/* VIEW: 3D Scene */}
        {viewMode === "3d" && is3D && (
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
        )}

        {/* VIEW: 2D Media (Video or PNG) */}
        {viewMode === "2d" && (
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

        {/* VIEW: AI Text Synthesis */}
        {viewMode === "text" && (
          <div className="stage-text-wrapper">
            {isGeneratingAnswer ? (
              <div className="synthesis-loading-box">
                <div className="skeleton-shimmer" />
                <div className="skeleton-caption">
                  <Sparkles size={16} className="spin-slow" />
                  <span>Synthesizing comprehensive scientific response with Gemini…</span>
                </div>
              </div>
            ) : (
              <MarkdownRenderer
                text={
                  result.text_answer ||
                  result.text ||
                  result.explanation ||
                  "No detailed scientific synthesis available for this query yet."
                }
                content={
                  result.text_answer ||
                  result.text ||
                  result.explanation ||
                  "No detailed scientific synthesis available for this query yet."
                }
                title="Scientific Analysis & Conceptual Breakdown"
              />
            )}
          </div>
        )}

        {/* VIEW: AI Generated Imagery */}
        {viewMode === "image" && (
          <div className="stage-image-wrapper">
            <ImageViewer
              imageData={result.image_data}
              apiBase={apiBase}
              isLoading={isGeneratingImage}
              fallbackText={
                result.explanation ||
                "Configure your Gemini API key in backend/.env to generate high-resolution oceanographic imagery."
              }
            />

            {!hasImageData && !isGeneratingImage && onRequestGenerateImage && (
              <div className="image-action-bar">
                <button
                  type="button"
                  onClick={handleGenerateImageClick}
                  className="generate-image-trigger-btn"
                >
                  <Wand2 size={16} />
                  <span>Generate Conceptual AI Illustration for this Query</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW: Scientific Chart */}
        {viewMode === "chart" && (
          <div className="stage-chart-wrapper">
            <ChartViewer
              chartData={result.chart_data}
              fallbackText={
                result.explanation ||
                "Numerical chart data is currently synthesized or displayed in 2D overview."
              }
            />
          </div>
        )}
      </div>

      {/* 4. Scientific Explanation Footer Bar */}
      {result.explanation && viewMode !== "text" && (
        <div className="explanation-bar">
          <Sparkles size={16} className="explain-icon" />
          <div className="explanation-content">
            <p className="explanation-text">{result.explanation}</p>
          </div>
          {!hasTextAnswer && onRequestAnswer && (
            <button
              type="button"
              className="expand-answer-btn"
              onClick={handleGenerateAnswerClick}
              title="Expand with Gemini AI"
            >
              <span>Detailed AI Synthesis</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
