from flask import Flask, request, jsonify, send_from_directory, send_file
from draft_store import read_drafts, write_drafts, update_draft
import os

app = Flask(__name__, static_folder="static", template_folder="templates")

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


@app.route("/")
def index():
    """Serve the main preview page."""
    return send_from_directory("templates", "preview.html")


@app.route("/api/drafts", methods=["GET"])
def get_drafts():
    """Return all drafts as JSON."""
    drafts = read_drafts()
    resp = jsonify(drafts)
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.route("/api/save", methods=["POST"])
def save_draft():
    """Save edits to a single draft."""
    data = request.get_json()
    if not data or "id" not in data:
        return jsonify({"error": "Missing draft id"}), 400

    draft_id = data["id"]
    success = update_draft(draft_id, data)
    if success:
        return jsonify({"status": "ok", "message": f"Draft {draft_id} saved."})
    else:
        return jsonify({"error": f"Draft {draft_id} not found."}), 404


@app.route("/api/save-all", methods=["POST"])
def save_all():
    """Overwrite all drafts."""
    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected a JSON array of drafts."}), 400
    write_drafts(data)
    return jsonify({"status": "ok", "message": "All drafts saved."})


@app.route("/api/image")
def serve_image():
    path = request.args.get("path", "")
    if not path or not os.path.isfile(path):
        return jsonify({"error": "File not found"}), 404
    return send_file(path)


@app.route("/api/regenerate", methods=["POST"])
def regenerate():
    """Regenerate a draft via AI. V1 returns not implemented."""
    data = request.get_json()
    draft_id = data.get("id", "unknown") if data else "unknown"
    return jsonify({
        "status": "not_implemented",
        "message": "Regeneration is not yet available. Please edit the draft manually or re-run the Claude skill.",
        "draft_id": draft_id
    }), 501


@app.route("/static/<path:path>")
def serve_static(path):
    resp = send_from_directory("static", path)
    resp.headers["Cache-Control"] = "no-store"
    return resp


if __name__ == "__main__":
    print("Starting Reddit Home Decor Draft Preview...")
    print("Open http://localhost:5000 in your browser.")
    app.run(debug=True, host="127.0.0.1", port=5000)
