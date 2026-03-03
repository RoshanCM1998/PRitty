/**
 * PRitty — Submit Review Button
 * Dropdown button with two actions:
 *   Submit Review → opens the native review dialog on the Files Changed tab
 *   Approve PR    → directly approves the PR via GitHub's internal API
 */

PRitty.ReviewButton = {

  /**
   * Build and return the Submit Review button with dropdown.
   * @returns {HTMLElement}
   */
  create() {
    const wrapper = document.createElement("div");
    wrapper.className = "pritty-review-wrapper";

    const btn = document.createElement("button");
    btn.className = "pritty-btn pritty-btn-review";
    btn.innerHTML = `${PRitty.Icons.review} Submit Review`;
    btn.title = "Open review submission dialog";

    const dropdown = document.createElement("div");
    dropdown.className = "pritty-dropdown";
    dropdown.hidden = true;

    dropdown.appendChild(this._item(
      "Submit Review",
      "Open the native review dialog",
      () => this._clickNative()
    ));

    dropdown.appendChild(this._item(
      "Approve PR",
      "Approve this pull request immediately",
      () => this._approvePR()
    ));

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other open dropdowns
      document.querySelectorAll(".pritty-dropdown").forEach((dd) => {
        if (dd !== dropdown) dd.hidden = true;
      });
      dropdown.hidden = !dropdown.hidden;
    });

    document.addEventListener("click", () => { dropdown.hidden = true; });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    return wrapper;
  },

  /**
   * Create a single dropdown item.
   * @param {string} label
   * @param {string} desc
   * @param {Function} onClick
   * @returns {HTMLButtonElement}
   */
  _item(label, desc, onClick) {
    const item = document.createElement("button");
    item.className = "pritty-dropdown-item";
    item.innerHTML =
      `<span class="pritty-dropdown-item-label">${label}</span>` +
      `<span class="pritty-dropdown-item-desc">${desc}</span>`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      e.target.closest(".pritty-dropdown").hidden = true;
      onClick();
    });
    return item;
  },

  /**
   * Navigate to Files Changed tab (if needed) and click GitHub's native
   * "Submit review" button.
   * @private
   */
  _clickNative() {
    const currentTab = PRitty.GitHubState.getCurrentTab();
    if (currentTab === "files") {
      const native = PRitty.Utils.findButtonByText("Submit review");
      if (native) PRitty.Utils.scrollAndClick(native);
      return;
    }
    const filesTab = PRitty.Utils.findTab("Files changed");
    if (filesTab) {
      filesTab.click();
      const obs = new MutationObserver(() => {
        const native = PRitty.Utils.findButtonByText("Submit review");
        if (native) {
          obs.disconnect();
          PRitty.Utils.scrollAndClick(native);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 10000);
    }
  },

  /**
   * Extract the PR's head commit SHA.
   * Called at click time (not page load) because Turbo navigation can
   * change the displayed commit.
   * Tier 1: DOM selector (fast, works on Files Changed tab).
   * Tier 2: Fetch from commits endpoint (works on any tab).
   * @returns {Promise<string|null>}
   * @private
   */
  async _getHeadSHA() {
    // Tier 1: Hidden input used by GitHub's own review forms
    const oidInput = document.querySelector('input[name="expected_head_oid"]');
    if (oidInput?.value) return oidInput.value;

    // Tier 2: Fetch from commits endpoint
    const pathParts = window.location.pathname.split("/");
    const commitsUrl = `/${pathParts[1]}/${pathParts[2]}/pull/${pathParts[4]}/commits`;
    try {
      const resp = await fetch(commitsUrl, {
        headers: {
          "Accept": "application/json",
          "GitHub-Verified-Fetch": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const groups = data?.payload?.pullRequestsCommitsRoute?.commitGroups;
      if (!groups?.length) return null;
      const lastGroup = groups[groups.length - 1];
      const lastCommit = lastGroup.commits[lastGroup.commits.length - 1];
      return lastCommit?.oid || null;
    } catch {
      return null;
    }
  },

  /**
   * Parse a GitHub error response to extract a human-readable message.
   * Tries JSON first, then HTML flash messages, then falls back to HTTP status.
   * @param {Response} response
   * @returns {Promise<string>}
   * @private
   */
  async _parseErrorResponse(response) {
    const fallback = `Failed to approve PR (HTTP ${response.status}).`;
    try {
      const text = await response.text();
      // Try JSON first
      try {
        const json = JSON.parse(text);
        if (json.message) return json.message;
        if (json.errors?.length)
          return json.errors.map(e => typeof e === "string" ? e : e.message).join("; ");
      } catch { /* not JSON, try HTML */ }
      // Try HTML flash messages
      const doc = new DOMParser().parseFromString(text, "text/html");
      const flash = doc.querySelector(".flash-error, .flash-warn, [role='alert']");
      if (flash?.textContent?.trim()) return flash.textContent.trim();
      return fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Approve the PR directly via GitHub's internal review endpoint.
   * Uses session cookies (same-origin fetch) and the new JSON-based API.
   * @private
   */
  async _approvePR() {
    const pathParts = window.location.pathname.split("/");
    const owner = pathParts[1];
    const repo = pathParts[2];
    const prNumber = pathParts[4];

    if (!owner || !repo || !prNumber) {
      alert("Could not determine PR details from the URL.");
      return;
    }

    const headSha = await this._getHeadSHA();
    if (!headSha) {
      alert("Could not find the head commit SHA. Try refreshing the page.");
      return;
    }

    const endpoint = `/${owner}/${repo}/pull/${prNumber}/page_data/submit_review`;

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "GitHub-Verified-Fetch": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          body: "",
          event: "approve",
          headSha: headSha,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else if (response.status === 422) {
        alert("Error: 422 — You can't approve your own PR.");
      } else {
        alert(await this._parseErrorResponse(response));
      }
    } catch (err) {
      alert(`Failed to approve PR: ${err.message}`);
    }
  },
};
