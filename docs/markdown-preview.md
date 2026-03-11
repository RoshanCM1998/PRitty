# Markdown Preview (Quick Preview)

**Feature #11** | **Setting:** `quickPreview` (default: `true`)

Shows the markdown textarea and a live-rendered preview simultaneously in PR comment forms on both the **Conversation** and **Files Changed** tabs. Layout is stacked vertically — textarea on top, preview below.

---

## How It Works

Uses **marked.js** (~40 KB) for local markdown rendering. No GitHub API calls, no Write/Preview tab cycling, no fighting React.

1. Detects unprocessed editor containers via two selectors: `PRitty.Selectors.MD_COMMENT_FORM` (current GitHub `tab-container`) and `PRitty.Selectors.MD_EDITOR_REACT` (legacy React editor)
2. Injects a PRitty-owned `<div class="pritty-local-preview markdown-body">` after the write area
4. Listens to `input` events on the textarea, renders with `marked.parse()` (300ms debounce)
5. Uses GitHub's `markdown-body` class for styling (already loaded on the page)

The textarea is never touched programmatically — no cursor jumping, no character loss.

---

## Code

| File | Purpose |
|------|---------|
| `lib/marked.min.js` | Vendor: marked.js v15 markdown parser (~40 KB) |
| `src/modules/PR/markdown-preview.js` | Module: container detection, preview div injection, input→render |
| `styles/base.css` | CSS: `.pritty-local-preview` styling, flex-wrap override for Files Changed |
| `src/core/namespace.js` | Selectors: `MD_COMMENT_FORM` (Conversation), `MD_EDITOR_REACT` + `MD_TEXTAREA_SPAN` (Files Changed) |
| `src/core/settings.js` | Setting: `quickPreview` default |
| `popup/popup.html` + `popup/popup.js` | Toggle in popup UI |
| `src/content.js` | Integration: calls `enhance()` on init and MutationObserver ticks |

---

## DOM Selectors

| Selector | Tab | Stability | Matches |
|----------|-----|-----------|---------|
| `tab-container.js-previewable-comment-form` | Conversation | Stable (custom element + js- behavior class) | Comment form container (main + inline replies) |
| `file-attachment[role="tabpanel"]` | Conversation | Stable (custom element + ARIA role) | Write panel; preview inserted inside (hides on Preview tab) |
| `[class*="MarkdownEditor-module__container"]` | Files Changed | Moderate (CSS-module hash may change) | Primer React MarkdownEditor container |
| `[class*="MarkdownInput-module__textArea"]` | Files Changed | Moderate (CSS-module hash may change) | Textarea wrapper span; preview inserted inside (gets displayNone on Preview tab) |

---

## Limitations

- GitHub-specific markdown syntax (`@mentions`, `#123` issue links, custom emoji) renders as plain text
- For full GitHub rendering, users can temporarily re-enable the native tabs by disabling the feature in the popup

---

## Idempotency

Each container is marked with `data-pritty-preview-enhanced` attribute after processing. The `enhance()` method uses a `:not([data-pritty-preview-enhanced])` selector to skip already-processed forms.

---

## Integration Points in content.js

- **`init()`** (~line 46): `PRitty.MarkdownPreview.enhance()` if `quickPreview` is enabled
- **MutationObserver callback** (~line 101): Same call, catches newly rendered comment forms from SPA navigation and inline comment expansion
