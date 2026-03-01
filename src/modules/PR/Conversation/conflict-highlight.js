/**
 * PRitty — Merge Conflict Highlight
 * Highlights the merge conflict container with a subtle warning background
 * so it stands out from GitHub's default same-color styling.
 */

PRitty.ConflictHighlight = {
  ENHANCED_ATTR: "data-pritty-conflict-highlighted",

  /** Known merge-section containers (ordered most → least specific). */
  _CONTAINER_SELECTORS: [
    '.merge-message',
    '#partial-pull-merging',
    '[class*="MergeBox"]',
    '[class*="merge-status"]',
  ],

  /**
   * Find the merge conflict indicator and highlight its container.
   * Safe to call multiple times — skips if already applied.
   */
  init() {
    if (document.querySelector(`[${this.ENHANCED_ATTR}]`)) return;

    const indicator = document.querySelector(PRitty.Selectors.CONFLICT_INDICATOR);
    if (!indicator) return;

    const container = this._findContainer(indicator);
    if (!container) return;

    container.classList.add('pritty-conflict-highlight');
    container.setAttribute(this.ENHANCED_ATTR, 'true');
  },

  /**
   * Walk up from the conflict indicator to find the merge section container.
   * Tries known selectors first, then falls back to ancestor traversal.
   */
  _findContainer(indicator) {
    // Try known container selectors via closest()
    for (const sel of this._CONTAINER_SELECTORS) {
      const match = indicator.closest(sel);
      if (match) return match;
    }

    // Fallback: walk up to find a reasonable container
    // (a block-level element with substantial height)
    let el = indicator.parentElement;
    for (let i = 0; i < 8 && el && el !== document.body; i++) {
      const tag = el.tagName;
      if ((tag === 'DIV' || tag === 'SECTION') && el.offsetHeight > 50) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  },
};
