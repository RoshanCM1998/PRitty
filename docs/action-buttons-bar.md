# Action Buttons Bar

**Files:** `src/features/action-buttons-bar/pr-actions-button.js`, `src/features/action-buttons-bar/review-button.js`, `src/features/action-buttons-bar/header-actions.js`, `styles/buttons.css`, `styles/base.css`

## What It Does

A floating bar fixed to the **top-right corner** of every GitHub PR page. Contains two action buttons:

- **PR Actions** (green) — dropdown with context-aware merge/publish/draft actions
- **Submit Review** (blue) — dropdown with review dialog and direct approve options

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

On click: reads fresh state via `PRitty.GitHubState.getPRState()`, populates dropdown, closes any other open dropdowns, and toggles visibility. Clicking anywhere outside closes the dropdown.

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

Returns a wrapper containing a button + hidden dropdown:

```
.pritty-review-wrapper (relative positioned)
  ├── <button class="pritty-btn pritty-btn-review"> "Submit Review" with review icon
  └── <div class="pritty-dropdown"> (hidden by default)
      ├── "Submit Review" item → opens native review dialog
      └── "Approve PR" item → directly approves via API
```

On click: closes any other open dropdowns, then toggles dropdown visibility. Clicking anywhere outside closes the dropdown. The dropdown items are static (populated once in `create()`), unlike PR Actions which repopulates dynamically.

### Submit Review Action

Opens GitHub's native review dialog on the Files Changed tab:

```
User clicks "Submit Review" dropdown item
  ↓
Check current tab via GitHubState.getCurrentTab()
  ├── Already on "files" → find and click native "Submit review" button
  └── Other tab:
        1. Click "Files changed" tab
        2. MutationObserver waits for "Submit review" button to appear
        3. Click the native button via scrollAndClick()
```

### Approve PR Action (`_approvePR()`)

Directly approves the PR via GitHub's internal review endpoint:

1. Extracts `owner/repo/prNumber` from `window.location.pathname`
2. Builds the reviews endpoint path: `/{owner}/{repo}/pull/{number}/reviews`
3. Obtains a CSRF token via `_getCSRFToken()` (see below)
4. Sends a `POST` to the reviews endpoint with form data and extra headers:
   - `authenticity_token` — the CSRF token
   - `pull_request_review[event]` — `"approve"`
   - `pull_request_review[body]` — empty string
   - `Accept: application/json` — encourages JSON error responses
   - `X-Requested-With: XMLHttpRequest` — signals an AJAX request
5. On success (HTTP 2xx) → `window.location.reload()`
6. On failure → `alert()` with a parsed error message via `_parseErrorResponse()`

**Security:** Uses same-origin `fetch` authenticated by the page's own CSRF token and session cookies. No new permissions, no credentials stored by the extension.

### CSRF Token Extraction (`_getCSRFToken(reviewsAction)`)

Called at **click time** (not page load) because GitHub's Turbo SPA navigation can invalidate previously cached tokens. Uses a three-tier fallback:

1. **Meta tag** — `<meta name="csrf-token">` provides a global token when present
2. **Reviews form input** — `<input name="authenticity_token">` inside a `<form>` targeting the reviews endpoint (or any form whose action ends with `/reviews`)
3. **Any form input** — falls back to the first `<input name="authenticity_token">` found anywhere on the page

Returns `null` if no token is found (user is likely not logged in).

### Error Response Parsing (`_parseErrorResponse(response)`)

Extracts a human-readable error message from GitHub's response (e.g., "You can't approve your own PR"):

1. **JSON** — parses `response.text()` as JSON; returns `message` field or joins `errors[]` array
2. **HTML** — parses as HTML and looks for `.flash-error`, `.flash-warn`, or `[role='alert']` elements
3. **Fallback** — returns `"Failed to approve PR (HTTP {status})."`

### Dropdown Item Factory (`_item()`)

Same pattern as CompleteButton: each item is a `<button class="pritty-dropdown-item">` with label and description spans.

---

## Cross-Dropdown Coordination

Both the PR Actions and Submit Review buttons close all other `.pritty-dropdown` elements before opening their own. This is done inline in each button's click handler (no shared function) to avoid load-order dependencies:

```js
document.querySelectorAll(".pritty-dropdown").forEach((dd) => {
  if (dd !== dropdown) dd.hidden = true;
});
```

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
| `.pritty-complete-wrapper` | Relative positioned wrapper for PR Actions dropdown |
| `.pritty-review-wrapper` | Relative positioned wrapper for Submit Review dropdown |
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
