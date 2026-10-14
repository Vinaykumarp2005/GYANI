/**
 * ImageViewer.jsx
 * ---------------
 * Premium lightbox/card component for AI-generated images.
 * Features: zoom overlay, download, prompt display, loading skeleton,
 * and graceful fallback for failed generation.
 */

import React, { useState } from "react";
import {
  Download,
  ZoomIn,
  ZoomOut,
  X,
  ImageOff,
  Sparkles,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ImageSkeleton() {
  return (
    <div className="img-viewer-skeleton">
      <div className="skeleton-shimmer" />
      <div className="skeleton-caption">
        <Sparkles size={16} className="skeleton-icon spin-slow" />
        <span>Generating scientific visualization with AI…</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error / fallback state
// ---------------------------------------------------------------------------
function ImageError({ error, refinedPrompt, fallbackText }) {
  return (
    <div className="img-viewer-error">
      <ImageOff size={40} className="img-error-icon" />
      <h4 className="img-error-title">Image Generation Unavailable</h4>
      <p className="img-error-message">
        {error || "Unable to generate image. Please check your API configuration."}
      </p>
      {fallbackText && (
        <div className="img-error-fallback">
          <Info size={14} />
          <span>{fallbackText}</span>
        </div>
      )}
      {refinedPrompt && (
        <details className="img-error-prompt">
          <summary>Refined prompt</summary>
          <p>{refinedPrompt}</p>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fullscreen lightbox overlay
// ---------------------------------------------------------------------------
function LightboxOverlay({ src, alt, onClose }) {
  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
    >
      <button
        className="lightbox-close-btn"
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ImageViewer
// ---------------------------------------------------------------------------
export default function ImageViewer({
  imageData,         // { url, base64, mime_type, refined_prompt, error, fallback }
  apiBase = "http://localhost:8000",
  isLoading = false,
  fallbackText = null,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (isLoading) return <ImageSkeleton />;

  if (!imageData || (!imageData.url && !imageData.base64)) {
    return (
      <ImageError
        error={imageData?.error}
        refinedPrompt={imageData?.refined_prompt}
        fallbackText={fallbackText}
      />
    );
  }

  const imgSrc = imageData.url
    ? `${apiBase}${imageData.url}`
    : `data:${imageData.mime_type || "image/png"};base64,${imageData.base64}`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = `gyani-generated-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="img-viewer-card">
      {/* Prompt badge */}
      {imageData.refined_prompt && (
        <div className="img-prompt-badge">
          <Sparkles size={13} />
          <span className="img-prompt-text" title={imageData.refined_prompt}>
            {imageData.refined_prompt.length > 120
              ? imageData.refined_prompt.slice(0, 120) + "…"
              : imageData.refined_prompt}
          </span>
        </div>
      )}

      {/* Image stage */}
      <div className="img-stage">
        <img
          src={imgSrc}
          alt="AI-generated ocean science visualization"
          className="img-viewer-image"
          loading="lazy"
        />

        {/* Hover overlay controls */}
        <div className="img-hover-controls">
          <button
            type="button"
            className="img-ctrl-btn"
            onClick={() => setLightboxOpen(true)}
            title="View full size"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            className="img-ctrl-btn"
            onClick={handleDownload}
            title="Download image"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Caption row */}
      <div className="img-caption-row">
        <span className="img-caption-label">
          <Sparkles size={12} /> {imageData.model ? `${imageData.model.replace('@cf/black-forest-labs/', '').replace('cloudflare-', 'Cloudflare ')}` : "AI-Generated Image"}
        </span>
        <div className="img-action-group">
          <button
            type="button"
            className="img-action-btn"
            onClick={() => setLightboxOpen(true)}
          >
            <ZoomIn size={13} /> Expand
          </button>
          <button
            type="button"
            className="img-action-btn img-action-btn--download"
            onClick={handleDownload}
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>

      {/* Fallback indicator */}
      {imageData.fallback && (
        <div className="img-fallback-notice">
          <Info size={13} />
          <span>Scientific conceptual schematic mode. Cloudflare Workers AI or Gemini API key can be configured in backend/.env.</span>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <LightboxOverlay
          src={imgSrc}
          alt="AI-generated ocean visualization — full size"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
