/**
 * DevHub for GitHub — Complete PR Button
 * Dropdown button with context-aware actions:
 *   Draft PR  → Publish PR
 *   Open PR   → Convert to draft, Squash and merge
 */

DevHub.CompleteButton = {

  /**
   * Build and return the Complete PR button with dropdown.
   * @returns {HTMLElement}
   */
  create() {
    const prState = DevHub.GitHubState.getPRState();

    const wrapper = document.createElement("div");
    wrapper.className = "devhub-complete-wrapper";

    const btn = document.createElement("button");
    btn.className = "devhub-btn devhub-btn-complete";

    if (prState.isMerged || prState.isClosed) {
      btn.innerHTML = `${DevHub.Icons.merge} ${prState.isMerged ? "Merged" : "Closed"}`;
      btn.disabled = true;
      wrapper.appendChild(btn);
      return wrapper;
    }

    btn.innerHTML = `${DevHub.Icons.merge} PR Actions`;

    const dropdown = document.createElement("div");
    dropdown.className = "devhub-dropdown";
    dropdown.hidden = true;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const freshState = DevHub.GitHubState.getPRState();
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

    if (state.isDraft) {
      dropdown.appendChild(this._item(
        "Publish PR",
        "Mark as ready for review",
        () => {
          const readyBtn =
            DevHub.Utils.findButtonByText("Ready for review") ||
            DevHub.Utils.findButtonByPrefix("Ready for review");
          if (readyBtn) {
            readyBtn.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => readyBtn.click(), 400);
          }
        }
      ));
      return;
    }

    // Open PR actions
    dropdown.appendChild(this._item(
      "Convert to draft",
      "Move this PR back to draft",
      () => {
        const isOwn = (el) => DevHub.Utils.isDevHubElement(el);
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

    const canMerge = state.mergeEnabled && !state.hasConflicts;
    dropdown.appendChild(this._item(
      "Squash and merge",
      canMerge ? "Squash commits and merge into base" : "Merge is not available yet",
      () => {
        if (!canMerge) return;
        const mergeBtn =
          DevHub.Utils.findButtonByPrefix("Squash and merge") ||
          DevHub.Utils.findButtonByPrefix("Merge pull request") ||
          DevHub.Utils.findButtonByPrefix("Rebase and merge");
        if (mergeBtn) {
          mergeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => mergeBtn.click(), 400);
        }
      },
      !canMerge
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
    item.className = "devhub-dropdown-item";
    if (disabled) item.classList.add("devhub-dropdown-item--disabled");
    item.innerHTML =
      `<span class="devhub-dropdown-item-label">${label}</span>` +
      `<span class="devhub-dropdown-item-desc">${desc}</span>`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      if (disabled) return;
      e.target.closest(".devhub-dropdown").hidden = true;
      onClick();
    });
    return item;
  },
};
