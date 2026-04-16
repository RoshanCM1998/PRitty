# PRitty — Documentation

**Version:** 1.1.0 | **Type:** Chrome/Edge Browser Extension (Manifest V3)

PRitty brings Azure DevOps-style pull request experience to GitHub — quick actions, reversed timelines, and streamlined navigation.

**Activates on:** `https://github.com/*/pull/*` (PR features) and `https://github.com/*/*` (repo features)

---

## Features

| # | Feature | Code Location | Docs |
|---|---------|--------------|------|
| 0 | [**Branches Nav Button**](#0-branches-nav-button) | `src/modules/Repo/branches-nav-button.js` | Inline below |
| 1 | [**Action Buttons Bar**](#1-action-buttons-bar) | `src/modules/PR/action-buttons-bar/` | [action-buttons-bar.md](./action-buttons-bar.md) |
| 2 | [**Scroll to Top**](#2-scroll-to-top-button) | `src/modules/PR/scroll-top.js`, `styles/base.css` | [scroll-to-top.md](./scroll-to-top.md) |
| 3 | [**Conversation Tab Changes**](#3-conversation-tab-changes) | `src/modules/PR/Conversation/timeline-reorder.js`, `styles/base.css` | [conversation-tab.md](./conversation-tab.md) |
| 4 | [**Commits Tab Changes**](#4-commits-tab-changes) | `styles/base.css` | Inline below |
| 5 | [**Files Changed Tab Changes**](#5-files-changed-tab-changes) | `styles/base.css` | Inline below |
| 6 | [**File Tree Enhancements**](#6-file-tree-enhancements) | `src/modules/PR/File Changes/` | [file-tree-enhancements.md](./file-tree-enhancements.md) |
| 7 | [**Diff Navigation**](#7-diff-navigation) | `src/modules/PR/File Changes/diff-nav-buttons.js`, `styles/base.css` | Inline below |
| 8 | [**Split Diff Resizer**](#8-split-diff-resizer) | `src/modules/PR/File Changes/split-diff-resizer.js`, `styles/base.css` | [split-diff-resizer.md](./split-diff-resizer.md) |
| 9 | [**Azure Checks Re-Run**](#9-azure-checks-re-run) | `src/modules/PR/checks-rerun.js`, `styles/buttons.css` | Inline below |
| 10 | [**Comment Shortcut**](#10-comment-shortcut) | `src/modules/PR/comment-shortcut.js` | [comment-shortcut.md](./comment-shortcut.md) |
| 11 | [**Markdown Preview**](#11-markdown-preview) | `src/modules/PR/File Changes/markdown-preview.js`, `styles/base.css` | [markdown-preview.md](./markdown-preview.md) |
| 12 | [**Merge Conflict Highlight**](#12-merge-conflict-highlight) | `styles/base.css` | Inline below |
| 13 | [**Markdown Blob Preview**](#13-markdown-blob-preview) | `src/modules/Repo/markdown-blob-preview.js`, `styles/markdown-blob-preview.css` | Inline below |
| — | [**Core Infrastructure**](#core-infrastructure) | `src/core/`, `src/modules/PR/action-buttons-bar/github-state.js`, `src/content.js` | [core-infrastructure.md](./core-infrastructure.md) |

---

### 0. Branches Nav Button

Injects a **"Branches"** tab into GitHub's repository-level nav bar (Code / Issues / Pull requests / Actions / …), positioned immediately after the "Code" tab. Activates on all repo pages (`github.com/*/*`).

- Navigates to `/{owner}/{repo}/branches`
- Highlights with `aria-current="page"` when on the branches page or any sub-path
- Persists through GitHub's SPA (Turbo) navigation via MutationObserver

**Implementation:** Clones the "Code" `<li>` element rather than building from scratch — inherits all of GitHub's CSS classes automatically, so the tab always looks correct even after class renames.

**Code:** `src/modules/Repo/branches-nav-button.js`

**Selector used:** `PRitty.Selectors.REPO_NAV` (`nav[aria-label="Repository"]`)

**Self-bootstraps** — has its own `content_scripts` entry in `manifest.json`; not orchestrated by `content.js`.

---

### 1. Action Buttons Bar

A floating bar fixed to the **top-right corner** of the page containing two buttons:

- **PR Actions** (green) — context-aware dropdown with merge, publish, or convert-to-draft actions depending on PR state
- **Submit Review** (blue) — navigates to Files Changed tab and opens the native review dialog

**Code:** `src/modules/PR/action-buttons-bar/` (dedicated folder)
- `pr-actions-button.js` — PR Actions dropdown button + context-aware actions
- `review-button.js` — Submit Review button + tab switching logic
- `header-actions.js` — assembles both buttons into the floating bar container

**Styling:** `styles/buttons.css`, `styles/base.css` (`.pritty-actions` container)

**Detailed docs:** [action-buttons-bar.md](./action-buttons-bar.md)

---

### 2. Scroll to Top Button

A circular floating button fixed to the **bottom-right corner**. Clicking it smooth-scrolls the page to the top. Starts at 60% opacity, fully visible on hover.

**Code:** `src/modules/PR/scroll-top.js`, `styles/base.css`

**Detailed docs:** [scroll-to-top.md](./scroll-to-top.md)

---

### 3. Conversation Tab Changes

Multiple enhancements to the PR conversation tab:

- **Timeline reordering** — newest comments appear first (CSS `column-reverse` handles reversal; JS only moves PR description to top)
- **Hidden noise elements** — labels_updated, projects_updated, milestone_updated timeline badges are hidden
- **Comment box cleanup** — GitHub's suggestion/guideline boxes below the comment input are hidden
- **Merge actions repositioning** — merge area and comment box get `margin-left: -56px` adjustment
- **Reviewer name magnification** — reviewer names displayed at `1.25rem` font size

**Code:** `src/modules/PR/Conversation/timeline-reorder.js`, `styles/base.css` (Conversation Tab section)

**Detailed docs:** [conversation-tab.md](./conversation-tab.md)

---

### 4. Commits Tab Changes

Reverses the commit list to show **newest commits first** using pure CSS. Located in `styles/base.css` under the `Commits Tab` section comment.

```css
/* Reverse commit date groups and individual commit lists */
[data-testid="commits-list"] > div {
  flex-direction: column-reverse;

  ul {
    display: flex;
    flex-direction: column-reverse;

    li {
      border-bottom: var(--borderWidth-thin) solid var(--borderColor-muted);
    }
  }
}
```

**DOM structure targeted:**
```
[data-testid="commits-list"]
  └── div                     ← reversed (commit date groups)
       └── ul                 ← reversed (individual commits)
            ├── li (newest)   ← now appears first
            └── li (oldest)   ← now appears last
```

No JS involved — pure CSS `flex-direction: column-reverse` survives SPA navigation automatically.

---

### 5. Files Changed Tab Changes

Reverses the **"Select commits to view"** dropdown in the Files Changed tab so newest commits appear first. Located in `styles/base.css` under the `Files Changes Tab` section comment.

```css
/* Primary selector — semantic aria-label */
ul[aria-label="Select a range of commits"] {
  display: flex;
  flex-direction: column-reverse;
}

/* Fallback — GitHub's internal class (in case label changes) */
ul.prc-ActionList-GroupList-V5B3- {
  display: flex;
  flex-direction: column-reverse;
}
```

Two selectors for resilience: `aria-label` is stable and semantic, the class-based one acts as fallback.

No JS involved — pure CSS.

See also: [File Tree Enhancements](#6-file-tree-enhancements) for JS-based enhancements to the file tree sidebar.

---

### 6. File Tree Enhancements

Two JS-based enhancements for the file tree sidebar in the Files Changed tab:

- **Viewed checkboxes** — each file and folder in the tree gets a checkbox that syncs bidirectionally with GitHub's native "Viewed" buttons
- **Enhanced file click** — clicking a file auto-expands collapsed diffs and reveals full file content

**Code:** `src/modules/PR/File Changes/file-tree-enhancements.js`, `styles/base.css`

**Detailed docs:** [file-tree-enhancements.md](./file-tree-enhancements.md)

---

### 7. Diff Navigation

Two buttons (previous/next) injected into GitHub's native **Pull Request Files Toolbar** (sticky header on the Files Changed tab). They navigate between change hunks — groups of consecutive added/deleted lines in the diff view.

**Injection point:** Start of the toolbar's right-side controls div (2nd child of the toolbar `<section>`).

**Navigation logic:**
- Collects all `code.diff-text.addition` and `code.diff-text.deletion` elements
- Groups consecutive changed `tr.diff-line-row` elements into "hunks"
- Navigates to the first row of each hunk, with offset for the sticky toolbar

**Code:** `src/modules/PR/File Changes/diff-nav-buttons.js`, `styles/base.css` (Diff Navigation Buttons section)

**Selectors used:** `PRitty.Selectors.PR_FILES_TOOLBAR`, `PRitty.Selectors.DIFF_CHANGED_LINE`

---

### 8. Split Diff Resizer

A draggable vertical separator between the left (old code) and right (new code) panes in GitHub PR **split view** — matching the Azure DevOps experience.

- **Drag** the handle to resize both panes simultaneously across all diff tables
- **Double-click** resets to 50/50
- Ratio is preserved as you scroll; lazily-loaded tables are pre-resized at the current ratio
- Switching to unified view destroys handles and resets col widths; switching back re-injects them

**Code:** `src/modules/PR/File Changes/split-diff-resizer.js`, `styles/base.css` (Split Diff Resizer section)

**Detailed docs:** [split-diff-resizer.md](./split-diff-resizer.md)

---

### 10. Comment Shortcut

Removes the **"Start a review"** button from inline diff comment forms and makes **Ctrl+Enter** post a direct comment immediately instead of queuing a review.

- **"Start a review"** is removed from the DOM on every MutationObserver tick (as GitHub re-renders inline forms dynamically).
- **Ctrl+Enter** is intercepted in capture phase; the extension clicks "Reply", "Add single comment", or "Comment" depending on the form context.
- Controlled by the `commentShortcut` toggle in the PRitty popup (toolbar icon).

**Code:** `src/modules/PR/comment-shortcut.js`

**Settings:** `src/core/settings.js` + `popup/popup.html` / `popup/popup.js` / `popup/popup.css`

**Detailed docs:** [comment-shortcut.md](./comment-shortcut.md)

---

### 11. Markdown Preview

Shows the markdown **textarea and rendered preview simultaneously** in PR comment forms on the **Files Changed tab** (stacked vertically: textarea on top, preview below).

- **React pattern** — auto-clicks Preview, removes `displayNone` CSS-module class from textarea span
- **MutationObserver** per container re-removes hiding if GitHub re-adds it on tab interactions
- Controlled by the `sideBySidePreview` toggle in the PRitty popup (default: on)

**Code:** `src/modules/PR/File Changes/markdown-preview.js`, `styles/base.css`

**Detailed docs:** [markdown-preview.md](./markdown-preview.md)

---

### 12. Merge Conflict Highlight

Highlights GitHub's merge conflict section with a **subtle warning background** (light tomato red) so it stands out instead of blending in with the page.

- **Pure CSS** — no JavaScript needed; uses a case-insensitive attribute selector on the conflict `<section>`
- **Selector:** `section[aria-label*="onflict" i]` — matches GitHub's `aria-label="Conflicts"` regardless of casing

**Code:** `styles/base.css` (Merge Conflict Highlight section)

---

### 13. Markdown Blob Preview

Enhances the visual appearance of **markdown file previews** on GitHub repository pages (e.g., viewing a `.md` file on `blob/master/`).

- **Parent background** — the markdown section wrapper gets a subtle muted background with rounded bottom corners
- **Heading accents** — `h1` gets a 2px accent-blue bottom border; `h2` gets a 1px accent-blue border
- **Tables** — rounded table container, tinted header row with accent bottom border, alternating row backgrounds, hover highlight
- **Blockquotes** — accent-blue left bar with tinted background and rounded right corners
- **Horizontal rules** — gradient fade instead of a hard line
- **Code blocks** — border + rounded corners for `pre`, accent-tinted background for inline `code`

Uses `[class*="BlobContent-module__"]` attribute-contains selectors to survive CSS-module hash changes. All CSS rules are gated behind `body.pritty-md-blob-preview` class, toggled by JS based on the `markdownBlobPreview` setting.

**Code:** `src/modules/Repo/markdown-blob-preview.js`, `styles/markdown-blob-preview.css`

**Settings:** `markdownBlobPreview` toggle in the PRitty popup (default: on)

**Activated on:** All repo pages (`github.com/*/*`) via the first `content_scripts` entry in `manifest.json`.

**Self-bootstraps** — has its own `content_scripts` entry in `manifest.json`; not orchestrated by `content.js`.

---

### 9. Azure Checks Re-Run

A **re-run button** (sync icon) injected into each Azure Pipelines check row in the expanded checks list. Hovering a row reveals the button; clicking it auto-posts `/azp run <pipeline_name>` as a PR comment.

- **Detection:** A check row is treated as Azure if its `<h4>` contains an `<a>` whose `href` includes `visualstudio.com` or `dev.azure.com`
- **Pipeline name:** Taken from the `<span>` text inside that anchor (e.g., `"Crew (App Stores) - CI"`)
- **Button placement:** Injected as `afterbegin` of `[class*="ActionBar-module__container"]` — before the existing kebab menu button
- **Comment posting:** Fills and submits GitHub's native comment textarea. If on a non-Conversation tab, switches there first, then posts
- **Re-injection safety:** Button presence (`.pritty-rerun-btn`) is the de-duplication guard — these buttons do NOT carry `data-pritty-injected` to avoid conflicting with `inject()`'s cleanup cycle

**Code:** `src/modules/PR/checks-rerun.js`, `styles/buttons.css`

---

## Core Infrastructure

Shared modules that all features depend on. Full details in [core-infrastructure.md](./core-infrastructure.md).

| Module | File | Purpose |
|--------|------|---------|
| Namespace | `src/core/namespace.js` | Creates `window.PRitty` global + `PRitty.Selectors` (GitHub DOM selectors) |
| Settings | `src/core/settings.js` | Loads feature toggles from `chrome.storage.sync`; provides synchronous `get()` after `load()` |
| Icons | `src/core/icons.js` | SVG icon strings (`merge`, `review`, `check`, `x`, `pending`, `chevronUp`, `chevronDown`) |
| Utils | `src/core/utils.js` | DOM helpers: `waitForElement`, `findTab`, `findButtonByText`, `findButtonByPrefix`, `isPRittyElement` |
| GitHub State | `src/modules/PR/action-buttons-bar/github-state.js` | Reads live PR state: `getChecksInfo()`, `getPRState()`, `getCurrentTab()` |
| Entry Point | `src/content.js` | Bootstraps everything, handles SPA re-injection via MutationObserver |

---

## Project Structure

```
manifest.json                              ← Extension config, load order, URL matching
├── src/
│   ├── core/
│   │   ├── namespace.js                   ← Global PRitty namespace + DOM selectors
│   │   ├── settings.js                    ← Feature toggles (chrome.storage.sync)
│   │   ├── icons.js                       ← SVG icon library
│   │   └── utils.js                       ← Shared DOM helpers
│   ├── modules/
│   │   ├── Repo/                          ← Repository-level modules
│   │   │   ├── branches-nav-button.js    ← Branches tab in repo nav (Feature 0)
│   │   │   └── markdown-blob-preview.js  ← Enhanced .md preview toggle (Feature 13)
│   │   └── PR/                            ← All PR-page modules
│   │       ├── Conversation/              ← Conversation-tab features
│   │       │   └── timeline-reorder.js   ← JS timeline reversal (Feature 3)
│   │       ├── File Changes/              ← Files-Changed-tab features
│   │       │   ├── diff-nav-buttons.js   ← Diff hunk navigation buttons (Feature 7)
│   │       │   ├── file-tree-enhancements.js ← Viewed checkboxes + enhanced file click (Feature 6)
│   │       │   ├── split-diff-resizer.js ← Draggable split view separator (Feature 8)
│   │       │   └── markdown-preview.js  ← Side-by-side markdown preview (Feature 11)
│   │       ├── action-buttons-bar/        ← Floating action bar (Feature 1)
│   │       │   ├── github-state.js        ← Reads live PR state (PR Actions + Submit Review)
│   │       │   ├── pr-actions-button.js   ← PR Actions dropdown
│   │       │   ├── review-button.js       ← Submit Review button
│   │       │   └── header-actions.js      ← Assembles the floating bar
│   │       ├── checks-rerun.js           ← Azure pipeline re-run button (Feature 9)
│   │       ├── comment-shortcut.js       ← Remove "Start a review" + Ctrl+Enter (Feature 10)
│   │       └── scroll-top.js             ← Scroll-to-top button (Feature 2)
│   └── content.js                         ← Entry point, lifecycle manager
├── popup/
│   ├── popup.html                         ← Extension settings popup
│   ├── popup.js                           ← Toggle read/write via chrome.storage.sync
│   └── popup.css                          ← Popup styling
├── styles/
│   ├── base.css                           ← Layout + Conversation/Commits/Files tab CSS (Features 2-5)
│   ├── buttons.css                        ← Button & dropdown styling (Feature 1)
│   └── markdown-blob-preview.css          ← Repo markdown file preview styling (Feature 13)
└── icons/                                 ← Extension icons (16/48/128px)
```

### Script Load Order (defined in `manifest.json`)

**Repo pages** (`github.com/*/*`) — first content_scripts entry:
1. `namespace.js` → `settings.js` → `Repo/branches-nav-button.js` → `Repo/markdown-blob-preview.js`

**PR pages** (`github.com/*/pull/*`) — second content_scripts entry (both entries run; `namespace.js` is idempotent):

1. `namespace.js` → `settings.js` → `icons.js` → `utils.js` (core)
2. `PR/action-buttons-bar/github-state.js` (state reader)
3. `PR/checks-rerun.js` → `PR/comment-shortcut.js` → `PR/action-buttons-bar/pr-actions-button.js` → `PR/action-buttons-bar/review-button.js` (action bar modules)
4. `PR/Conversation/timeline-reorder.js` → `PR/scroll-top.js` → `PR/File Changes/diff-nav-buttons.js` → `PR/File Changes/split-diff-resizer.js` → `PR/File Changes/file-tree-enhancements.js` → `PR/File Changes/markdown-preview.js` (PR modules)
5. `PR/action-buttons-bar/header-actions.js` (feature assembly)
6. `content.js` (bootstrap)

CSS (`base.css`, `buttons.css`) is injected before any JS runs.

### Initialization Flow

```
Page loads on github.com/*/pull/*
  ↓
content.js init() verifies URL matches /pull/\d+/
  ↓
PRitty.Settings.load() → awaits chrome.storage.sync
  ↓
inject() → cleans old PRitty elements → appends floating action bar
  ↓
ScrollTop.create() → appends scroll button
  ↓
CommentShortcut.init() + removeStartReviewButtons() [if enabled]
  ↓
MarkdownPreview.enhance() [if enabled]
  ↓
MutationObserver watches document.body
  ├── SPA navigation detected → re-runs inject()
  ├── Discussion container reset → re-applies TimelineReorder
  ├── removeStartReviewButtons() on each tick [if enabled]
  └── MarkdownPreview.enhance() on each tick [if enabled]
```

---

## Styling

| File | Covers |
|------|--------|
| `styles/base.css` | Floating bar layout, scroll button, conversation tab CSS, commits tab CSS, files changed tab CSS |
| `styles/markdown-blob-preview.css` | Repo-level markdown file preview enhancements (Feature 13) |
| `styles/buttons.css` | PR Actions button, Submit Review button, dropdown menu, disabled states |

**Z-index layers:** `999` (action bar) > `100` (dropdown) > `99` (scroll button)
