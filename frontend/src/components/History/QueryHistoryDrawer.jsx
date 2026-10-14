import React from "react";
import { History, X, Trash2, ArrowUpRight, BookOpen, ImageIcon, Box, Palette, Clock } from "lucide-react";

export default function QueryHistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) {
  if (!isOpen) return null;

  const categoryIcons = {
    TEXT: BookOpen,
    "2D_VISUALIZATION": ImageIcon,
    "3D_VISUALIZATION": Box,
    IMAGE_GENERATION: Palette,
  };

  const categoryLabels = {
    TEXT: "Text Synthesis",
    "2D_VISUALIZATION": "2D Data Map",
    "3D_VISUALIZATION": "3D Depth Grid",
    IMAGE_GENERATION: "AI Illustration",
  };

  return (
    <div className="history-drawer-backdrop" onClick={onClose}>
      <aside
        className="history-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Query History"
      >
        <div className="history-drawer-header">
          <div className="history-header-title">
            <History size={18} className="history-icon" />
            <h3>Query History & Past Results</h3>
          </div>
          <div className="history-header-actions">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="history-clear-btn"
                title="Clear all stored queries"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="history-close-btn"
              title="Close history"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="history-drawer-body">
          {history.length === 0 ? (
            <div className="history-empty-state">
              <History size={36} className="empty-icon" />
              <h4>No Queries in History Yet</h4>
              <p>Your previous queries, Gemini classifications, and visualizations will be recorded here for instant retrieval.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => {
                const IconComp = categoryIcons[item.category] || History;
                const catLabel = categoryLabels[item.category] || item.category;

                let dateStr = "";
                try {
                  const d = new Date(item.timestamp);
                  dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " · " + d.toLocaleDateString();
                } catch {
                  dateStr = item.timestamp;
                }

                return (
                  <div
                    key={item.id}
                    className="history-card"
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                  >
                    <div className="history-card-top">
                      <span className={`history-category-chip cat-${(item.category || "default").toLowerCase().replace(/_/g, '-')}`}>
                        <IconComp size={11} />
                        <span>{catLabel}</span>
                      </span>
                      <span className="history-timestamp">
                        <Clock size={10} />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <p className="history-query-text">{item.query}</p>

                    {item.reason && (
                      <p className="history-reason-snippet">{item.reason}</p>
                    )}

                    <div className="history-card-footer">
                      <span className="history-restore-link">
                        <span>Reopen Result</span>
                        <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
