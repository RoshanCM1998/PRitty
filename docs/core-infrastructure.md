# Core Infrastructure

**Files:** `src/core/namespace.js`, `src/core/icons.js`, `src/core/utils.js`, `src/modules/github-state.js`, `src/features/action-buttons-bar/header-actions.js`, `src/content.js`

These modules provide the foundation that all features build on.

---

## Namespace (`src/core/namespace.js`)

**Must load first.** Creates the shared global that all modules attach to.

```js
window.PRitty = window.PRitty || {};

// Attribute used to tag all PRitty-injected DOM elements for cleanup
PRitty.INJECTED_ATTR = "data-pritty-injected";

// Centralized GitHub DOM selectors
PRitty.Selectors = {
  PAGE_HEADER:        "#partial-discussion-header",
  HEADER_ACTIONS:     ".gh-header-actions",
  STATE_LABEL:        'span.State[data-view-component="true"]',
  STATE_INDICATOR:    'span.State[data-view-component="true"], [class*="StateLabel"]',  // All tabs
  TAB:                'nav[aria-label*="Pull request"] [role="tab"], nav[aria-label*="Pull request"] a.tabnav-tab',
  SELECTED_TAB:       'nav[aria-label*="Pull request"] [role="tab"][aria-selected="true"], nav[aria-label*="Pull request"] a.tabnav-tab.selected',
  CONFLICT_INDICATOR: '[class*="conflict"], [aria-label*="conflict"]',

  // File tree sidebar (Files Changed tab)
  FILE_TREE_SIDEBAR:      '#pr-file-tree',
  FILE_TREE_ROOT:         '#pr-file-tree ul[role="tree"]',
  FILE_TREE_ITEM:         '#pr-file-tree li[role="treeitem"]',
  FILE_TREE_ITEM_CONTENT: '.PRIVATE_TreeView-item-content',

  // Diff containers
  DIFF_FILE_HEADER:       '[class*="DiffFileHeader-module__diff-file-header"]',
  DIFF_EXPAND_ALL_BTN:    '.js-expand-all-difflines-button',
  DIFF_VIEWED_BTN:        'button[class*="MarkAsViewedButton-module"]',
};
```

**Why centralized selectors?** GitHub frequently changes DOM structure and class names. Centralizing selectors means you only need to update one file when this happens.

---

## Icons (`src/core/icons.js`)

SVG icon strings for UI elements. Each is a complete `<svg>` element string.

```js
PRitty.Icons = {
  check:   /* green checkmark, 16x16, class="pritty-checks-icon" */,
  x:       /* red X mark, 16x16, class="pritty-checks-icon" */,
  pending: /* gray filled circle, 16x16, class="pritty-checks-icon" */,
  merge:   /* git merge branches, 14x14 */,
  review:  /* speech bubble/comment, 14x14 */,
};
```

Used by inserting into `innerHTML`:
```js
btn.innerHTML = `${PRitty.Icons.merge} PR Actions`;
```

---

## Utils (`src/core/utils.js`)

Shared DOM helpers on `PRitty.Utils`. Used throughout all modules.

### `waitForElement(selector, timeout = 10000)`

Returns a Promise that resolves when a matching element appears in the DOM:

```js
// Uses MutationObserver on document.body (childList + subtree)
// Rejects with timeout error after 10s (configurable)
const el = await PRitty.Utils.waitForElement(".some-selector");
```

### `findTab(label)`

Finds a PR tab element by partial text match:

```js
// Searches all [role="tab"] elements for textContent including label
const checksTab = PRitty.Utils.findTab("Checks");     // → Checks tab element
const filesTab  = PRitty.Utils.findTab("Files changed"); // → Files tab element
```

### `isPRittyElement(el)`

Checks if an element is inside any PRitty-injected container:

```js
// Walks up the DOM looking for [data-pritty-injected] ancestor
PRitty.Utils.isPRittyElement(someButton); // → true/false
```

### `findButtonByText(text)` / `findButtonByPrefix(prefix)`

Find native GitHub buttons, **excluding** PRitty's own buttons:

```js
// Exact match (trimmed)
PRitty.Utils.findButtonByText("Submit review");
// Prefix match (trimmed, startsWith)
PRitty.Utils.findButtonByPrefix("Squash and merge");
```

Both scan all `<button>` elements on the page and filter out PRitty UI via `isPRittyElement()`.

### `scrollAndClick(el)`

Scroll an element into view (instant) and click it immediately. Used by action buttons to trigger native GitHub buttons:

```js
PRitty.Utils.scrollAndClick(mergeBtn);
```

---

## GitHub State Reader (`src/modules/github-state.js`)

