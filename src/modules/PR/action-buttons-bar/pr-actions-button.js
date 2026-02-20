/**
 * PRitty — Complete PR Button
 * Dropdown button with context-aware actions:
 *   Draft PR  → Publish PR
 *   Open PR   → Convert to draft, Squash and merge
 *   Closed PR → Reopen PR
 *   Merged PR → Disabled (no actions)
 */

PRitty.CompleteButton = {

  /**
   * Build and return the Complete PR button with dropdown.
   * @returns {HTMLElement}
   */
  create() {
    const wrapper = document.createElement("div");
    wrapper.className = "pritty-complete-wrapper";

    const btn = document.createElement("button");
    btn.className = "pritty-btn pritty-btn-complete";
    btn.innerHTML = `${PRitty.Icons.merge} PR Actions`;

    const dropdown = document.createElement("div");
    dropdown.className = "pritty-dropdown";
    dropdown.hidden = true;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const freshState = PRitty.GitHubState.getPRState();
      this._updateButtonState(btn, freshState);
      if (freshState.isMerged) return;
      this._populateDropdown(dropdown, freshState);
      dropdown.hidden = !dropdown.hidden;
    });

    document.addEventListener("click", () => { dropdown.hidden = true; });

    // Set initial button state
    const initialState = PRitty.GitHubState.getPRState();
    this._updateButtonState(btn, initialState);

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  },

  /**
   * Update button appearance based on PR state.
   * @param {HTMLElement} btn
   * @param {object} state
   */
  _updateButtonState(btn, state) {
    btn.classList.toggle("pritty-btn-complete--merged", state.isMerged);
    btn.disabled = state.isMerged;
  },

  /**
   * Navigate to Conversation tab (if needed) and click a native GitHub button.
   * On Conversation tab, finds and clicks immediately.
   * On other tabs, switches to Conversation and waits for the button to appear.
   * @param {Function} findButtonFn - Returns the native button element or null
   */
  _navigateAndClick(findButtonFn) {
    if (PRitty.GitHubState.getCurrentTab() === "conversation") {
      const btn = findButtonFn();
      if (btn) PRitty.Utils.scrollAndClick(btn);
      return;
    }
    const convTab = PRitty.Utils.findTab("Conversation");
    if (!convTab) return;
    convTab.click();
    const obs = new MutationObserver(() => {
      const btn = findButtonFn();
      if (btn) {
        obs.disconnect();
        PRitty.Utils.scrollAndClick(btn);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 10000);
  },

  /**
   * Fill dropdown with actions based on current PR state.
   * @param {HTMLElement} dropdown
   * @param {object} state
   */
  _populateDropdown(dropdown, state) {
    dropdown.innerHTML = "";

    if (state.isClosed) {
      dropdown.appendChild(this._item(
        "Reopen PR",
        "Reopen this pull request",
        () => this._navigateAndClick(() =>
          PRitty.Utils.findButtonByText("Reopen pull request") ||
          PRitty.Utils.findButtonByPrefix("Reopen")
        )
      ));
      return;
    }

    if (state.isDraft) {
      dropdown.appendChild(this._item(
        "Publish PR",
        "Mark as ready for review",
        () => this._navigateAndClick(() =>
          PRitty.Utils.findButtonByText("Ready for review") ||
          PRitty.Utils.findButtonByPrefix("Ready for review")
        )
      ));
      return;
    }

    // Open PR actions
    const canMerge = state.mergeEnabled && !state.hasConflicts;
    dropdown.appendChild(this._item(
      "Squash and merge",
      canMerge ? "Squash commits and merge into base" : "Merge is not available yet",
      () => {
        if (!canMerge) return;
        this._navigateAndClick(() =>
          PRitty.Utils.findButtonByPrefix("Squash and merge") ||
          PRitty.Utils.findButtonByPrefix("Merge pull request") ||
          PRitty.Utils.findButtonByPrefix("Rebase and merge")
        );
      },
      !canMerge
    ));

    dropdown.appendChild(this._item(
      "Convert to draft",
      "Move this PR back to draft",
      () => this._navigateAndClick(() => {
        const isOwn = (el) => PRitty.Utils.isPRittyElement(el);
        return document.querySelector('a[href*="convert_to_draft"]') ||
          Array.from(document.querySelectorAll("button"))
            .find((b) => !isOwn(b) && b.textContent.trim().includes("Convert to draft")) ||
          Array.from(document.querySelectorAll("a"))
            .find((a) => !isOwn(a) && a.textContent.trim().includes("Convert to draft"));
      })
    ));
  },

  /**
   * Create a single dropdown item.
   * @param {string} label
   * @param {string} desc
   * @param {Function} onClick
   * @param {boolean} [disabled]
   * @returns {HTMLButtonElement}
   */
  _item(label, desc, onClick, disabled = false) {
    const item = document.createElement("button");
    item.className = "pritty-dropdown-item";
    if (disabled) item.classList.add("pritty-dropdown-item--disabled");
    item.innerHTML =
      `<span class="pritty-dropdown-item-label">${label}</span>` +
      `<span class="pritty-dropdown-item-desc">${desc}</span>`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      if (disabled) return;
      e.target.closest(".pritty-dropdown").hidden = true;
      onClick();
    });
    return item;
  },
};
