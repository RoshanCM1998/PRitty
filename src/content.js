/**
 * PRitty — Entry Point
 * Handles injection, re-injection on SPA navigation, and bootstrap.
 */

(function () {
  "use strict";

  const ATTR = PRitty.INJECTED_ATTR;

  /** Inject (or re-inject) all PRitty UI into the page. */
  function inject() {
    // Remove any previous injection
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());

    // Append fixed floating bar directly to body
    document.body.appendChild(PRitty.HeaderActions.createAll());
  }

  /** Initialize PRitty on a PR page. */
  function init() {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;

    // Try immediate injection; MutationObserver retries if targets aren't ready
    inject();

    // Scroll to top button
    PRitty.ScrollTop.create();

    // Re-inject after GitHub's SPA (Turbo) navigation
    const observer = new MutationObserver(() => {
      if (!window.location.pathname.match(/\/pull\/\d+/)) return;

      // Re-inject header actions if removed
      if (!document.querySelector(`[${ATTR}]`)) {
        inject();
      }

      // Re-apply timeline reorder if undone
      const discussion = document.querySelector(".js-discussion");
      if (discussion && !discussion.hasAttribute(PRitty.TimelineReorder.REORDERED_ATTR)) {
        PRitty.TimelineReorder.apply();
      }

      // File tree enhancements (Files Changed tab)
      const fileTree = document.querySelector(PRitty.Selectors.FILE_TREE_SIDEBAR);
      if (fileTree && !fileTree.hasAttribute('data-pritty-tree-enhanced')) {
        PRitty.FileTreeEnhancements.init();
      }

      // Diff navigation buttons (Files Changed tab toolbar)
      const filesToolbar = document.querySelector(PRitty.Selectors.PR_FILES_TOOLBAR);
      if (filesToolbar && !filesToolbar.hasAttribute(PRitty.DiffNav.ENHANCED_ATTR)) {
        PRitty.DiffNav.init();
      }

      // Split diff resizer (Files Changed tab, split view)
      const diffsList = document.querySelector('[data-testid="progressive-diffs-list"]');
      if (diffsList) {
        const isSplit = !!document.querySelector("td.right-side-diff-cell");
        const isEnhanced = diffsList.hasAttribute(PRitty.SplitDiffResizer.ENHANCED_ATTR);
        if (isSplit && !isEnhanced) {
          PRitty.SplitDiffResizer.init();
        } else if (!isSplit && isEnhanced) {
          PRitty.SplitDiffResizer.destroy();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
