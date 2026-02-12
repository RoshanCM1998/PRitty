# File Tree Enhancements

**File:** `src/features/file-tree-enhancements/file-tree-enhancements.js`
**CSS:** `styles/base.css` (File Tree Enhancements section)
**Tab:** Files Changed

Two enhancements for the file tree sidebar in the Files Changed tab:

1. **Viewed Checkboxes** — checkboxes in the tree that sync bidirectionally with GitHub's native "Viewed" buttons
2. **Enhanced File Click** — clicking a file auto-expands collapsed diffs and reveals full content

---

## Feature 1: Viewed Checkboxes

### How It Works

**Zero custom state** — GitHub is the single source of truth. No internal checked/unchecked map is maintained.

#### Initial Load

1. Parse GitHub's embedded JSON from `script[data-target="react-app.embeddedData"]`
2. Extract `diffSummaries` array → build a `Map<filePath, boolean>` from `{ path, markedAsViewed }`
3. Use this map to set all checkboxes on first render (avoids N individual DOM queries)

#### Checkbox Injection

For each `li[role="treeitem"]` in the file tree, a small checkbox (`.devhub-tree-checkbox`) is inserted before the file/folder icon inside `.PRIVATE_TreeView-item-content`.

#### File Checkbox Behavior

- **On inject:** Look up `viewedMap.get(filePath)` → set checkbox checked state
- **On click:** Find the matching diff's native Viewed button → call `.click()` on it → update checkbox
- **Matching logic:** Tree item → `_getFilePathFromTreeItem()` → find diff via `js-expand-all-difflines-button[data-file-path]` → traverse up to diff container

#### Folder Checkbox Behavior

- **Checked** = all descendant files are viewed
- **Indeterminate** = some descendant files are viewed
- **Unchecked** = no descendant files are viewed
- **On click:** If not all checked → click native Viewed on all unchecked descendants; if all checked → uncheck all

#### Right-to-Left Sync (native Viewed button → tree checkbox)

A `MutationObserver` on the diff content area watches for `aria-pressed` attribute changes — extremely lightweight, browser only fires on Viewed button toggles. On change → find matching tree checkbox → update it → recalculate parent folder state.

#### Dynamic Tree Items

A secondary `MutationObserver` on the file tree root watches for new `li[role="treeitem"]` nodes and injects checkboxes into them automatically.

### Performance

- No polling, no intervals, no custom state store
- Init: 1 JSON parse + 1 loop over files
- Ongoing: event-driven only (MutationObserver + click handlers)
- Folder calc: on-demand, not continuous

---

## Feature 2: Enhanced File Click

### How It Works

A single delegated event listener on the file tree root `ul[role="tree"]`.

On file link click (skips folders and checkbox clicks):

1. **Let native scroll behavior happen** (no `preventDefault`)
2. Find the matching diff container
3. **Expand collapsed diff:** Check if header has `collapsed` class → click the toggle button
4. **Expand all lines:** After 300ms delay (for render), click the `js-expand-all-difflines-button`

---

## DOM Selectors Used

All defined in `DevHub.Selectors` (`src/core/namespace.js`):

| Selector Constant | Value | Purpose |
|---|---|---|
| `FILE_TREE_SIDEBAR` | `#pr-file-tree` | File tree container |
| `FILE_TREE_ROOT` | `#pr-file-tree ul[role="tree"]` | Tree root for event delegation |
| `FILE_TREE_ITEM` | `#pr-file-tree li[role="treeitem"]` | Individual tree items |
| `FILE_TREE_ITEM_CONTENT` | `.PRIVATE_TreeView-item-content` | Content area within tree item |
| `DIFF_FILE_HEADER` | `[class*="DiffFileHeader-module__diff-file-header"]` | Diff file header |
| `DIFF_EXPAND_ALL_BTN` | `.js-expand-all-difflines-button` | Expand all lines button |
| `DIFF_VIEWED_BTN` | `button[class*="MarkAsViewedButton-module"]` | Native "Viewed" toggle button |

---

## CSS Classes

| Class | Element | Purpose |
|---|---|---|
| `.devhub-tree-checkbox` | `<input type="checkbox">` | Viewed checkbox in tree items |

---

## Module API

```js
DevHub.FileTreeEnhancements.init()    // Inject checkboxes, start observers, set up click handler
DevHub.FileTreeEnhancements.destroy() // Remove checkboxes, disconnect observers
```

Both are idempotent. `init()` uses a `data-devhub-tree-enhanced` attribute on `#pr-file-tree` to prevent double initialization.

---

## Integration

- **content.js:** MutationObserver checks for `#pr-file-tree` appearing and calls `init()` if not already enhanced
- **SPA navigation:** Re-detected by MutationObserver when the file tree DOM reappears
- **manifest.json:** Loaded after `scroll-top.js`, before `header-actions.js`
