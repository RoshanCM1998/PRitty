/**
 * PRitty — File Tree Enhancements
 *
 * Two features for the Files Changed tab:
 * 1. Viewed checkboxes in the file tree sidebar (bidirectional sync with native Viewed buttons)
 * 2. Enhanced file click — auto-expands collapsed diffs and reveals full file content
 *
 * Zero custom state — GitHub's embedded JSON and native buttons are the single source of truth.
 */

PRitty.FileTreeEnhancements = (() => {
  const SEL = PRitty.Selectors;
  const ENHANCED_ATTR = "data-pritty-tree-enhanced";
  const CHECKBOX_CLASS = "pritty-tree-checkbox";

  /** @type {MutationObserver|null} */
  let _diffObserver = null;
  /** @type {MutationObserver|null} */
  let _treeObserver = null;

  // ─── Helpers ────────────────────────────────────────────────

  /**
   * Parse GitHub's embedded JSON to build a Map<filePath, boolean> of viewed state.
   * Falls back to an empty map if the data isn't available.
   */
  function _parseViewedMap() {
    const map = new Map();
    try {
      const scriptEl = document.querySelector(
        'script[data-target="react-app.embeddedData"]'
      );
      if (!scriptEl) return map;
      const data = JSON.parse(scriptEl.textContent);

      // Navigate to diffSummaries — path may vary by GitHub version
      const payload = data?.payload;
      const summaries =
        payload?.pullRequestsChangesRoute?.diffSummaries ||
        payload?.diffSummaries ||
        payload?.comparison?.diffSummaries ||
        [];

      for (const entry of summaries) {
        if (entry.path != null) {
          map.set(entry.path, !!entry.markedAsViewed);
        }
      }
    } catch {
      // Silently fall back to empty map
    }
    return map;
  }

  /**
   * Get the file path from a tree item's id attribute.
   * GitHub sets id="file-tree-item-diff-<hash>" but the actual path
   * is stored in the nested link or can be derived from the item.
   */
  function _getFilePathFromTreeItem(treeItem) {
    // The tree item's id often encodes the file path in a diff hash.
    // The actual path is in a tooltip or the text content of the link.
    // Most reliable: look for a link with a tooltip/title or the visible text.
    const link = treeItem.querySelector("a[href], [role='link']");
    if (link) {
      const title = link.getAttribute("title");
      if (title) return title;
    }

    // Fallback: use the tree item's id — GitHub sets this as the file path
    // for items like id="some/path/file.ts" or similar
    const id = treeItem.getAttribute("id");
    if (id) return id;

    // Last resort: visible text
    const content = treeItem.querySelector(SEL.FILE_TREE_ITEM_CONTENT);
    return content ? content.textContent.trim() : null;
  }

  /**
   * Find the diff container for a given file path.
   * Strategy: find the expand-all button with matching data-file-path,
   * then traverse up to the diff container.
   */
  function _findDiffForPath(filePath) {
    if (!filePath) return null;

    // Try expand-all button with data-file-path
    const expandBtn = document.querySelector(
      `${SEL.DIFF_EXPAND_ALL_BTN}[data-file-path="${CSS.escape(filePath)}"]`
    );
    if (expandBtn) return expandBtn.closest("div[id^='diff-']");

    // Fallback: search diff headers for matching file path text
    const headers = document.querySelectorAll(SEL.DIFF_FILE_HEADER);
    for (const header of headers) {
      if (header.textContent.includes(filePath)) {
        return header.closest("copilot-diff-entry, div[id^='diff-']") || header.parentElement;
      }
    }

    // Fallback: find by anchor link matching the tree item id
    const anchor = document.getElementById(filePath);
    if (anchor) return anchor.closest("copilot-diff-entry, div[id^='diff-']") || anchor.parentElement;

    return null;
  }

  /**
   * Find the native "Viewed" button inside a diff container.
   */
  function _findViewedBtn(diffContainer) {
    if (!diffContainer) return null;
    return diffContainer.querySelector(SEL.DIFF_VIEWED_BTN);
  }

  /**
   * Check if a native Viewed button is currently in "viewed" state.
   */
  function _isViewedBtnPressed(btn) {
    if (!btn) return false;
    return btn.getAttribute("aria-pressed") === "true";
  }

  /**
   * Check if a tree item represents a folder (has aria-expanded attribute).
   */
  function _isFolder(treeItem) {
    return treeItem.hasAttribute("aria-expanded");
  }

  // ─── Feature 1: Viewed Checkboxes ──────────────────────────

  /**
   * Inject a checkbox into a single tree item.
   */
  function _injectCheckbox(treeItem, viewedMap) {
    // Skip if already has a checkbox
    if (treeItem.querySelector(`.${CHECKBOX_CLASS}`)) return;

    const content = treeItem.querySelector(SEL.FILE_TREE_ITEM_CONTENT);
    if (!content) return;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = CHECKBOX_CLASS;
    checkbox.setAttribute("aria-label", "Mark as viewed");

    if (_isFolder(treeItem)) {
      // Folder checkbox — state is computed from children
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        _onFolderCheckboxClick(treeItem, checkbox);
      });
      // Insert before the first child (before the expand icon)
      content.insertBefore(checkbox, content.firstChild);
      // Compute initial state after all checkboxes are injected (deferred)
      requestAnimationFrame(() => _updateFolderCheckbox(treeItem));
    } else {
      // File checkbox
      const filePath = _getFilePathFromTreeItem(treeItem);
      const isViewed = viewedMap.get(filePath) || false;
      checkbox.checked = isViewed;

      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        _onFileCheckboxClick(treeItem, checkbox);
      });

      // Insert before the file icon (first child of content)
      content.insertBefore(checkbox, content.firstChild);
    }
  }

  /**
   * Handle click on a file checkbox — toggle the native Viewed button.
   */
  function _onFileCheckboxClick(treeItem, checkbox) {
    const filePath = _getFilePathFromTreeItem(treeItem);
    const diffContainer = _findDiffForPath(filePath);
    const viewedBtn = _findViewedBtn(diffContainer);

    if (viewedBtn) {
      viewedBtn.click();
      // The MutationObserver on aria-pressed will sync back,
      // but update immediately for responsiveness
      checkbox.checked = !_isViewedBtnPressed(viewedBtn);
    } else {
      // No diff loaded yet — revert checkbox
      checkbox.checked = !checkbox.checked;
    }

    // Update parent folder state
    _updateAncestorFolders(treeItem);
  }

  /**
   * Handle click on a folder checkbox — toggle all descendant file checkboxes.
   */
  function _onFolderCheckboxClick(treeItem, checkbox) {
    const childCheckboxes = treeItem.querySelectorAll(
      `li[role="treeitem"]:not([aria-expanded]) .${CHECKBOX_CLASS}`
    );

    // Determine target: if not all checked → check all; if all checked → uncheck all
    const allChecked =
      childCheckboxes.length > 0 &&
      Array.from(childCheckboxes).every((cb) => cb.checked);
    const targetState = !allChecked;

    for (const cb of childCheckboxes) {
      if (cb.checked !== targetState) {
        const childItem = cb.closest('li[role="treeitem"]');
        const filePath = _getFilePathFromTreeItem(childItem);
        const diffContainer = _findDiffForPath(filePath);
        const viewedBtn = _findViewedBtn(diffContainer);

        if (viewedBtn) {
          const isPressed = _isViewedBtnPressed(viewedBtn);
          if (isPressed !== targetState) {
            viewedBtn.click();
          }
          cb.checked = targetState;
        }
      }
    }

    // Update this folder and ancestor folders
    _updateFolderCheckbox(treeItem);
    _updateAncestorFolders(treeItem);
  }

  /**
   * Update a folder checkbox to reflect its children's state.
   */
  function _updateFolderCheckbox(folderItem) {
    const ownContent = folderItem.querySelector(`:scope > * > ${SEL.FILE_TREE_ITEM_CONTENT}`);
    const checkbox = ownContent?.querySelector(`.${CHECKBOX_CLASS}`);
    if (!checkbox) return;

    const childCheckboxes = folderItem.querySelectorAll(
      `li[role="treeitem"]:not([aria-expanded]) .${CHECKBOX_CLASS}`
    );

    if (childCheckboxes.length === 0) {
      checkbox.checked = false;
      checkbox.indeterminate = false;
      return;
    }

    const checkedCount = Array.from(childCheckboxes).filter(
      (cb) => cb.checked
    ).length;

    if (checkedCount === 0) {
      checkbox.checked = false;
      checkbox.indeterminate = false;
    } else if (checkedCount === childCheckboxes.length) {
      checkbox.checked = true;
      checkbox.indeterminate = false;
    } else {
      checkbox.checked = false;
      checkbox.indeterminate = true;
    }
  }

  /**
   * Walk up the tree and update all ancestor folder checkboxes.
   */
  function _updateAncestorFolders(treeItem) {
    let parent = treeItem.parentElement?.closest('li[role="treeitem"]');
    while (parent) {
      if (_isFolder(parent)) {
        _updateFolderCheckbox(parent);
      }
      parent = parent.parentElement?.closest('li[role="treeitem"]');
    }
  }

  /**
   * Inject checkboxes into all tree items.
   */
  function _injectAllCheckboxes() {
    const viewedMap = _parseViewedMap();
    const treeItems = document.querySelectorAll(SEL.FILE_TREE_ITEM);

    for (const item of treeItems) {
      _injectCheckbox(item, viewedMap);
    }
  }

  // ─── Right→Left Sync (native Viewed button → tree checkbox) ─

  /**
   * Start observing diff area for aria-pressed changes on Viewed buttons.
   */
  function _startDiffObserver() {
    if (_diffObserver) _diffObserver.disconnect();

    _diffObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-pressed"
        ) {
          const btn = mutation.target;
          if (!btn.matches(SEL.DIFF_VIEWED_BTN)) continue;

          const isPressed = btn.getAttribute("aria-pressed") === "true";
          _syncTreeCheckboxFromDiff(btn, isPressed);
        }
      }
    });

    // Observe the main content area for attribute changes on Viewed buttons
    const diffArea =
      document.querySelector("#diff-holder") ||
      document.querySelector("[data-target='diff-layout.mainContainer']") ||
      document.querySelector(".js-diff-progressive-container") ||
      document.body;

    _diffObserver.observe(diffArea, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-pressed"],
    });
  }

  /**
   * Given a native Viewed button that changed, find and update the matching tree checkbox.
   */
  function _syncTreeCheckboxFromDiff(viewedBtn, isPressed) {
    // Find the file path from the diff container
    const diffContainer = viewedBtn.closest(
      "copilot-diff-entry, div[id^='diff-']"
    );
    if (!diffContainer) return;

    // Try to get file path from expand-all button or header
    const expandBtn = diffContainer.querySelector(SEL.DIFF_EXPAND_ALL_BTN);
    const filePath = expandBtn
      ? expandBtn.getAttribute("data-file-path")
      : null;

    if (!filePath) return;

    // Find matching tree item
    const treeItems = document.querySelectorAll(SEL.FILE_TREE_ITEM);
    for (const item of treeItems) {
      if (_isFolder(item)) continue;
      if (_getFilePathFromTreeItem(item) === filePath) {
        const checkbox = item.querySelector(`.${CHECKBOX_CLASS}`);
        if (checkbox) {
          checkbox.checked = isPressed;
          _updateAncestorFolders(item);
        }
        break;
      }
    }
  }

  // ─── Tree Observer (dynamically added tree items) ──────────

  /**
   * Watch for new tree items being added and inject checkboxes.
   */
  function _startTreeObserver() {
    if (_treeObserver) _treeObserver.disconnect();

    const treeRoot = document.querySelector(SEL.FILE_TREE_ROOT);
    if (!treeRoot) return;

    const viewedMap = _parseViewedMap();

    _treeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if the added node is a tree item or contains tree items
          if (
            node.matches &&
            node.matches('li[role="treeitem"]')
          ) {
            _injectCheckbox(node, viewedMap);
          }

          const nested = node.querySelectorAll
            ? node.querySelectorAll('li[role="treeitem"]')
            : [];
          for (const item of nested) {
            _injectCheckbox(item, viewedMap);
          }
        }
      }
    });

    _treeObserver.observe(treeRoot, { childList: true, subtree: true });
  }

  // ─── Feature 2: Enhanced File Click ────────────────────────

  /**
   * Set up delegated click handler on the file tree root.
   */
  function _setupFileClickHandler() {
    const treeRoot = document.querySelector(SEL.FILE_TREE_ROOT);
    if (!treeRoot) return;

    treeRoot.addEventListener("click", (e) => {
      // Skip if click target is a checkbox
      if (e.target.classList.contains(CHECKBOX_CLASS)) return;

      // Find the clicked tree item
      const treeItem = e.target.closest('li[role="treeitem"]');
      if (!treeItem) return;

      // Skip if it's a folder (has aria-expanded — let native toggle work)
      if (_isFolder(treeItem)) return;

      const filePath = _getFilePathFromTreeItem(treeItem);
      if (!filePath) return;

      const diffContainer = _findDiffForPath(filePath);
      if (!diffContainer) return;

      // 2a — Expand collapsed diff
      const header = diffContainer.querySelector(SEL.DIFF_FILE_HEADER);
      if (header) {
        const isCollapsed =
          header.className.includes("collapsed") ||
          diffContainer.querySelector("[data-details-container-group]")?.hasAttribute("hidden");

        if (isCollapsed) {
          // Click the chevron/toggle button in the header
          const toggleBtn = header.querySelector("button");
          if (toggleBtn) toggleBtn.click();
        }
      }

      // 2b — Expand all lines (wait for button to appear if diff was just expanded)
      const expandAllBtn = diffContainer.querySelector(SEL.DIFF_EXPAND_ALL_BTN);
      if (expandAllBtn) {
        expandAllBtn.click();
      } else {
        const obs = new MutationObserver(() => {
          const btn = diffContainer.querySelector(SEL.DIFF_EXPAND_ALL_BTN);
          if (btn) {
            obs.disconnect();
            btn.click();
          }
        });
        obs.observe(diffContainer, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 3000); // safety timeout
      }
    });
  }

  // ─── Public API ────────────────────────────────────────────

  function init() {
    const sidebar = document.querySelector(SEL.FILE_TREE_SIDEBAR);
    if (!sidebar) return;

    // Idempotency — skip if already enhanced
    if (sidebar.hasAttribute(ENHANCED_ATTR)) return;
    sidebar.setAttribute(ENHANCED_ATTR, "true");

    // Feature 1: Viewed checkboxes
    _injectAllCheckboxes();
    _startDiffObserver();
    _startTreeObserver();

    // Feature 2: Enhanced file click
    _setupFileClickHandler();
  }

  function destroy() {
    if (_diffObserver) {
      _diffObserver.disconnect();
      _diffObserver = null;
    }
    if (_treeObserver) {
      _treeObserver.disconnect();
      _treeObserver = null;
    }

    // Remove all injected checkboxes
    document
      .querySelectorAll(`.${CHECKBOX_CLASS}`)
      .forEach((cb) => cb.remove());

    // Remove enhanced marker
    const sidebar = document.querySelector(SEL.FILE_TREE_SIDEBAR);
    if (sidebar) sidebar.removeAttribute(ENHANCED_ATTR);
  }

  return { init, destroy };
})();
