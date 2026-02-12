/**
 * DevHub for GitHub — Namespace & Constants
 * Loaded first. Creates the shared namespace all modules attach to.
 */

window.DevHub = window.DevHub || {};

DevHub.INJECTED_ATTR = "data-devhub-injected";

/** GitHub DOM selectors used across modules */
DevHub.Selectors = {
  // PR header
  PAGE_HEADER: "#partial-discussion-header",
  HEADER_ACTIONS: ".gh-header-actions",
  STATE_LABEL: 'span.State[data-view-component="true"]',

  // Tabs
  TAB: '[role="tab"]',
  SELECTED_TAB: '[role="tab"][aria-selected="true"]',

  // Merge / conflicts
  CONFLICT_INDICATOR: '[class*="conflict"], [aria-label*="conflict"]',
};
