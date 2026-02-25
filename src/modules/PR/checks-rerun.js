/**
 * PRitty — Azure Checks Re-Run Button
 * Injects a re-run button on Azure Pipeline check rows in the expanded checks list.
 * Clicking the button posts `/azp run <pipeline_name>` as a PR comment.
 */

PRitty.ChecksRerun = {

  /**
   * Scan all check rows in the expanded checks list.
   * Inject a re-run button on any row whose title links to Azure Pipelines.
   */
  init() {
    document.querySelectorAll('li[class*="ListItem-module__listItem"]').forEach(row => {
      // Only Azure pipelines: href must contain visualstudio.com or dev.azure.com
      const titleAnchor = row.querySelector(
        'h4 a[href*="visualstudio.com"], h4 a[href*="dev.azure.com"]'
      );
      if (!titleAnchor) return;

      const actionBar = row.querySelector('[class*="ActionBar-module__container"]');
      if (!actionBar) return;

      // Skip if already injected (button presence is the source of truth)
      if (actionBar.querySelector('.pritty-rerun-btn')) return;

      const pipelineName = titleAnchor.querySelector('span')?.textContent?.trim();
      if (!pipelineName) return;

      actionBar.insertAdjacentElement('afterbegin', this._createBtn(pipelineName));
    });
  },

  _createBtn(pipelineName) {
    const btn = document.createElement('button');
    // Note: NOT using data-pritty-injected — these buttons live inside GitHub's own DOM
    // and checking button presence (.pritty-rerun-btn) prevents double-injection.
    // Using data-pritty-injected would cause inject() to remove them while leaving
    // the row's enhanced marker stale, breaking re-injection.
    btn.className = 'pritty-rerun-btn';
    btn.title = `/azp run ${pipelineName}`;
    btn.innerHTML = PRitty.Icons.rerun;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      this._postComment(`/azp run ${pipelineName}`);
    });
    return btn;
  },

  _postComment(text) {
    const textarea = document.querySelector(
      '#issue-comment-box textarea, #new_comment_field'
    );

    if (textarea) {
      this._fillAndSubmit(textarea, text);
      return;
    }

    // Fallback: textarea not yet in DOM — switch to Conversation tab and wait
    const convTab = PRitty.Utils.findTab('Conversation');
    if (!convTab) return;
    convTab.click();
    const obs = new MutationObserver(() => {
      const ta = document.querySelector(
        '#issue-comment-box textarea, #new_comment_field'
      );
      if (ta) {
        obs.disconnect();
        this._fillAndSubmit(ta, text);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 10000);
  },

  _fillAndSubmit(textarea, text) {
    // Focus without scrolling — required for execCommand to target this element
    textarea.focus({ preventScroll: true });
    textarea.select(); // clear any existing content before inserting

    // execCommand goes through the browser's native input pipeline,
    // which React hooks into — this enables the "Comment" submit button.
    // Falls back to native setter + input event if execCommand is unavailable.
    if (!document.execCommand('insertText', false, text)) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      setter.call(textarea, text);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // One animation frame lets React re-render (enables the submit button)
    // before we click. No visible scroll — preventScroll above keeps page still.
    requestAnimationFrame(() => {
      const form = textarea.closest('form');
      // data-variant="primary" is GitHub's Primer attribute for the primary action button.
      // Text match on "Comment" excludes "Close and comment" (exact trim).
      const submitBtn =
        form?.querySelector('button[type="submit"][data-variant="primary"]') ||
        Array.from(form?.querySelectorAll('button[type="submit"]') ?? [])
          .find(b => b.textContent.trim() === 'Comment');
      if (submitBtn && !submitBtn.disabled) submitBtn.click();
    });
  },
};
