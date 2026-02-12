# Agent Workflow Guide — DevHub for GitHub

This file defines all conventions, patterns, and mandatory workflows for working on this codebase.

## Pre-Work Checklist (MANDATORY)

Before writing any code, complete these steps in order:

1. **Identify the feature** you're about to modify using this table:

| Feature | Read This Doc First | Code Files |
|---------|-------------------|------------|
| PR Actions button | `docs/action-buttons-bar.md` | `src/features/action-buttons-bar/pr-actions-button.js` |
| Submit Review button | `docs/action-buttons-bar.md` | `src/features/action-buttons-bar/review-button.js` |
| Floating bar assembly | `docs/action-buttons-bar.md` | `src/features/action-buttons-bar/header-actions.js` |
| Scroll to Top | `docs/scroll-to-top.md` | `src/modules/scroll-top.js` |
| Conversation tab | `docs/conversation-tab.md` | `src/modules/timeline-reorder.js`, `styles/base.css` |
| Commits tab | `docs/README.md` (#4) | `styles/base.css` (Commits Tab section) |
| Files Changed tab | `docs/README.md` (#5) | `styles/base.css` (Files Changes Tab section) |
| Namespace / selectors | `docs/core-infrastructure.md` | `src/core/namespace.js` |
| Utils | `docs/core-infrastructure.md` | `src/core/utils.js` |
| Icons | `docs/core-infrastructure.md` | `src/core/icons.js` |
| GitHub state reader | `docs/core-infrastructure.md` | `src/modules/github-state.js` |
| Entry point / lifecycle | `docs/core-infrastructure.md` | `src/content.js` |
| Button styling | `docs/action-buttons-bar.md` | `styles/buttons.css` |
| Layout / tab styling | Relevant feature doc | `styles/base.css` |

2. **Read the doc file** listed above — understand what the feature does, which DOM elements it targets, and how it integrates
3. **Read the actual code files** before making changes
4. **Implement** your changes
5. **Update the doc file** to reflect what you changed

## Post-Work Checklist (MANDATORY)

After completing any code change:

1. **Update the relevant `docs/*.md`** file if you changed:
   - File paths or file names
   - Function signatures or behavior
   - CSS class names or selectors
   - DOM targets or GitHub selectors
   - Dependencies between modules
2. **Update `docs/README.md`** project structure tree if you added/moved/deleted files
3. **Update `manifest.json`** if you added/moved/renamed any JS file
4. **Update this file (`AGENTS.md`)** feature-to-doc mapping table if you added a new feature or doc

---

## Architecture

### Module Pattern

All modules attach to `window.DevHub` namespace. No import/export system — scripts are loaded sequentially by `manifest.json`.

```js
// Every module follows this pattern:
DevHub.ModuleName = {
  create() { /* ... */ },
  _privateMethod() { /* ... */ },
};
```

### File Organization

```
src/core/          → Shared infrastructure (namespace, icons, utils)
src/modules/       → Standalone feature modules (scroll-top, timeline-reorder, github-state)
src/features/      → Feature folders grouping related modules
src/content.js     → Entry point (IIFE, bootstraps everything)
styles/            → Global CSS (base.css for layout, buttons.css for buttons)
```

### Script Load Order

Defined in `manifest.json`. Order matters — each module depends on prior ones:

1. Core: `namespace.js` → `icons.js` → `utils.js`
2. State: `github-state.js`
3. Modules: `pr-actions-button.js` → `review-button.js` → `timeline-reorder.js` → `scroll-top.js`
4. Assembly: `header-actions.js`
5. Bootstrap: `content.js`

When adding new modules, insert them in the correct position in this chain.

### Injected Element Tagging

All DevHub-injected DOM elements are tagged with `data-devhub-injected` attribute. This allows:
- Clean removal during re-injection (`inject()` in content.js)
- Exclusion from button searches (`isDevHubElement()`)

---

## Coding Patterns

### Adding a New Module

```js
// Attach to DevHub namespace — no import/export
DevHub.MyModule = {
  create() {
    const el = document.createElement("div");
    el.setAttribute(DevHub.INJECTED_ATTR, "true"); // tag for cleanup
    // ...
    return el;
  },
};
```

Then add the file path to `manifest.json` in the correct load order position.

### Adding CSS

- Use `devhub-` prefix for all class names
- Add to `styles/base.css` for layout/positioning, or `styles/buttons.css` for button styles
- Use section comments: `/* === Section Name === */`
- Prefer CSS `flex-direction: column-reverse` over JS DOM manipulation for reordering
- Z-index layers: `999` (action bar) > `100` (dropdown) > `99` (scroll button)

### Interacting with GitHub's Native UI

```js
// 1. Find the native button (excludes DevHub's own buttons)
const btn = DevHub.Utils.findButtonByText("Button text");
// or: DevHub.Utils.findButtonByPrefix("Button prefix");

// 2. Scroll into view
btn.scrollIntoView({ behavior: "smooth", block: "center" });

// 3. Click after delay (let scroll complete)
setTimeout(() => btn.click(), 400);
```

### Adding GitHub DOM Selectors

All GitHub-specific selectors are centralized in `src/core/namespace.js` under `DevHub.Selectors`. When GitHub changes their DOM, update selectors there — never hardcode selectors in individual modules.

---

## Rules

- **Do not create unnecessary files.** Edit existing files when possible.
- **Do not add new folders** unless grouping 2+ related modules (like `action-buttons-bar/`).
- **CSS stays in global stylesheets** (`base.css` / `buttons.css`) with section comments — no per-module CSS files.
- **All injected DOM elements** must have `data-devhub-injected` attribute for cleanup.
- **File names should match their UI label** or purpose, not internal code names.
- **Load order matters.** If your module uses `DevHub.Utils`, it must load after `utils.js` in `manifest.json`.
- Group related modules into a folder under `src/features/` (e.g., `action-buttons-bar/`).
- Standalone modules stay in `src/modules/`.

---

## Verification

After any change, verify:
1. `manifest.json` has correct file paths in the right load order
2. The extension loads without console errors on a GitHub PR page
3. All features still work (action buttons, scroll button, timeline order, commits order)
4. Documentation matches the current code
