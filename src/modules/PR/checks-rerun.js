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
    const doPost = () => {
      // #issue-comment-box wraps the textarea; try both common selectors
      const textarea =
        document.querySelector('#issue-comment-box textarea') ||
        document.querySelector('#new_comment_field');
      if (!textarea) return;

      textarea.scrollIntoView({ block: 'center' });
      textarea.focus();

      // React-compatible value setter
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      setter.call(textarea, text);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit
      const submitBtn =
        textarea.closest('form')?.querySelector('button[type="submit"]') ||
        document.querySelector('#issue-comment-box button[type="submit"]');
      if (submitBtn) PRitty.Utils.scrollAndClick(submitBtn);
    };

    if (PRitty.GitHubState.getCurrentTab() === 'conversation') {
      doPost();
      return;
    }

    // Switch to Conversation tab first, then post
    const convTab = PRitty.Utils.findTab('Conversation');
    if (!convTab) return;
    convTab.click();

    PRitty.Utils.waitForElement(
      '#issue-comment-box textarea, #new_comment_field'
    ).then(doPost).catch(() => {});
  },
};
