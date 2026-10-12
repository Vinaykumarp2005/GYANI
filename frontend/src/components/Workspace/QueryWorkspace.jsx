import React from "react";
import { Search, Loader2, Sparkles, Filter, Compass } from "lucide-react";

export default function QueryWorkspace({
  query,
  onQueryChange,
  onSubmit,
  loading,
  examples = [],
  t,
  onSelectExample,
}) {
  const quickFilters = [
    { label: "3D Temperature Layers", querySnippet: "Show 3D temperature profile in Arabian Sea June 2025" },
    { label: "SST Animation", querySnippet: "Show SST evolution in the Arabian Sea during June 2025" },
    { label: "Current Pattern", querySnippet: "Show the ocean current pattern during June 2025" },
    { label: "Depth-Time Profile", querySnippet: "How did temperature change with depth at 10 N 75 E during June 2025?" },
    { label: "Coastal Upwelling (Concept)", querySnippet: "What is coastal upwelling?" },
  ];

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
          <Compass size={18} className="workspace-title-icon" />
          <h2 className="workspace-title">{t.question || "Ocean-Science Query"}</h2>
        </div>
        <span className="workspace-subtitle-badge">
          Natural Language to Ocean Analytics
        </span>
      </div>

      <div className="query-input-wrapper">
        <textarea
          id="ocean-query-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder || "Ask an ocean-science question or explore 3D depth layers..."}
          rows={3}
          className="ocean-query-textarea"
        />
        <div className="query-input-actions">
          <span className="query-hint">Press Enter to submit</span>
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

      {/* Suggested Prompts in Current Language */}
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
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
