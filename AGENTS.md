# Agent Workflow Guide — PRitty

This file defines all conventions, patterns, and mandatory workflows for working on this codebase.

## Pre-Work Checklist (MANDATORY)

Before writing any code, complete these steps in order:

1. **Identify the feature** you're about to modify using this table:

| Feature | Read This Doc First | Code Files |
|---------|-------------------|------------|
| PR Actions button | `docs/action-buttons-bar.md` | `src/modules/PR/action-buttons-bar/pr-actions-button.js` |
| Submit Review button | `docs/action-buttons-bar.md` | `src/modules/PR/action-buttons-bar/review-button.js` |
| Floating bar assembly | `docs/action-buttons-bar.md` | `src/modules/PR/action-buttons-bar/header-actions.js` |
| Scroll to Top | `docs/scroll-to-top.md` | `src/modules/PR/scroll-top.js` |
| Conversation tab | `docs/conversation-tab.md` | `src/modules/PR/Conversation/timeline-reorder.js`, `styles/base.css` |
| Commits tab | `docs/README.md` (#4) | `styles/base.css` (Commits Tab section) |
| Files Changed tab | `docs/README.md` (#5) | `styles/base.css` (Files Changes Tab section) |
| File Tree Enhancements | `docs/file-tree-enhancements.md` | `src/modules/PR/File Changes/file-tree-enhancements.js` |
| Diff Navigation | `docs/README.md` (#7) | `src/modules/PR/File Changes/diff-nav-buttons.js`, `styles/base.css` |
| Split Diff Resizer | `docs/split-diff-resizer.md` | `src/modules/PR/File Changes/split-diff-resizer.js`, `styles/base.css` |
| Namespace / selectors | `docs/core-infrastructure.md` | `src/core/namespace.js` |
| Utils | `docs/core-infrastructure.md` | `src/core/utils.js` |
| Icons | `docs/core-infrastructure.md` | `src/core/icons.js` |
| GitHub state reader | `docs/core-infrastructure.md` | `src/modules/PR/action-buttons-bar/github-state.js` |
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

All modules attach to `window.PRitty` namespace. No import/export system — scripts are loaded sequentially by `manifest.json`.

```js
// Every module follows this pattern:
PRitty.ModuleName = {
  create() { /* ... */ },
  _privateMethod() { /* ... */ },
};
```

### File Organization

```
src/core/          → Shared infrastructure (namespace, icons, utils)
src/modules/PR/    → All PR-page modules, organised by sub-screen
  Conversation/    → Conversation-tab features (timeline-reorder)
  File Changes/    → Files-Changed-tab features (diff-nav-buttons, file-tree-enhancements, split-diff-resizer)
  action-buttons-bar/ → Floating action bar (github-state, pr-actions-button, review-button, header-actions)
  scroll-top.js    → Scroll-to-top button
src/content.js     → Entry point (IIFE, bootstraps everything)
styles/            → Global CSS (base.css for layout, buttons.css for buttons)
```

### Script Load Order

Defined in `manifest.json`. Order matters — each module depends on prior ones:

1. Core: `namespace.js` → `icons.js` → `utils.js`
2. State: `PR/action-buttons-bar/github-state.js`
3. Modules: `PR/action-buttons-bar/pr-actions-button.js` → `PR/action-buttons-bar/review-button.js` → `PR/Conversation/timeline-reorder.js` → `PR/scroll-top.js` → `PR/File Changes/diff-nav-buttons.js` → `PR/File Changes/split-diff-resizer.js` → `PR/File Changes/file-tree-enhancements.js`
4. Assembly: `PR/action-buttons-bar/header-actions.js`
5. Bootstrap: `content.js`

When adding new modules, insert them in the correct position in this chain.

### Injected Element Tagging

All PRitty-injected DOM elements are tagged with `data-pritty-injected` attribute. This allows:
- Clean removal during re-injection (`inject()` in content.js)
- Exclusion from button searches (`isPRittyElement()`)

---

## Coding Patterns

### Adding a New Module

```js
// Attach to PRitty namespace — no import/export
PRitty.MyModule = {
  create() {
    const el = document.createElement("div");
    el.setAttribute(PRitty.INJECTED_ATTR, "true"); // tag for cleanup
    // ...
    return el;
  },
};
```

Then add the file path to `manifest.json` in the correct load order position.

### Adding CSS

- Use `pritty-` prefix for all class names
- Add to `styles/base.css` for layout/positioning, or `styles/buttons.css` for button styles
- Use section comments: `/* === Section Name === */`
- Prefer CSS `flex-direction: column-reverse` over JS DOM manipulation for reordering
- Z-index layers: `999` (action bar) > `100` (dropdown) > `99` (scroll button)

### Interacting with GitHub's Native UI

```js
// 1. Find the native button (excludes PRitty's own buttons)
const btn = PRitty.Utils.findButtonByText("Button text");
// or: PRitty.Utils.findButtonByPrefix("Button prefix");

// 2. Scroll into view and click (instant scroll, no delays)
PRitty.Utils.scrollAndClick(btn);
```

### Adding GitHub DOM Selectors

All GitHub-specific selectors are centralized in `src/core/namespace.js` under `PRitty.Selectors`. When GitHub changes their DOM, update selectors there — never hardcode selectors in individual modules.

---

## Rules

- **Do not create unnecessary files.** Edit existing files when possible.
- **Do not add new folders** unless you are adding a new screen context (peer of `PR/`) or a sub-screen with 2+ modules (peer of `Conversation/`).
- **CSS stays in global stylesheets** (`base.css` / `buttons.css`) with section comments — no per-module CSS files.
- **All injected DOM elements** must have `data-pritty-injected` attribute for cleanup.
- **File names should match their UI label** or purpose, not internal code names.
- **Load order matters.** If your module uses `PRitty.Utils`, it must load after `utils.js` in `manifest.json`.
- New PR-wide modules go in `src/modules/PR/`. Screen-specific modules go in the matching sub-folder (`Conversation/`, `File Changes/`, etc.).

---

## Verification

After any change, verify:
1. `manifest.json` has correct file paths in the right load order
2. The extension loads without console errors on a GitHub PR page
3. All features still work (action buttons, scroll button, timeline order, commits order)
4. Documentation matches the current code
