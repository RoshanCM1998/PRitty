# Markdown Preview (Side-by-Side)

**Feature #11** | **Setting:** `sideBySidePreview` (default: `true`)

Shows the markdown textarea and rendered preview simultaneously in PR comment forms on the **Files Changed tab**, instead of GitHub's default toggle between Write/Preview tabs. Layout is stacked vertically — textarea on top, preview below.

---

## How It Works

GitHub's Files Changed tab uses React-based comment forms with a `MarkdownEditor-module__container` wrapper. When the user switches to the Preview tab, GitHub adds a CSS-module class containing `displayNone` to the textarea's parent `<span>` (which has a class containing `MarkdownInput-module__textArea`). The textarea element stays in the DOM but becomes hidden.

PRitty:
1. Detects unprocessed editor containers via `PRitty.Selectors.MD_EDITOR_REACT`
2. Clicks the Preview tab button to activate live rendering
3. After React finishes DOM updates (`requestAnimationFrame`), removes the `displayNone` class from the textarea span
4. Adds a `pritty-side-by-side-preview` class for CSS layout
5. Focuses the textarea so the user can start typing immediately
6. Sets up a per-container `MutationObserver` to re-remove `displayNone` if GitHub re-adds it (e.g., when user clicks Write/Preview tabs)

---

## Code

| File | Purpose |
|------|---------|
| `src/modules/PR/File Changes/markdown-preview.js` | Module: container detection, Preview click, class removal, observer |
| `styles/base.css` | CSS: `.pritty-side-by-side-preview` layout rules |
| `src/core/namespace.js` | Selectors: `MD_EDITOR_REACT`, `MD_TEXTAREA_SPAN` |
| `src/core/settings.js` | Setting: `sideBySidePreview` default |
| `popup/popup.html` + `popup/popup.js` | Toggle in popup UI |
| `src/content.js` | Integration: calls `enhance()` on init and MutationObserver ticks |

---

## DOM Selectors

| Selector | Matches |
|----------|---------|
| `[class*="MarkdownEditor-module__container"]` | Comment form container (Files Changed tab) |
| `[class*="MarkdownInput-module__textArea"]` | Textarea wrapper span (hidden by `displayNone` class when Preview is active) |

---

## Idempotency

Each container is marked with `data-pritty-preview-enhanced` attribute after processing. The `enhance()` method uses a `:not([data-pritty-preview-enhanced])` selector to skip already-processed forms.

---

## CSS

```css
.pritty-side-by-side-preview [class*="MarkdownInput-module__textArea"] {
  display: block !important;  /* Override displayNone */
}

.pritty-side-by-side-preview [class*="MarkdownInput-module__textArea"] textarea {
  min-height: 120px;
  border-bottom: 1px solid var(--borderColor-muted, #d0d7de);
}
```

---

## Integration Points in content.js

- **`init()`** (~line 46): `PRitty.MarkdownPreview.enhance()` if `sideBySidePreview` is enabled
- **MutationObserver callback** (~line 101): Same call, catches newly rendered comment forms from SPA navigation and inline comment expansion
