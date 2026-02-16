# Conversation Tab Changes

**Files:** `src/modules/timeline-reorder.js`, `styles/base.css` (Conversation Tab section)

## What It Does

Multiple enhancements to the PR conversation tab to match Azure DevOps-style experience:

1. **Timeline reordering** — newest comments/events appear first
2. **Section ordering** — PR body at top, merge box second, comment box third, timeline last
3. **Hidden noise elements** — labels, milestones, and project update badges removed
4. **Comment box cleanup** — GitHub suggestion/guideline boxes hidden
5. **Reviewer name magnification** — reviewer names at larger font size

---

## 1. Timeline & Section Reordering

### Architecture: Hybrid (JS detection + CSS layout)

JS detects the DOM version (old vs new), finds containers using stable selectors, and injects `pritty-*` CSS classes. CSS then handles all layout via `flex`, `order`, and `column-reverse`. This decouples styling from GitHub's volatile DOM structure.

### DOM Versions

**New DOM (2025+):**
```
.pull-discussion-timeline                    ← outer, gets .pritty-conv-outer
  .js-discussion                             ← timeline, gets .pritty-conv-timeline (order: 10)
    rails-partial (display: contents)
      .js-command-palette-pull-body           ← PR body (moved out by JS, gets .pritty-pr-body, order: -10)
      .js-timeline-item (many)               ← reversed by column-reverse
      .discussion-timeline-actions            ← EMPTY in new DOM
  div.tmp-ml-md-6... (merge box)             ← order: 0 (default)
  rails-partial (display: contents)
    #issue-comment-box                       ← order: 0 (default)
```

**Old DOM (legacy fallback):**
```
#discussion_bucket
  .Layout-main
    > div                                    ← gets .pritty-conv-outer-legacy (column-reverse)
      .js-discussion                         ← gets .pritty-conv-timeline (column-reverse)
        .js-command-palette-pull-body         ← moved to .discussion-timeline-actions by JS
        .js-timeline-item (many)
      .discussion-timeline-actions            ← has children (merge box + comment box)
```

### CSS Approach (in `base.css`)

**New DOM:** Uses `flex-direction: column` + `order` properties on the outer container to position sections. Timeline gets `order: 10` (bottom), PR body gets `order: -10` (top), merge/comment box keep default `order: 0`.

```css
.pritty-conv-outer {
  display: flex;
  flex-direction: column;
}
.pritty-pr-body { order: -10; }
.pritty-conv-timeline {
  order: 10;
  display: flex;
  flex-direction: column-reverse;
}
```

**Old DOM:** Uses `column-reverse` on both outer and inner containers (legacy behavior).

```css
.pritty-conv-outer-legacy {
  display: flex;
  flex-direction: column-reverse;
}
```

### JS Approach (`src/modules/timeline-reorder.js`)

**Module:** `PRitty.TimelineReorder`

```js
PRitty.TimelineReorder = {
  REORDERED_ATTR: "data-pritty-reordered",

  apply() {
    // 1. Find .js-discussion, skip if already reordered
    // 2. Detect DOM version (new: .pull-discussion-timeline exists, .discussion-timeline-actions empty)
    // 3. Apply CSS classes to outer container and timeline
    // 4. Move PR body:
    //    - New DOM: insert before .js-discussion in outer (order: -10 floats to top)
    //    - Old DOM: prepend to .discussion-timeline-actions
    // 5. Mark with data-pritty-reordered="true"
  }
};
```

Only **1 DOM mutation** (moving PR body). All other ordering handled by CSS.

**Re-application:** The MutationObserver in `content.js` watches for `.js-discussion` losing its `data-pritty-reordered` attribute and re-applies.

### Key DOM Targets

| Selector | Element | Stability |
|----------|---------|-----------|
| `.pull-discussion-timeline` | Outer container (new DOM) | Stable (behavior class) |
| `.js-discussion` | Timeline container | Stable (behavior class) |
| `.js-command-palette-pull-body` | PR description body | Stable (behavior class) |
| `#issue-comment-box` | Comment input area | Stable (ID) |
| `.discussion-timeline-actions` | Legacy merge/comment container (empty in new DOM) | Stable but role changed |
| `[class*="prc-PageLayout-ContentWrapper"]` | Page layout wrapper | Uses attribute-contains to survive hash changes |

---

## 2. Hidden Noise Elements (in `base.css`)

Timeline badges for labels, milestones, and project updates are hidden:

```css
[data-channel-event-name="labels_updated"],
[data-channel-event-name="projects_updated"],
[data-channel-event-name="milestone_updated"] {
  display: none !important;
}
```

---

## 3. Comment Box Cleanup (in `base.css`)

GitHub shows suggestion and guideline boxes below the comment input. These are hidden:

```css
#issue-comment-box > div > div:nth-last-child(1),
#issue-comment-box > div > div:nth-last-child(2) {
  display: none !important;
}
```

---

## 4. Reviewer Name Magnification (in `base.css`)

```css
[data-channel-event-name="reviewers_updated"] > form > span {
  font-size: 1.25rem !important;
}
```

---

## Dependencies

- `PRitty.Selectors.CONV_*` — centralized selectors in `src/core/namespace.js`
- `PRitty.TimelineReorder.REORDERED_ATTR` — used by `content.js` MutationObserver
- No dependency on other PRitty modules
