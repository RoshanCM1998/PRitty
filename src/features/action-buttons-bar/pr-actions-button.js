/**
 * PRitty — Complete PR Button
 * Dropdown button with context-aware actions:
 *   Draft PR  → Publish PR
 *   Open PR   → Convert to draft, Squash and merge
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
      this._populateDropdown(dropdown, freshState);
      dropdown.hidden = !dropdown.hidden;
    });

    document.addEventListener("click", () => { dropdown.hidden = true; });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  },

  /**
   * Fill dropdown with actions based on current PR state.
   * @param {HTMLElement} dropdown
   * @param {object} state
   */
  _populateDropdown(dropdown, state) {
    dropdown.innerHTML = "";

    if (state.isMerged || state.isClosed) {
      dropdown.appendChild(this._item(
        state.isMerged ? "Merged" : "Closed",
        "No actions available",
        () => {},
        true
      ));
      return;
    }

    if (state.isDraft) {
      dropdown.appendChild(this._item(
        "Publish PR",
        "Mark as ready for review",
        () => {
          const readyBtn =
            PRitty.Utils.findButtonByText("Ready for review") ||
            PRitty.Utils.findButtonByPrefix("Ready for review");
          if (readyBtn) {
            readyBtn.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => readyBtn.click(), 400);
          }
        }
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
        const mergeBtn =
          PRitty.Utils.findButtonByPrefix("Squash and merge") ||
          PRitty.Utils.findButtonByPrefix("Merge pull request") ||
          PRitty.Utils.findButtonByPrefix("Rebase and merge");
        if (mergeBtn) {
          mergeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => mergeBtn.click(), 400);
        }
      },
      !canMerge
    ));

    dropdown.appendChild(this._item(
      "Convert to draft",
      "Move this PR back to draft",
      () => {
        const isOwn = (el) => PRitty.Utils.isPRittyElement(el);
        const el =
          document.querySelector('a[href*="convert_to_draft"]') ||
          Array.from(document.querySelectorAll("button"))
            .find((b) => !isOwn(b) && b.textContent.trim().includes("Convert to draft")) ||
          Array.from(document.querySelectorAll("a"))
            .find((a) => !isOwn(a) && a.textContent.trim().includes("Convert to draft"));
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.click(), 400);
        }
      }
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
