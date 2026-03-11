/**
 * PRitty — Comment Shortcut
 * Controlled by the `commentShortcut` setting (toggle in popup).
 *
 * - Removes "Start a review" buttons from inline diff comment forms so
 *   they never appear in the UI.
 * - Intercepts Ctrl+Enter in any PR comment textarea and clicks the
 *   direct-comment button ("Reply" / "Add single comment" / "Comment"),
 *   bypassing GitHub's native handler that would activate "Start a review".
 *
 * GitHub DOM notes (verified against live Primer React rendering):
 * - Action buttons are type="button", NOT type="submit"
 * - Comment form is NOT a <form> — container is [class*="MarkdownEditor-module__container"]
 * - GitHub renders two copies of each button: one with aria-hidden="true" (ghost for layout)
 *   and one visible. We must exclude the aria-hidden copies.
 */

PRitty.CommentShortcut = {
  _initialized: false,

  /** Call once on page load. Sets up the document-level keydown listener. */
  init() {
    if (this._initialized) return;
    this._initialized = true;
    // Capture phase fires before GitHub's own bubble-phase handlers.
    document.addEventListener('keydown', this._onKeydown.bind(this), true);
  },

  /**
   * Remove all visible "Start a review" buttons from the DOM.
   * Called on every MutationObserver tick so inline forms are cleaned up
   * as soon as GitHub renders them.
   */
  removeStartReviewButtons() {
    const containers = document.querySelectorAll('[class*="MarkdownEditor-module__container"]');
    containers.forEach(c => {
      c.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() === 'Start a review' &&
            btn.getAttribute('aria-hidden') !== 'true') {
          btn.remove();
        }
      });
    });
  },

  _onKeydown(e) {
    if (!e.ctrlKey || e.key !== 'Enter') return;
    if (e.target.tagName !== 'TEXTAREA') return;

    // GitHub comment forms are not <form> elements — scope to the MarkdownEditor container
    const container = e.target.closest('[class*="MarkdownEditor-module__container"]');
    if (!container) return;

    const btn = this._findDirectCommentBtn(container);
    if (!btn || btn.disabled) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    btn.click();
  },

  /**
   * Find the direct-comment button within the MarkdownEditor container, in priority order.
   * "Start a review" is intentionally excluded.
   * Excludes aria-hidden="true" ghost copies GitHub renders for layout purposes.
   * @param {HTMLElement} container
   * @returns {HTMLButtonElement|null}
   */
  _findDirectCommentBtn(container) {
    const btns = Array.from(container.querySelectorAll('button'))
      .filter(b => b.getAttribute('aria-hidden') !== 'true');
    return (
      btns.find(b => b.textContent.trim() === 'Reply') ||
      btns.find(b => b.textContent.trim() === 'Add single comment') ||
      btns.find(b => b.textContent.trim() === 'Comment') ||
      null
    );
  },
};
