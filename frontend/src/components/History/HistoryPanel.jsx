/**
 * HistoryPanel.jsx
 * ----------------
 * Sidebar drawer showing the user's query history.
 * Features:
 *  - Fetches from GET /api/history (optionally filtered by session_id)
 *  - Modality icons + timestamps per record
 *  - Click to reload a past query/result without hitting the API again
 *  - Delete individual records
 *  - Loading skeletons + empty state
 *  - Auto-refresh when new queries are submitted (via `refreshToken` prop)
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Clock,
  Trash2,
  BarChart2,
  Box,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  History,
  AlertCircle,
} from "lucide-react";

const API = "http://localhost:8000";

// Modality → icon + label mapping
const MODALITY_META = {
  text:    { Icon: FileText, label: "Text", cls: "mod-text" },
  image:   { Icon: ImageIcon, label: "Image", cls: "mod-image" },
  "3d":    { Icon: Box, label: "3D", cls: "mod-3d" },
  chart:   { Icon: BarChart2, label: "Chart", cls: "mod-chart" },
  default: { Icon: FileText, label: "Query", cls: "mod-text" },
};

function getModalityMeta(modality) {
  return MODALITY_META[modality] || MODALITY_META.default;
}

// ---------------------------------------------------------------------------
// Skeleton rows while loading
// ---------------------------------------------------------------------------
function SkeletonRows({ count = 4 }) {
  return (
    <div className="history-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="history-skeleton-row">
          <div className="sk-icon" />
          <div className="sk-lines">
            <div className="sk-line sk-line-long" />
            <div className="sk-line sk-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single history row
// ---------------------------------------------------------------------------
function HistoryRow({ record, onSelect, onDelete }) {
  const { Icon, label, cls } = getModalityMeta(record.primary_modality);
  const ts = record.timestamp
    ? new Date(record.timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className="history-row"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(record)}
    >
      <div className={`history-modality-badge ${cls}`}>
        <Icon size={13} />
        <span>{label}</span>
      </div>

      <div className="history-row-body">
        <p className="history-query-text" title={record.user_query}>
          {record.user_query.length > 80
            ? record.user_query.slice(0, 80) + "…"
            : record.user_query}
        </p>
        <div className="history-row-meta">
          <Clock size={11} />
          <span>{ts}</span>
          {record.visualization_type && (
            <span className="history-viz-type">
              {record.visualization_type.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="history-delete-btn"
        title="Delete record"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(record.query_id);
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main HistoryPanel
// ---------------------------------------------------------------------------
export default function HistoryPanel({
  isOpen,
  onClose,
  sessionId = null,
  onSelectRecord,   // (record) => void – called when user clicks a history row
  refreshToken = 0, // increment from parent to trigger a refresh
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (sessionId) params.set("session_id", sessionId);
      const res = await fetch(`${API}/api/history?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load history.");
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Fetch on open + whenever refreshToken changes
  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, refreshToken, fetchHistory]);

  const handleDelete = async (queryId) => {
    try {
      await fetch(`${API}/api/history/${queryId}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.query_id !== queryId));
    } catch {
      // silent
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="history-backdrop"
        role="presentation"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="history-panel" role="complementary" aria-label="Query history">
        {/* Panel header */}
        <div className="history-panel-header">
          <div className="history-panel-title">
            <History size={18} className="history-title-icon" />
            <span>Query History</span>
            {records.length > 0 && (
              <span className="history-count-badge">{records.length}</span>
            )}
          </div>
          <div className="history-panel-actions">
            <button
              type="button"
              className="history-refresh-btn"
              onClick={fetchHistory}
              title="Refresh history"
            >
              <RefreshCw size={14} className={loading ? "spin-slow" : ""} />
            </button>
            <button
              type="button"
              className="history-close-btn"
              onClick={onClose}
              aria-label="Close history panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Session filter indicator */}
        {sessionId && (
          <div className="history-session-indicator">
            <span>Showing session records only</span>
          </div>
        )}

        {/* Content */}
        <div className="history-panel-body">
          {loading && <SkeletonRows />}

          {!loading && error && (
            <div className="history-error-state">
              <AlertCircle size={20} />
              <p>{error}</p>
              <button type="button" onClick={fetchHistory} className="history-retry-btn">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="history-empty-state">
              <History size={36} className="history-empty-icon" />
              <p className="history-empty-title">No history yet</p>
              <p className="history-empty-sub">
                Your queries will appear here after you submit them.
              </p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="history-list">
              {records.map((record) => (
                <HistoryRow
                  key={record.query_id}
                  record={record}
                  onSelect={(r) => {
                    onSelectRecord?.(r);
                    onClose();
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="history-panel-footer">
          <span>{records.length} record{records.length !== 1 ? "s" : ""}</span>
          {records.length > 0 && (
            <button
              type="button"
              className="history-clear-btn"
              onClick={async () => {
                await Promise.all(records.map((r) => handleDelete(r.query_id)));
              }}
            >
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
