import React from "react";
import { Loader2, Sparkles, Compass, ArrowRight } from "lucide-react";

export default function QueryWorkspace({
  query,
  onQueryChange,
  onSubmit,
  loading,
  examples = [],
  t,
  onSelectExample,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && query.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="query-workspace-card">
      <div className="workspace-header">
        <div className="workspace-title-group">
          <Compass size={20} className="workspace-title-icon" />
          <div>
            <h3 className="workspace-title">{t.question || "Ocean-Science Query"}</h3>
            <p className="workspace-desc">
              Ask natural-language questions in English, Telugu, Hindi, or Tamil.
            </p>
          </div>
        </div>
        <span className="workspace-subtitle-badge">
          AI + INCOIS Numerical NetCDF Engine
        </span>
      </div>

      <div className="query-input-wrapper">
        <textarea
          id="ocean-query-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder || "Ask an oceanographic question or query 3D depth layers (e.g. 'Show 3D temperature profile in Arabian Sea')..."}
          rows={3}
          className="ocean-query-textarea"
        />
        <div className="query-input-actions">
          <span className="query-hint">Press [Enter] to submit query</span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !query.trim()}
            className="generate-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="btn-spinner" />
                <span>{t.generating || "Processing Query..."}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{t.generate || "Generate Visualization"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggested Prompts in Current Selected Language */}
      <div className="suggested-prompts-section">
        <div className="prompts-header">
          <Sparkles size={13} className="sparkle-icon" />
          <span className="prompts-label">{t.try || "Try asking:"}</span>
        </div>
        <div className="prompt-chips-flow">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onSelectExample(ex)}
              className="prompt-chip"
            >
              <span>{ex}</span>
              <ArrowRight size={11} className="chip-arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
