# PRitty — Documentation

**Version:** 1.1.0 | **Type:** Chrome/Edge Browser Extension (Manifest V3)

PRitty brings Azure DevOps-style pull request experience to GitHub — quick actions, reversed timelines, and streamlined navigation.

**Activates on:** `https://github.com/*/pull/*` (PR pages only)

---

## Features

| # | Feature | Code Location | Docs |
|---|---------|--------------|------|
| 1 | [**Action Buttons Bar**](#1-action-buttons-bar) | `src/features/action-buttons-bar/` | [action-buttons-bar.md](./action-buttons-bar.md) |
| 2 | [**Scroll to Top**](#2-scroll-to-top-button) | `src/modules/scroll-top.js`, `styles/base.css` | [scroll-to-top.md](./scroll-to-top.md) |
| 3 | [**Conversation Tab Changes**](#3-conversation-tab-changes) | `src/modules/timeline-reorder.js`, `styles/base.css` | [conversation-tab.md](./conversation-tab.md) |
| 4 | [**Commits Tab Changes**](#4-commits-tab-changes) | `styles/base.css` | Inline below |
| 5 | [**Files Changed Tab Changes**](#5-files-changed-tab-changes) | `styles/base.css` | Inline below |
| 6 | [**File Tree Enhancements**](#6-file-tree-enhancements) | `src/features/file-tree-enhancements/` | [file-tree-enhancements.md](./file-tree-enhancements.md) |
| — | [**Core Infrastructure**](#core-infrastructure) | `src/core/`, `src/modules/github-state.js`, `src/content.js` | [core-infrastructure.md](./core-infrastructure.md) |

---

### 1. Action Buttons Bar

A floating bar fixed to the **top-right corner** of the page containing two buttons:

- **PR Actions** (green) — context-aware dropdown with merge, publish, or convert-to-draft actions depending on PR state
- **Submit Review** (blue) — navigates to Files Changed tab and opens the native review dialog

**Code:** `src/features/action-buttons-bar/` (dedicated folder)
- `pr-actions-button.js` — PR Actions dropdown button + context-aware actions
- `review-button.js` — Submit Review button + tab switching logic
- `header-actions.js` — assembles both buttons into the floating bar container

**Styling:** `styles/buttons.css`, `styles/base.css` (`.pritty-actions` container)

**Detailed docs:** [action-buttons-bar.md](./action-buttons-bar.md)

---

### 2. Scroll to Top Button

A circular floating button fixed to the **bottom-right corner**. Clicking it smooth-scrolls the page to the top. Starts at 60% opacity, fully visible on hover.

**Code:** `src/modules/scroll-top.js`, `styles/base.css`

**Detailed docs:** [scroll-to-top.md](./scroll-to-top.md)

---

### 3. Conversation Tab Changes

Multiple enhancements to the PR conversation tab:

- **Timeline reordering** — newest comments appear first (CSS `column-reverse` handles reversal; JS only moves PR description to top)
- **Hidden noise elements** — labels_updated, projects_updated, milestone_updated timeline badges are hidden
- **Comment box cleanup** — GitHub's suggestion/guideline boxes below the comment input are hidden
- **Merge actions repositioning** — merge area and comment box get `margin-left: -56px` adjustment
- **Reviewer name magnification** — reviewer names displayed at `1.25rem` font size

**Code:** `src/modules/timeline-reorder.js`, `styles/base.css` (Conversation Tab section)

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

**Code:** `src/features/file-tree-enhancements/file-tree-enhancements.js`, `styles/base.css`

**Detailed docs:** [file-tree-enhancements.md](./file-tree-enhancements.md)

---

## Core Infrastructure

Shared modules that all features depend on. Full details in [core-infrastructure.md](./core-infrastructure.md).

| Module | File | Purpose |
|--------|------|---------|
| Namespace | `src/core/namespace.js` | Creates `window.PRitty` global + `PRitty.Selectors` (GitHub DOM selectors) |
| Icons | `src/core/icons.js` | SVG icon strings (`merge`, `review`, `check`, `x`, `pending`) |
| Utils | `src/core/utils.js` | DOM helpers: `waitForElement`, `findTab`, `findButtonByText`, `findButtonByPrefix`, `isPRittyElement` |
| GitHub State | `src/modules/github-state.js` | Reads live PR state: `getChecksInfo()`, `getPRState()`, `getCurrentTab()` |
| Entry Point | `src/content.js` | Bootstraps everything, handles SPA re-injection via MutationObserver |

---

## Project Structure

```
manifest.json                          ← Extension config, load order, URL matching
├── src/
│   ├── core/
│   │   ├── namespace.js               ← Global PRitty namespace + DOM selectors
│   │   ├── icons.js                   ← SVG icon library
│   │   └── utils.js                   ← Shared DOM helpers
│   ├── modules/
│   │   ├── github-state.js            ← Reads PR state from GitHub DOM
│   │   ├── timeline-reorder.js        ← JS timeline reversal (Feature 3)
│   │   └── scroll-top.js             ← Scroll-to-top button (Feature 2)
│   ├── features/
│   │   ├── action-buttons-bar/        ← Feature 1 (dedicated folder)
│   │   │   ├── pr-actions-button.js   ← PR Actions dropdown
│   │   │   ├── review-button.js       ← Submit Review button
│   │   │   └── header-actions.js      ← Assembles the floating bar
│   │   └── file-tree-enhancements/    ← Feature 6 (dedicated folder)
│   │       └── file-tree-enhancements.js ← Viewed checkboxes + enhanced file click
│   └── content.js                     ← Entry point, lifecycle manager
├── styles/
│   ├── base.css                       ← Layout + Conversation/Commits/Files tab CSS (Features 2-5)
│   └── buttons.css                    ← Button & dropdown styling (Feature 1)
└── icons/                             ← Extension icons (16/48/128px)
```

### Script Load Order (defined in `manifest.json`)

Injected at `document_idle` in this exact sequence:

1. `namespace.js` → `icons.js` → `utils.js` (core)
2. `github-state.js` (state reader)
3. `pr-actions-button.js` → `review-button.js` (action bar modules)
4. `timeline-reorder.js` → `scroll-top.js` (other modules)
5. `file-tree-enhancements.js` (file tree features)
6. `header-actions.js` (feature assembly)
7. `content.js` (bootstrap)

CSS (`base.css`, `buttons.css`) is injected before any JS runs.

### Initialization Flow

```
Page loads on github.com/*/pull/*
  ↓
content.js init() verifies URL matches /pull/\d+/
  ↓
inject() → cleans old PRitty elements → appends floating action bar
  ↓
ScrollTop.create() → appends scroll button
  ↓
MutationObserver watches document.body
  ├── SPA navigation detected → re-runs inject()
  └── Discussion container reset → re-applies TimelineReorder
```

---

## Styling

| File | Covers |
|------|--------|
| `styles/base.css` | Floating bar layout, scroll button, conversation tab CSS, commits tab CSS, files changed tab CSS |
| `styles/buttons.css` | PR Actions button, Submit Review button, dropdown menu, disabled states |

**Z-index layers:** `999` (action bar) > `100` (dropdown) > `99` (scroll button)
