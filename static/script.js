// ===== State =====
let drafts = [];
let lastDraftsJson = "";

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  loadDrafts();
  setInterval(pollDrafts, 3000);
  document.getElementById("copy-all-btn").addEventListener("click", copyAllDrafts);

  const lightbox = document.getElementById("lightbox");
  lightbox.addEventListener("click", () => lightbox.classList.remove("active"));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") lightbox.classList.remove("active");
  });
});

// ===== API Helpers =====
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ===== Load & Render =====
async function loadDrafts() {
  const container = document.getElementById("drafts-container");
  try {
    drafts = await apiGet("/api/drafts");
    lastDraftsJson = JSON.stringify(drafts);
    if (!drafts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No drafts yet.</p>
          <p class="hint">Use the Claude skill to generate Reddit post drafts, then they will appear here.</p>
        </div>`;
      document.getElementById("copy-all-btn").disabled = true;
      return;
    }
    document.getElementById("copy-all-btn").disabled = false;
    renderDrafts();
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Failed to load drafts.</p><p class="hint">${escapeHtml(err.message)}</p></div>`;
  }
}

async function pollDrafts() {
  try {
    const fresh = await apiGet("/api/drafts?t=" + Date.now());
    const freshJson = JSON.stringify(fresh);
    if (freshJson !== lastDraftsJson) {
      drafts = fresh;
      lastDraftsJson = freshJson;
      const empty = !drafts.length;
      document.getElementById("copy-all-btn").disabled = empty;
      if (empty) {
        document.getElementById("drafts-container").innerHTML = `
          <div class="empty-state">
            <p>No drafts yet.</p>
            <p class="hint">Use the Claude skill to generate Reddit post drafts, then they will appear here.</p>
          </div>`;
      } else {
        renderDrafts();
      }
    }
  } catch (_) {}
}

function renderDrafts() {
  const container = document.getElementById("drafts-container");
  let html = "";
  drafts.forEach((draft, index) => {
    const altSubs = (draft.alternative_subreddits || []).map(s => `<span class="alt-sub-tag">r/${escapeHtml(s)}<button class="btn btn-sm btn-ghost copy-alt-sub-btn" data-sub="${escapeAttr(s)}">📋 Copy</button></span>`).join("");
    const imagePaths = draft.image_paths || [];
    const imageHtml = imagePaths.length
      ? imagePaths.map(p => `<img class="draft-image" src="/api/image?path=${encodeURIComponent(p)}" alt="draft image">`).join("")
      : `<div class="image-placeholder">📷 No images</div>`;

    const subredditVal = escapeAttr(draft.subreddit || "");
    const titleVal = escapeAttr(draft.title || "");
    const bodyVal = escapeAttr(draft.body || "");

    html += `
    <article class="post-card" data-id="${escapeHtml(draft.id)}">
      <div class="post-card-header">
        <span class="post-card-id">${escapeHtml(draft.id)}</span>
      </div>
      <div class="post-card-body">
        ${imageHtml}
        <div class="field-group">
          <label for="subreddit-${index}">
            Suggested Subreddit
            <button class="btn btn-sm btn-ghost copy-field-btn" data-action="copy-field" data-id="${escapeHtml(draft.id)}" data-field="subreddit">📋 Copy</button>
          </label>
          <input type="text" id="subreddit-${index}" value="${escapeHtml(draft.subreddit || '')}" data-field="subreddit" data-id="${escapeHtml(draft.id)}">
        </div>
        <div class="field-group">
          <label for="title-${index}">
            Title
            <button class="btn btn-sm btn-ghost copy-field-btn" data-action="copy-field" data-id="${escapeHtml(draft.id)}" data-field="title">📋 Copy</button>
          </label>
          <input type="text" id="title-${index}" value="${escapeHtml(draft.title || '')}" data-field="title" data-id="${escapeHtml(draft.id)}">
        </div>
        <div class="field-group">
          <label for="body-${index}">
            Body
            <button class="btn btn-sm btn-ghost copy-field-btn" data-action="copy-field" data-id="${escapeHtml(draft.id)}" data-field="body">📋 Copy</button>
          </label>
          <textarea id="body-${index}" data-field="body" data-id="${escapeHtml(draft.id)}">${escapeHtml(draft.body || '')}</textarea>
        </div>
        ${altSubs ? `<div class="alt-subs">${altSubs}</div>` : ''}
        ${draft.notes ? `
        <div class="notes-section">
          <span class="notes-toggle" data-id="${escapeHtml(draft.id)}">▶ AI Notes</span>
          <div class="notes-content" id="notes-${index}">${escapeHtml(draft.notes)}</div>
        </div>` : ''}
      </div>
    </article>`;
  });
  container.innerHTML = html;
  attachCardListeners();
}

function attachCardListeners() {
  // Notes toggle
  document.querySelectorAll(".notes-toggle").forEach(el => {
    el.addEventListener("click", () => {
      const content = el.nextElementSibling;
      const open = content.classList.toggle("open");
      el.textContent = open ? "▼ AI Notes" : "▶ AI Notes";
    });
  });

  // Copy field buttons
  document.querySelectorAll("[data-action='copy-field']").forEach(btn => {
    btn.addEventListener("click", () => copyField(btn.dataset.id, btn.dataset.field));
  });

  // Image lightbox
  document.querySelectorAll(".draft-image").forEach(img => {
    img.addEventListener("click", () => {
      const lb = document.getElementById("lightbox");
      document.getElementById("lightbox-img").src = img.src;
      lb.classList.add("active");
    });
  });

  // Copy alt subreddit buttons
  document.querySelectorAll(".copy-alt-sub-btn").forEach(btn => {
    btn.addEventListener("click", () => copyToClipboard("r/" + btn.dataset.sub, "Subreddit copied!"));
  });

}

// ===== Field Reading =====
function getDraftDataFromForm(draftId) {
  const subEl = document.querySelector(`input[data-field="subreddit"][data-id="${draftId}"]`);
  const titleEl = document.querySelector(`input[data-field="title"][data-id="${draftId}"]`);
  const bodyEl = document.querySelector(`textarea[data-field="body"][data-id="${draftId}"]`);
  return {
    id: draftId,
    subreddit: subEl ? subEl.value : "",
    title: titleEl ? titleEl.value : "",
    body: bodyEl ? bodyEl.value : "",
  };
}

// ===== Save =====
async function saveDraft(draftId) {
  const data = getDraftDataFromForm(draftId);
  try {
    await apiPost("/api/save", data);
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      draft.subreddit = data.subreddit;
      draft.title = data.title;
      draft.body = data.body;
    }
    showToast("Draft saved.", "success");
  } catch (err) {
    showToast(`Save failed: ${err.message}`, "error");
  }
}

