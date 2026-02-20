# Split Diff Resizer

Adds a draggable vertical separator between the left (old code) and right (new code) panes in GitHub PR split view — matching the Azure DevOps experience.

---

## Behaviour

- **Drag** the vertical handle to resize left/right panes. All visible diff tables resize simultaneously to the same ratio.
- **Double-click** the handle to reset to 50/50.
- The ratio is preserved as you scroll, and lazily-loaded diff tables are pre-resized at the current ratio.
- Resizing the browser window maintains the ratio.
- Switching to unified view removes all handles and resets column widths. Switching back to split view re-injects them.

---

## DOM Structure Targeted

```
div[role="region"][id^="diff-"]         ← file diff container
  div.border.position-relative          ← table wrapper (position:relative, handle injected here)
    table[role="grid"]                  ← diff table (table-layout: fixed)
      colgroup
        col width="44"                  ← left line numbers (fixed, untouched)
        col                             ← LEFT code col  ← width set by resizer
        col width="44"                  ← right line numbers (fixed, untouched)
        col                             ← RIGHT code col ← width set by resizer
```

**Split view detection:** `td.right-side-diff-cell` exists only in split view.

**Resizing math:**
- `codeWidth = table.offsetWidth - 88` (total minus both 44px line-number cols)
- `leftPx = clamp(MIN_CODE_PX, codeWidth - MIN_CODE_PX, round(codeWidth × ratio))`
- `cols[1].style.width = leftPx + 'px'`
- `cols[3].style.width = (codeWidth - leftPx) + 'px'`

---

## Handle Injection

One `div.pritty-split-handle` is injected per diff table, as a child of `table.parentElement` (the `div.border.position-relative` wrapper, which is already `position: relative`).

The handle contains a single `div.pritty-split-handle-line` (a 2px wide bar) that becomes visible on hover or during drag.

Handle `left` position = `44 + leftColWidth` px (left line-number col width + left code col width).

---

## Observers

| Observer | Target | Purpose |
|----------|--------|---------|
| `MutationObserver` | `[data-testid="progressive-diffs-list"]` | Inject handles into lazily-loaded diff tables |
| `ResizeObserver` | `[data-testid="progressive-diffs-list"]` | Reapply ratio when layout/window size changes |

---

## Lifecycle

`init()` is called from `content.js` MutationObserver when:
- `[data-testid="progressive-diffs-list"]` is present
- `td.right-side-diff-cell` exists (split view active)
- `ENHANCED_ATTR` is not yet set

`destroy()` is called when:
- `td.right-side-diff-cell` disappears (unified view activated)
- `ENHANCED_ATTR` is set (was previously enhanced)

---

## Code

**Module:** `src/modules/split-diff-resizer.js`
**CSS:** `styles/base.css` — `/* === Split Diff Resizer === */` section
**Entry point wiring:** `src/content.js` MutationObserver callback

---

## CSS Classes

| Class | Element | Purpose |
|-------|---------|---------|
| `pritty-split-handle` | `div` inside wrapper | Invisible 12px-wide hit area, positioned absolute |
| `pritty-split-handle-line` | `div` inside handle | 2px visible line, shown on hover/drag |
| `pritty-dragging` | added to handle during drag | Keeps line visible while dragging |
