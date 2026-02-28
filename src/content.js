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

    if (PRitty.Settings.get('showActionBar')) {
      document.body.appendChild(PRitty.HeaderActions.createAll());
    }
  }

  /** Initialize PRitty on a PR page. */
  async function init() {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;

    // Load user settings before any feature checks
    await PRitty.Settings.load();

    // Apply body class for conditional CSS (metadata events visibility)
    if (PRitty.Settings.get('showConvActivity')) {
      document.body.classList.add('pritty-show-conv-activity');
    }

    // Try immediate injection; MutationObserver retries if targets aren't ready
    inject();

    // Scroll to top button
    PRitty.ScrollTop.create();

    // Comment shortcut: remove "Start a review" + Ctrl+Enter direct post
    if (PRitty.Settings.get('commentShortcut')) {
      PRitty.CommentShortcut.init();
      PRitty.CommentShortcut.removeStartReviewButtons();
    }

    // Side-by-side markdown preview
    if (PRitty.Settings.get('sideBySidePreview')) {
      PRitty.MarkdownPreview.enhance();
    }

    // Re-inject after GitHub's SPA (Turbo) navigation
    let _rafId = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(() => {
        if (!window.location.pathname.match(/\/pull\/\d+/)) return;

        // Re-inject header actions if removed
        if (!document.querySelector(`[${ATTR}]`) && PRitty.Settings.get('showActionBar')) {
          inject();
        }

        // Re-apply timeline reorder if undone
        const discussion = document.querySelector(".js-discussion");
        if (discussion && !discussion.hasAttribute(PRitty.TimelineReorder.REORDERED_ATTR)) {
          if (PRitty.Settings.get('convSorting')) {
            PRitty.TimelineReorder.apply();
          } else {
            discussion.setAttribute(PRitty.TimelineReorder.REORDERED_ATTR, 'skipped');
          }
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

        // Azure build re-run buttons (checks expanded list)
        PRitty.ChecksRerun.init();

        // Remove "Start a review" buttons whenever GitHub re-renders inline forms
        if (PRitty.Settings.get('commentShortcut')) {
          PRitty.CommentShortcut.removeStartReviewButtons();
        }

        // Side-by-side markdown preview for newly rendered comment forms
        if (PRitty.Settings.get('sideBySidePreview')) {
          PRitty.MarkdownPreview.enhance();
        }
      });
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