Reads live PR information from the DOM. Attached to `PRitty.GitHubState`.

### `getChecksInfo()`

Parses CI/check status:

```js
const info = PRitty.GitHubState.getChecksInfo();
// → { total: 5, passed: 3, failed: 1, pending: 1, unknown: false }
```

**How it works:**
1. Finds the "Checks" tab, extracts count from text like `"Checks 5"`
2. Queries `.merge-status-list .merge-status-item` and `[data-testid="status-check"]`
3. Classifies each by icon class:
   - `color-fg-success` or `octicon-check` → passed
   - `color-fg-danger` or `octicon-x` → failed
   - Everything else → pending
4. If tab shows a count but no status items found → returns `unknown: true`

### `getPRState()`

Detects PR lifecycle state:

```js
const state = PRitty.GitHubState.getPRState();
// → { isDraft: false, isMerged: false, isClosed: false,
//     hasConflicts: false, mergeEnabled: true, mergeBtn: <Element> }
```

**Detection logic:**
- Reads `span.State[data-view-component="true"]` element
- Checks `reviewable_state` attribute for draft, CSS class modifiers (`State--merged`, `State--closed`), `title` attribute, and `textContent` as fallbacks
- Scans for conflict indicators via `CONFLICT_INDICATOR` selector
- Searches for merge button by prefix: "Merge pull request", "Squash and merge", "Rebase and merge"
- `mergeEnabled` = merge button exists AND is not disabled

### `getCurrentTab()`

Returns which PR tab is active:

```js
PRitty.GitHubState.getCurrentTab();
// → "conversation" | "commits" | "checks" | "files"
```

Reads the selected PR tab element text (supports both `role="tab"` and `a.tabnav-tab.selected` variants). Defaults to `"conversation"`.

---

## Header Actions Assembly (`src/features/action-buttons-bar/header-actions.js`)

`PRitty.HeaderActions.createAll()` builds the floating bar:

```js
createAll() {
  const container = document.createElement("div");
  container.className = "pritty-actions";
  container.setAttribute(PRitty.INJECTED_ATTR, "true");

  container.appendChild(PRitty.CompleteButton.create());  // PR Actions dropdown
  container.appendChild(PRitty.ReviewButton.create());    // Submit Review button

  return container;
}
```

The returned container gets appended to `document.body` by `content.js`.

---

## Entry Point (`src/content.js`)

IIFE that bootstraps and manages the extension lifecycle.

### `inject()`

```js
function inject() {
  // Remove all previously injected PRitty elements
  document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());
  // Create fresh header actions bar
  document.body.appendChild(PRitty.HeaderActions.createAll());
}
```

### `init()`

```js
function init() {
  // 1. URL guard: only run on /pull/\d+ pages
  if (!window.location.pathname.match(/\/pull\/\d+/)) return;

  // 2. Initial injection
  inject();

  // 3. Create scroll-to-top button
  PRitty.ScrollTop.create();

  // 4. MutationObserver for SPA navigation resilience
  const observer = new MutationObserver(() => {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;
    // Re-inject if PRitty elements were removed (Turbo navigation)
    if (!document.querySelector(`[${ATTR}]`)) inject();
    // Re-apply timeline reorder if discussion was reset
    const discussion = document.querySelector(".js-discussion");
    if (discussion && !discussion.hasAttribute(PRitty.TimelineReorder.REORDERED_ATTR)) {
      PRitty.TimelineReorder.apply();
    }

    // File tree enhancements (Files Changed tab)
    const fileTree = document.querySelector(PRitty.Selectors.FILE_TREE_SIDEBAR);
    if (fileTree && !fileTree.hasAttribute('data-pritty-tree-enhanced')) {
      PRitty.FileTreeEnhancements.init();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
```

### Bootstrap

```js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();  // DOM already ready (run_at: document_idle usually hits this path)
}
```

---

## Module Dependency Graph

```
namespace.js
  ↓
icons.js ──────────────────────────────────────┐
  ↓                                            │
utils.js ──────────────────────────────┐       │
  ↓                                    │       │
github-state.js ──────────────┐        │       │
  ↓                           │        │       │
pr-actions-button.js ◄────────┤◄───────┤◄──────┤
review-button.js     ◄────────┤◄───────┤◄──────┘
timeline-reorder.js (standalone — reads DOM directly)
scroll-top.js       (standalone — uses only INJECTED_ATTR)
file-tree-enhancements.js (standalone — uses Selectors, reads DOM + embedded JSON)
  ↓
header-actions.js ◄── pr-actions-button, review-button
  ↓
content.js ◄── header-actions, scroll-top, timeline-reorder, file-tree-enhancements
```
