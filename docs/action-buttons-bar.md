# Action Buttons Bar

**Files:** `src/features/action-buttons-bar/pr-actions-button.js`, `src/features/action-buttons-bar/review-button.js`, `src/features/action-buttons-bar/header-actions.js`, `styles/buttons.css`, `styles/base.css`

## What It Does

A floating bar fixed to the **top-right corner** of every GitHub PR page. Contains two action buttons:

- **PR Actions** (green) — dropdown with context-aware merge/publish/draft actions
- **Submit Review** (blue) — quick trigger for the native review dialog

The bar has a semi-transparent dark background (`rgba(22, 27, 34, 0.75)`) and stays visible while scrolling.

---

## Assembly (`src/features/action-buttons-bar/header-actions.js`)

`DevHub.HeaderActions.createAll()` builds the container:

```js
createAll() {
  const container = document.createElement("div");
  container.className = "devhub-actions";
  container.setAttribute(DevHub.INJECTED_ATTR, "true");

  container.appendChild(DevHub.CompleteButton.create());  // PR Actions
  container.appendChild(DevHub.ReviewButton.create());    // Submit Review

  return container;
}
```

Called by `content.js` → `inject()` → appended to `document.body`.

---

## PR Actions Button (`src/features/action-buttons-bar/pr-actions-button.js`)

**Module:** `DevHub.CompleteButton`

### Creation (`create()`)

Returns a wrapper containing a button + hidden dropdown:

```
.devhub-complete-wrapper (relative positioned)
  ├── <button> "PR Actions" with merge icon
  └── <div class="devhub-dropdown"> (hidden by default)
```

On click: reads fresh state via `DevHub.GitHubState.getPRState()`, populates dropdown, toggles visibility. Clicking anywhere outside closes the dropdown.

### Context-Aware Dropdown (`_populateDropdown()`)

| PR State | Actions Shown |
|----------|--------------|
| **Merged or Closed** | "No actions available" (disabled) |
| **Draft** | "Publish PR" — clicks GitHub's "Ready for review" button |
| **Open** | "Squash and merge" + "Convert to draft" |

### Action Delegation

Each action locates the **native GitHub button** and clicks it:

**Publish PR (Draft):**
- Finds `"Ready for review"` button via `findButtonByText()` / `findButtonByPrefix()`
- Scrolls into view, clicks after 400ms delay

**Squash and Merge (Open):**
- Tries in order: `"Squash and merge"` → `"Merge pull request"` → `"Rebase and merge"`
- Only enabled when `mergeEnabled && !hasConflicts`
- Scrolls into view, clicks after 400ms delay

**Convert to Draft (Open):**
- Searches: `a[href*="convert_to_draft"]` → buttons with "Convert to draft" text → anchors with same text
- Scrolls into view, clicks after 400ms delay

### Dropdown Item Factory (`_item()`)

Each item is a `<button class="devhub-dropdown-item">` with:
- `.devhub-dropdown-item-label` — bold action name (13px, white)
- `.devhub-dropdown-item-desc` — description text (11px, gray)
- Optional `--disabled` modifier (40% opacity, no click, no hover effect)

---

## Submit Review Button (`src/features/action-buttons-bar/review-button.js`)

**Module:** `DevHub.ReviewButton`

### Creation (`create()`)

```js
// Creates: <button class="devhub-btn devhub-btn-review">
//            {review icon} Submit Review
//          </button>
// title: "Open review submission dialog"
```

### Click Behavior

```
User clicks "Submit Review"
  ↓
Check current tab via GitHubState.getCurrentTab()
  ├── Already on "files" → _clickNative() immediately
  └── Other tab:
        1. Click "Files changed" tab
        2. Wait 1500ms for content to load
        3. Call _clickNative()
```

### `_clickNative()`

Finds GitHub's native `"Submit review"` button, scrolls into view, clicks after 300ms.

---

## CSS

### Floating Bar (`base.css`)

```css
.devhub-actions {
  position: fixed;
  top: 36px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 999;
  padding: 6px 12px;
  background: rgba(22, 27, 34, 0.75);
  border: 1px solid #30363d;
  border-radius: 8px;
}
```

### Buttons (`buttons.css`)

| Class | Style |
|-------|-------|
| `.devhub-btn-complete` | Green `#238636`, hover `#2ea043` |
| `.devhub-btn-review` | Blue `#1f6feb`, hover `#388bfd` |
| `.devhub-dropdown` | Dark `#161b22`, absolute below button, `z-index: 100` |
| `.devhub-dropdown-item:hover` | Background `#1f2937` |
| `.devhub-dropdown-item--disabled` | 40% opacity, no hover |

---

## Dependencies

- `DevHub.Icons.merge` / `DevHub.Icons.review` — button icons
- `DevHub.GitHubState.getPRState()` — reads PR state on every dropdown open
- `DevHub.GitHubState.getCurrentTab()` — checks active tab for review button
- `DevHub.Utils.findButtonByText/Prefix()` — locates native GitHub buttons
- `DevHub.Utils.findTab()` — locates the "Files changed" tab
- `DevHub.Utils.isDevHubElement()` — excludes own UI from button searches