// ===== Copy to Clipboard =====
function copyField(draftId, field) {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;

  let text = "";
  let label = "";
  if (field === "subreddit") {
    text = "r/" + (draft.subreddit || "").replace(/^r\//, "");
    label = "Subreddit";
  } else if (field === "title") {
    text = draft.title || "";
    label = "Title";
  } else if (field === "body") {
    text = draft.body || "";
    label = "Body";
  }

  copyToClipboard(text, `${label} copied!`);
}

function copyPost(draftId) {
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;

  const sub = "r/" + (draft.subreddit || "HomeDecorating").replace(/^r\//, "");
  const title = draft.title || "";
  const body = draft.body || "";

  const text = `**Posted to:** ${sub}

${title}

---

${body}`;

  copyToClipboard(text, "Full post copied!");
}

function copyAllDrafts() {
  if (!drafts.length) return;

  let text = "";
  drafts.forEach((draft, i) => {
    const sub = "r/" + (draft.subreddit || "HomeDecorating").replace(/^r\//, "");
    const title = draft.title || "";
    const body = draft.body || "";

    text += `────────── Post ${i + 1} ──────────\n`;
    text += `Subreddit: ${sub}\n`;
    text += `Title: ${title}\n\n`;
    text += `${body}\n\n`;
  });

  copyToClipboard(text, `Copied ${drafts.length} draft(s)!`);
}

async function copyToClipboard(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, "success");

    // Briefly highlight the copied card
    // Find the card that was last interacted with
  } catch (err) {
    // Fallback for older browsers or non-HTTPS
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast(successMsg, "success");
    } catch (e) {
      showToast("Copy failed. Please select and copy manually.", "error");
    }
    document.body.removeChild(textarea);
  }
}

// ===== Toast =====
let toastTimer = null;
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
    toastTimer = null;
  }, 2500);
}

// ===== Utils =====
function escapeHtml(text) {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, c => map[c]);
}

function escapeAttr(text) {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
