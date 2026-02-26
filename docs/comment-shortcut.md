# Comment Shortcut

Removes GitHub's **"Start a review"** button from inline diff comment forms and makes **Ctrl+Enter** post a direct comment immediately.

---

## What It Does

GitHub's inline diff comment forms have three submit buttons:

| Button | Behaviour |
|--------|-----------|
| **Start a review** | Adds the comment to a pending review (requires a separate publish step) |
| **Add single comment** | Posts the comment immediately — no pending review |
| **Reply** | Posts an immediate reply in a comment thread |

By default, GitHub's Ctrl+Enter fires "Start a review". This module:

1. **Removes the "Start a review" button** from the DOM every time GitHub renders an inline form.
2. **Intercepts Ctrl+Enter** (capture phase, before GitHub's own handler) and clicks the appropriate direct-comment button instead.

---

## Toggle

Controlled by the `commentShortcut` setting (default: **on**).

Toggle in the PRitty popup (toolbar icon → "Direct comment shortcut").

---

## Files

| File | Role |
|------|------|
| `src/modules/PR/comment-shortcut.js` | Module logic |
| `src/core/settings.js` | Reads `commentShortcut` setting from `chrome.storage.sync` |
| `popup/popup.html` | Toggle UI |
| `popup/popup.js` | Reads/writes setting |
| `popup/popup.css` | Popup styling |

---

## DOM Targets

| Target | Purpose |
|--------|---------|
| `button[type="submit"]` (text = `"Start a review"`) | Removed on every MutationObserver tick |
| `button[type="submit"]` (text = `"Reply"`) | Ctrl+Enter target — reply threads |
| `button[type="submit"]` (text = `"Add single comment"`) | Ctrl+Enter target — new inline comments |
| `button[type="submit"]` (text = `"Comment"`) | Ctrl+Enter target — main PR comment box |

---

## Integration

- `PRitty.CommentShortcut.init()` is called **once** in `content.js → init()` (guarded by `_initialized`). Sets up the document-level `keydown` listener.
- `PRitty.CommentShortcut.removeStartReviewButtons()` is called inside the `MutationObserver` in `content.js` on every DOM tick, so inline forms are cleaned up as soon as GitHub renders them.
- Both calls are wrapped in `if (PRitty.Settings.get('commentShortcut'))` so they only run when the toggle is on.

---

## Ctrl+Enter Interception

The `keydown` listener is registered with `capture: true` on `document`, so it fires **before** GitHub's bubble-phase handlers. When a matching button is found, `e.preventDefault()` and `e.stopImmediatePropagation()` prevent GitHub's native handler from running.

Button priority order inside a form:
1. `"Reply"` — reply thread forms
2. `"Add single comment"` — new inline diff comment forms
3. `"Comment"` — main PR conversation comment box

If none are found (or all disabled), the event propagates normally.
