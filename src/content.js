/**
 * DevHub for GitHub — Entry Point
 * Handles injection, re-injection on SPA navigation, and bootstrap.
 */

(function () {
  "use strict";

  const ATTR = DevHub.INJECTED_ATTR;

  /** Inject (or re-inject) all DevHub UI into the page. */
  function inject() {
    // Remove any previous injection
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());

    // Append fixed floating bar directly to body
    document.body.appendChild(DevHub.HeaderActions.createAll());
  }

  /** Initialize DevHub on a PR page. */
  function init() {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;

    // Try immediate injection; MutationObserver retries if targets aren't ready
    inject();

    // Scroll to top button
    DevHub.ScrollTop.create();

    // Re-inject after GitHub's SPA (Turbo) navigation
    const observer = new MutationObserver(() => {
      if (!window.location.pathname.match(/\/pull\/\d+/)) return;

      // Re-inject header actions if removed
      if (!document.querySelector(`[${ATTR}]`)) {
        inject();
      }

      // Re-apply timeline reorder if undone
      const discussion = document.querySelector(".js-discussion");
      if (discussion && !discussion.hasAttribute(DevHub.TimelineReorder.REORDERED_ATTR)) {
        DevHub.TimelineReorder.apply();
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
