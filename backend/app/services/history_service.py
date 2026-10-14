import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).resolve().parents[2]
HISTORY_FILE = BASE_DIR / "outputs" / "query_history.json"
MAX_HISTORY_ITEMS = 50


def load_history() -> List[Dict[str, Any]]:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"[GYANI History Error] Failed to read {HISTORY_FILE}: {e}")
    return []


def save_history(history: List[Dict[str, Any]]) -> None:
    try:
        HISTORY_FILE.parent.mkdir(exist_ok=True)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[GYANI History Error] Failed to write {HISTORY_FILE}: {e}")


def add_history_entry(
    query: str,
    category: str,
    reason: Optional[str] = None,
    parameters: Optional[Dict[str, Any]] = None,
    result: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    history = load_history()

    # Create lightweight preview representation for fast history reloading
    entry = {
        "id": uuid.uuid4().hex[:10],
        "query": query,
        "category": category,
        "reason": reason or "",
        "parameters": parameters or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "result": result or {},
    }

    # Prepend new entry and truncate to maximum limit
    history.insert(0, entry)
    history = history[:MAX_HISTORY_ITEMS]
    save_history(history)
    return entry


def clear_history() -> bool:
    try:
        save_history([])
        return True
    except Exception:
        return False
