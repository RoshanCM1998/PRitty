# Action Buttons Bar

**Files:** `src/features/action-buttons-bar/pr-actions-button.js`, `src/features/action-buttons-bar/review-button.js`, `src/features/action-buttons-bar/header-actions.js`, `styles/buttons.css`, `styles/base.css`

## What It Does

A floating bar fixed to the **top-right corner** of every GitHub PR page. Contains two action buttons:

- **PR Actions** (green) — dropdown with context-aware merge/publish/draft actions
- **Submit Review** (blue) — quick trigger for the native review dialog

The bar has a semi-transparent dark background (`rgba(22, 27, 34, 0.75)`) and stays visible while scrolling.

---

## Assembly (`src/features/action-buttons-bar/header-actions.js`)

`PRitty.HeaderActions.createAll()` builds the container:

```js
createAll() {
  const container = document.createElement("div");
  container.className = "pritty-actions";
  container.setAttribute(PRitty.INJECTED_ATTR, "true");

  container.appendChild(PRitty.CompleteButton.create());  // PR Actions
  container.appendChild(PRitty.ReviewButton.create());    // Submit Review

  return container;
}
```

Called by `content.js` → `inject()` → appended to `document.body`.

---

## PR Actions Button (`src/features/action-buttons-bar/pr-actions-button.js`)

**Module:** `PRitty.CompleteButton`

### Creation (`create()`)

Returns a wrapper containing a button + hidden dropdown:

```
.pritty-complete-wrapper (relative positioned)
  ├── <button> "PR Actions" with merge icon
  └── <div class="pritty-dropdown"> (hidden by default)
```

On click: reads fresh state via `PRitty.GitHubState.getPRState()`, populates dropdown, toggles visibility. Clicking anywhere outside closes the dropdown.

### Context-Aware Behavior

| PR State | Behavior |
|----------|----------|
| **Merged** | Button disabled (purple, 50% opacity) — no dropdown |
| **Closed** | "Reopen PR" — clicks GitHub's native "Reopen pull request" button |
| **Draft** | "Publish PR" — clicks GitHub's "Ready for review" button |
| **Open** | "Squash and merge" + "Convert to draft" |

### Dynamic State Updates (`_updateButtonState()`)

On every dropdown click, the button re-reads PR state and updates its disabled/merged appearance. This handles cases where a PR is merged or reopened while the page is open.

### Action Delegation (`_navigateAndClick()`)

All actions use `_navigateAndClick(findButtonFn)` which auto-navigates to the **Conversation tab** if needed (native action buttons only exist there). On the Conversation tab it clicks immediately; on other tabs it switches first and uses a `MutationObserver` to wait for the button to appear (10s timeout).

Each action locates the **native GitHub button** and clicks it:

**Publish PR (Draft):**
- Finds `"Ready for review"` button via `findButtonByText()` / `findButtonByPrefix()`
- Uses `scrollAndClick()` — instant scroll + immediate click

**Squash and Merge (Open):**
- Tries in order: `"Squash and merge"` → `"Merge pull request"` → `"Rebase and merge"`
- Only enabled when `mergeEnabled && !hasConflicts`
- Uses `scrollAndClick()` — instant scroll + immediate click

**Convert to Draft (Open):**
- Searches: `a[href*="convert_to_draft"]` → buttons with "Convert to draft" text → anchors with same text
- Uses `scrollAndClick()` — instant scroll + immediate click

**Reopen PR (Closed):**
- Finds `"Reopen pull request"` button via `findButtonByText()` / `findButtonByPrefix("Reopen")`
- Uses `scrollAndClick()` — instant scroll + immediate click

### Dropdown Item Factory (`_item()`)

Each item is a `<button class="pritty-dropdown-item">` with:
- `.pritty-dropdown-item-label` — bold action name (13px, white)
- `.pritty-dropdown-item-desc` — description text (11px, gray)
- Optional `--disabled` modifier (40% opacity, no click, no hover effect)

---

## Submit Review Button (`src/features/action-buttons-bar/review-button.js`)

**Module:** `PRitty.ReviewButton`

### Creation (`create()`)

```js
// Creates: <button class="pritty-btn pritty-btn-review">
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
        2. MutationObserver waits for "Submit review" button to appear
        3. Call _clickNative()
```

### `_clickNative()`

Finds GitHub's native `"Submit review"` button and uses `scrollAndClick()` (instant scroll + immediate click).

---

## CSS

### Floating Bar (`base.css`)

```css
.pritty-actions {
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
| `.pritty-btn-complete` | Green `#238636`, hover `#2ea043` |
| `.pritty-btn-review` | Blue `#1f6feb`, hover `#388bfd` |
| `.pritty-dropdown` | Dark `#161b22`, absolute below button, `z-index: 100` |
| `.pritty-dropdown-item:hover` | Background `#1f2937` |
| `.pritty-dropdown-item--disabled` | 40% opacity, no hover |

---

## Dependencies

- `PRitty.Icons.merge` / `PRitty.Icons.review` — button icons
- `PRitty.GitHubState.getPRState()` — reads PR state on every dropdown open
- `PRitty.GitHubState.getCurrentTab()` — checks active tab for review button
- `PRitty.Utils.findButtonByText/Prefix()` — locates native GitHub buttons
- `PRitty.Utils.findTab()` — locates the "Files changed" tab
- `PRitty.Utils.isPRittyElement()` — excludes own UI from button searches
