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

  // File tree sidebar (Files Changed tab)
  FILE_TREE_SIDEBAR:      '#pr-file-tree',
  FILE_TREE_ROOT:         '#pr-file-tree ul[role="tree"]',
  FILE_TREE_ITEM:         '#pr-file-tree li[role="treeitem"]',
  FILE_TREE_ITEM_CONTENT: '.PRIVATE_TreeView-item-content',

  // Diff containers
  DIFF_FILE_HEADER:       '[class*="DiffFileHeader-module__diff-file-header"]',
  DIFF_EXPAND_ALL_BTN:    '.js-expand-all-difflines-button',
  DIFF_VIEWED_BTN:        'button[class*="MarkAsViewedButton-module"]',
};
