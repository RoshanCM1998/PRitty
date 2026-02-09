/**
 * DevHub for GitHub — Entry Point
 * Handles injection, re-injection on SPA navigation, and bootstrap.
 */

(function () {
  "use strict";

  const ATTR = DevHub.INJECTED_ATTR;
  const SEL = DevHub.Selectors;

  /** Inject (or re-inject) all DevHub UI into the page. */
  function inject() {
    // Remove any previous injection
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());

    // Primary target: the PR header actions bar
    const actionsArea = document.querySelector(SEL.HEADER_ACTIONS);
    if (actionsArea) {
      actionsArea.insertBefore(
        DevHub.HeaderActions.createAll(),
        actionsArea.firstChild
      );
      return;
    }

    // Fallback: append to the page header itself
    const pageHeader = document.querySelector(SEL.PAGE_HEADER);
    if (pageHeader) {
      pageHeader.appendChild(DevHub.HeaderActions.createAll());
    }
  }

  /** Initialize DevHub on a PR page. */
  function init() {
    if (!window.location.pathname.match(/\/pull\/\d+/)) return;

    DevHub.Utils
      .waitForElement(`${SEL.HEADER_ACTIONS}, ${SEL.PAGE_HEADER}`)
      .then(() => inject())
      .catch((err) => console.warn("[DevHub]", err.message));

    // Re-inject after GitHub's SPA (Turbo) navigation
    const observer = new MutationObserver(() => {
      if (!window.location.pathname.match(/\/pull\/\d+/)) return;
      if (document.querySelector(`[${ATTR}]`)) return;

      const target =
        document.querySelector(SEL.HEADER_ACTIONS) ||
        document.querySelector(SEL.PAGE_HEADER);
      if (target) inject();
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
