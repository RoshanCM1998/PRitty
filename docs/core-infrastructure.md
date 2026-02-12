# Core Infrastructure

**Files:** `src/core/namespace.js`, `src/core/icons.js`, `src/core/utils.js`, `src/modules/github-state.js`, `src/features/action-buttons-bar/header-actions.js`, `src/content.js`

These modules provide the foundation that all features build on.

---

## Namespace (`src/core/namespace.js`)

**Must load first.** Creates the shared global that all modules attach to.

```js
window.DevHub = window.DevHub || {};

// Attribute used to tag all DevHub-injected DOM elements for cleanup
DevHub.INJECTED_ATTR = "data-devhub-injected";

// Centralized GitHub DOM selectors
DevHub.Selectors = {
  PAGE_HEADER:        "#partial-discussion-header",
  HEADER_ACTIONS:     ".gh-header-actions",
  STATE_LABEL:        'span.State[data-view-component="true"]',
  TAB:                'nav[aria-label*="Pull request"] [role="tab"], nav[aria-label*="Pull request"] a.tabnav-tab',
  SELECTED_TAB:       'nav[aria-label*="Pull request"] [role="tab"][aria-selected="true"], nav[aria-label*="Pull request"] a.tabnav-tab.selected',
  CONFLICT_INDICATOR: '[class*="conflict"], [aria-label*="conflict"]',
};
```

**Why centralized selectors?** GitHub frequently changes DOM structure and class names. Centralizing selectors means you only need to update one file when this happens.

---

## Icons (`src/core/icons.js`)

SVG icon strings for UI elements. Each is a complete `<svg>` element string.

```js
DevHub.Icons = {
  check:   /* green checkmark, 16x16, class="devhub-checks-icon" */,
  x:       /* red X mark, 16x16, class="devhub-checks-icon" */,
  pending: /* gray filled circle, 16x16, class="devhub-checks-icon" */,
  merge:   /* git merge branches, 14x14 */,
  review:  /* speech bubble/comment, 14x14 */,
};
```

Used by inserting into `innerHTML`:
```js
btn.innerHTML = `${DevHub.Icons.merge} PR Actions`;
```

---

## Utils (`src/core/utils.js`)

Shared DOM helpers on `DevHub.Utils`. Used throughout all modules.

### `waitForElement(selector, timeout = 10000)`

Returns a Promise that resolves when a matching element appears in the DOM:

```js
// Uses MutationObserver on document.body (childList + subtree)
// Rejects with timeout error after 10s (configurable)
const el = await DevHub.Utils.waitForElement(".some-selector");
```

### `findTab(label)`

Finds a PR tab element by partial text match:

```js
// Searches all [role="tab"] elements for textContent including label
const checksTab = DevHub.Utils.findTab("Checks");     // → Checks tab element
const filesTab  = DevHub.Utils.findTab("Files changed"); // → Files tab element
```

### `isDevHubElement(el)`

Checks if an element is inside any DevHub-injected container:

```js
// Walks up the DOM looking for [data-devhub-injected] ancestor
DevHub.Utils.isDevHubElement(someButton); // → true/false
```

### `findButtonByText(text)` / `findButtonByPrefix(prefix)`

Find native GitHub buttons, **excluding** DevHub's own buttons:

```js
// Exact match (trimmed)
DevHub.Utils.findButtonByText("Submit review");
// Prefix match (trimmed, startsWith)
DevHub.Utils.findButtonByPrefix("Squash and merge");
```

Both scan all `<button>` elements on the page and filter out DevHub UI via `isDevHubElement()`.

---

## GitHub State Reader (`src/modules/github-state.js`)

Reads live PR information from the DOM. Attached to `DevHub.GitHubState`.

### `getChecksInfo()`

Parses CI/check status:

```js
const info = DevHub.GitHubState.getChecksInfo();
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
const state = DevHub.GitHubState.getPRState();
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
DevHub.GitHubState.getCurrentTab();
// → "conversation" | "commits" | "checks" | "files"
```

Reads the selected PR tab element text (supports both `role="tab"` and `a.tabnav-tab.selected` variants). Defaults to `"conversation"`.

---

## Header Actions Assembly (`src/features/action-buttons-bar/header-actions.js`)

`DevHub.HeaderActions.createAll()` builds the floating bar:

```js
createAll() {
  const container = document.createElement("div");
  container.className = "devhub-actions";
  container.setAttribute(DevHub.INJECTED_ATTR, "true");

  container.appendChild(DevHub.CompleteButton.create());  // PR Actions dropdown
  container.appendChild(DevHub.ReviewButton.create());    // Submit Review button

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
  // Remove all previously injected DevHub elements
  document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());
  // Create fresh header actions bar
  document.body.appendChild(DevHub.HeaderActions.createAll());
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
  DevHub.ScrollTop.create();

  // 4. MutationObserver for SPA navigation resilience
  const observer = new MutationObserver(() => {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;
    // Re-inject if DevHub elements were removed (Turbo navigation)
    if (!document.querySelector(`[${ATTR}]`)) inject();
    // Re-apply timeline reorder if discussion was reset
    const discussion = document.querySelector(".js-discussion");
    if (discussion && !discussion.hasAttribute(DevHub.TimelineReorder.REORDERED_ATTR)) {
      DevHub.TimelineReorder.apply();
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
  ↓
header-actions.js ◄── pr-actions-button, review-button
  ↓
content.js ◄── header-actions, scroll-top, timeline-reorder
```
