"""
history_service.py
------------------
SQLite-backed query history persistence for GYANI.
Zero extra dependencies — uses Python stdlib sqlite3.

Schema (table: query_history):
  query_id          TEXT  PRIMARY KEY
  timestamp         TEXT  (ISO-8601 UTC)
  session_id        TEXT
  user_query        TEXT
  text_response     TEXT  (Markdown)
  visualization_type TEXT
  primary_modality  TEXT  (text|image|3d|chart)
  modality_reasoning TEXT
  media_url         TEXT  (relative /outputs/... URL or NULL)
  intent_json       TEXT  (JSON dump of VisualizationIntent)
  metadata_json     TEXT  (JSON dump of response metadata)
"""

from __future__ import annotations

import json
import logging
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Database lives beside the backend data directory
_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "gyani_history.db"


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

def _connect() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
# Schema initialisation  (called once at app startup via init_db())
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create the history table if it does not already exist."""
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS query_history (
                query_id            TEXT    PRIMARY KEY,
                timestamp           TEXT    NOT NULL,
                session_id          TEXT,
                user_query          TEXT    NOT NULL,
                text_response       TEXT,
                visualization_type  TEXT,
                primary_modality    TEXT,
                modality_reasoning  TEXT,
                media_url           TEXT,
                intent_json         TEXT,
                metadata_json       TEXT
            )
            """
        )
        conn.commit()
    logger.info("History DB initialised at %s", _DB_PATH)


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

def save_record(
    *,
    session_id: str | None = None,
    user_query: str,
    text_response: str | None = None,
    visualization_type: str | None = None,
    primary_modality: str | None = "text",
    modality_reasoning: str | None = None,
    media_url: str | None = None,
    intent: dict[str, Any] | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    """
    Persist a query record and return its *query_id*.
    Never raises — logs errors silently so the API response is not blocked.
    """
    query_id = uuid.uuid4().hex
    timestamp = datetime.now(timezone.utc).isoformat()

    try:
        with _connect() as conn:
            conn.execute(
                """
                INSERT INTO query_history
                    (query_id, timestamp, session_id, user_query,
                     text_response, visualization_type, primary_modality,
                     modality_reasoning, media_url, intent_json, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    query_id,
                    timestamp,
                    session_id,
                    user_query,
                    text_response,
                    visualization_type,
                    primary_modality,
                    modality_reasoning,
                    media_url,
                    json.dumps(intent) if intent else None,
                    json.dumps(metadata) if metadata else None,
                ),
            )
            conn.commit()
        logger.debug("History record saved: %s", query_id)
    except Exception as exc:
        logger.error("Failed to save history record: %s", exc)

    return query_id


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    for key in ("intent_json", "metadata_json"):
        raw = d.pop(key, None)
        plain_key = key.replace("_json", "")
        try:
            d[plain_key] = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            d[plain_key] = None
    return d


def fetch_all(
    session_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """
    Return history records, newest first.
    Optionally filtered by *session_id*.
    """
    try:
        with _connect() as conn:
            if session_id:
                cursor = conn.execute(
                    """
                    SELECT * FROM query_history
                    WHERE session_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ? OFFSET ?
                    """,
                    (session_id, limit, offset),
                )
            else:
                cursor = conn.execute(
                    """
                    SELECT * FROM query_history
                    ORDER BY timestamp DESC
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
            return [_row_to_dict(r) for r in cursor.fetchall()]
    except Exception as exc:
        logger.error("fetch_all failed: %s", exc)
        return []


def fetch_by_id(query_id: str) -> dict[str, Any] | None:
    """Return a single history record by its *query_id*, or None if not found."""
    try:
        with _connect() as conn:
            cursor = conn.execute(
                "SELECT * FROM query_history WHERE query_id = ?",
                (query_id,),
            )
            row = cursor.fetchone()
            return _row_to_dict(row) if row else None
    except Exception as exc:
        logger.error("fetch_by_id failed: %s", exc)
        return None


def delete_record(query_id: str) -> bool:
    """Delete a single record. Returns True on success."""
    try:
        with _connect() as conn:
            conn.execute(
                "DELETE FROM query_history WHERE query_id = ?",
                (query_id,),
            )
            conn.commit()
        return True
    except Exception as exc:
        logger.error("delete_record failed: %s", exc)
        return False


def clear_session(session_id: str) -> int:
    """Delete all records for *session_id*. Returns the count deleted."""
    try:
        with _connect() as conn:
            cursor = conn.execute(
                "DELETE FROM query_history WHERE session_id = ?",
                (session_id,),
            )
            conn.commit()
            return cursor.rowcount
    except Exception as exc:
        logger.error("clear_session failed: %s", exc)
        return 0
