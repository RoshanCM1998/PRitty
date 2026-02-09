/**
 * DevHub for GitHub — Namespace & Constants
 * Loaded first. Creates the shared namespace all modules attach to.
 */

window.DevHub = window.DevHub || {};

DevHub.INJECTED_ATTR = "data-devhub-injected";

/** GitHub DOM selectors used across modules */
DevHub.Selectors = {
  // PR header
  PAGE_HEADER: ".prc-PageHeader-PageHeader-YLwBQ",
  HEADER_ACTIONS: '[data-component="PH_Actions"]',
  STATE_LABEL: ".prc-StateLabel-StateLabel-Iawzp",

  // Tabs
  TAB: '[role="tab"]',
  SELECTED_TAB: '[role="tab"][aria-selected="true"]',

  // Merge / conflicts
  CONFLICT_INDICATOR: '[class*="conflict"], [aria-label*="conflict"]',
};
