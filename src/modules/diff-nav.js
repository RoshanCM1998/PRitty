/**
 * PRitty — Diff Navigation
 * Adds prev/next buttons to the Files Changed toolbar to navigate between change hunks.
 */

PRitty.DiffNav = {
  ENHANCED_ATTR: "data-pritty-diff-nav",

  /** Toolbar offset to account for sticky header when scrolling. */
  _TOOLBAR_OFFSET: 150,

  /**
   * Initialize: inject nav buttons into the PR Files toolbar.
   */
  init() {
    const toolbar = document.querySelector(PRitty.Selectors.PR_FILES_TOOLBAR);
    if (!toolbar || toolbar.hasAttribute(this.ENHANCED_ATTR)) return;
    toolbar.setAttribute(this.ENHANCED_ATTR, "true");

    // The toolbar has: <h2 sr-only> + left div + right div — last child is the right-side controls
    const rightDiv = toolbar.lastElementChild;
    if (!rightDiv) return;

    const container = document.createElement("div");
    container.className = "pritty-diff-nav";
    container.setAttribute(PRitty.INJECTED_ATTR, "true");

    container.appendChild(this._createBtn("prev"));
    container.appendChild(this._createBtn("next"));

    rightDiv.prepend(container);
  },

  /**
   * Create a single nav button.
   * @param {"prev"|"next"} direction
   */
  _createBtn(direction) {
    const btn = document.createElement("button");
    btn.className = "pritty-diff-nav-btn";
    btn.type = "button";
    btn.title = direction === "prev" ? "Previous change" : "Next change";
    btn.innerHTML =
      direction === "prev" ? PRitty.Icons.chevronUp : PRitty.Icons.chevronDown;

    btn.addEventListener("click", () => this._navigate(direction));
    return btn;
  },

  /**
   * Collect change hunk start elements (first changed row of each consecutive block).
   * @returns {Element[]}
   */
  _getChangeHunks() {
    const changedCodes = document.querySelectorAll(
      PRitty.Selectors.DIFF_CHANGED_LINE
    );
    const hunks = [];
    let prevRow = null;

    for (const code of changedCodes) {
      const row = code.closest("tr.diff-line-row");
      if (!row) continue;

      // New hunk if this row is not the immediate next sibling of the previous changed row
      if (!prevRow || row.previousElementSibling !== prevRow) {
        hunks.push(row);
      }
      prevRow = row;
    }

    return hunks;
  },

  /**
   * Navigate to the previous or next change hunk.
   * @param {"prev"|"next"} direction
   */
  _navigate(direction) {
    const hunks = this._getChangeHunks();
    if (hunks.length === 0) return;

    const scrollTop = window.scrollY + this._TOOLBAR_OFFSET;

    if (direction === "next") {
      for (const hunk of hunks) {
        const hunkTop = hunk.getBoundingClientRect().top + window.scrollY;
        if (hunkTop > scrollTop + 1) {
          this._scrollTo(hunk);
          return;
        }
      }
    } else {
      for (let i = hunks.length - 1; i >= 0; i--) {
        const hunkTop =
          hunks[i].getBoundingClientRect().top + window.scrollY;
        if (hunkTop < scrollTop - 1) {
          this._scrollTo(hunks[i]);
          return;
        }
      }
    }
  },

  /**
   * Scroll to an element with offset for the sticky toolbar.
   * @param {Element} el
   */
  _scrollTo(el) {
    const top =
      el.getBoundingClientRect().top + window.scrollY - this._TOOLBAR_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  },
};
