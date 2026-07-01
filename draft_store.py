import json
import os
import threading

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DRAFTS_FILE = os.path.join(DATA_DIR, "drafts.json")

_lock = threading.Lock()


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def read_drafts():
    """Read all drafts from data/drafts.json. Returns a list."""
    _ensure_data_dir()
    if not os.path.exists(DRAFTS_FILE):
        return []
    with _lock:
        try:
            with open(DRAFTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                return []
        except (json.JSONDecodeError, IOError):
            return []


def write_drafts(drafts):
    """Overwrite the entire drafts list."""
    _ensure_data_dir()
    with _lock:
        with open(DRAFTS_FILE, "w", encoding="utf-8") as f:
            json.dump(drafts, f, indent=2, ensure_ascii=False)


def update_draft(draft_id, data):
    """
    Update a single draft by id. Merges the provided fields.
    Returns True if the draft was found and updated, False otherwise.
    """
    drafts = read_drafts()
    for i, draft in enumerate(drafts):
        if draft.get("id") == draft_id:
            # Merge: keep existing fields, update with provided ones
            merged = {**draft, **data}
            merged["id"] = draft_id  # Never allow id to change
            drafts[i] = merged
            write_drafts(drafts)
            return True
    return False
