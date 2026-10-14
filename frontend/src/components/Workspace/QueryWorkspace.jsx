import React from "react";
import { Loader2, Sparkles, Compass, ArrowRight, History } from "lucide-react";

export default function QueryWorkspace({
  query,
  onQueryChange,
  onSubmit,
  loading,
  examples = [],
  t,
  onSelectExample,
  onOpenHistory,
  historyCount = 0,
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
              Ask natural-language questions in English, Telugu, Hindi, or Tamil. Powered by Gemini.
            </p>
          </div>
        </div>

        <div className="workspace-header-right">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="workspace-history-btn"
              title="View past queries and results"
            >
              <History size={14} />
              <span>History</span>
              {historyCount > 0 && <span className="history-count-badge">{historyCount}</span>}
            </button>
          )}

          <span className="workspace-subtitle-badge">
            Gemini AI + INCOIS Numerical Engine
          </span>
        </div>
      </div>

      <div className="query-input-wrapper">
        <textarea
          id="ocean-query-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder || "Ask an oceanographic question, request a 2D/3D visualization, or generate an illustration..."}
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
                <span>{t.generate || "Submit Query"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggested Prompts with Category Classification Tags */}
      <div className="suggested-prompts-section">
        <div className="prompts-header">
          <Sparkles size={13} className="sparkle-icon" />
          <span className="prompts-label">{t.try || "Try asking (categorized prompts):"}</span>
        </div>
        <div className="prompt-chips-flow">
          {examples.map((ex) => {
            const isText = ex.toLowerCase().includes("what is") || ex.toLowerCase().includes("explain");
            const is3D = ex.toLowerCase().includes("3d") || ex.toLowerCase().includes("depth");
            const isImage = ex.toLowerCase().includes("illustration") || ex.toLowerCase().includes("draw");
            const catTag = isText ? "TEXT" : isImage ? "IMAGE" : is3D ? "3D" : "2D";

            return (
              <button
                key={ex}
                type="button"
                onClick={() => onSelectExample(ex)}
                className="prompt-chip"
              >
                <span className={`chip-category-tag tag-${catTag.toLowerCase()}`}>{catTag}</span>
                <span>{ex}</span>
                <ArrowRight size={11} className="chip-arrow" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
