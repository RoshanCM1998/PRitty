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

  // Tabs (two selectors: Primer React role="tab" on Files Changed, ViewComponent a.tabnav-tab on other tabs)
  TAB: 'nav[aria-label*="Pull request"] [role="tab"], nav[aria-label*="Pull request"] a.tabnav-tab',
  SELECTED_TAB: 'nav[aria-label*="Pull request"] [role="tab"][aria-selected="true"], nav[aria-label*="Pull request"] a.tabnav-tab.selected',

  // Merge / conflicts
  CONFLICT_INDICATOR: '[class*="conflict"], [aria-label*="conflict"]',
};
