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
   * Extract a CSRF token from the page using a three-tier fallback.
   * Called at click time (not page load) because Turbo navigation can
   * invalidate previously cached tokens.
   * @param {string} reviewsAction — the reviews endpoint path
   * @returns {string|null}
   * @private
   */
  _getCSRFToken(reviewsAction) {
    // 1. Meta tag — global token when present
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta?.content) return meta.content;

    // 2. Hidden input from a form targeting the reviews endpoint
    const reviewForm = document.querySelector(
      `form[action="${reviewsAction}"] input[name="authenticity_token"],` +
      `form[action$="/reviews"] input[name="authenticity_token"]`
    );
    if (reviewForm?.value) return reviewForm.value;

    // 3. Any authenticity_token hidden input on the page
    const anyInput = document.querySelector('input[name="authenticity_token"]');
    if (anyInput?.value) return anyInput.value;

    return null;
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
   * Uses the page's CSRF token and session cookies (same-origin fetch).
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

    const reviewsAction = `/${owner}/${repo}/pull/${prNumber}/reviews`;
    const token = this._getCSRFToken(reviewsAction);
    if (!token) {
      alert("Could not find CSRF token. Are you logged in?");
      return;
    }

    try {
      const response = await fetch(reviewsAction, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new URLSearchParams({
          authenticity_token: token,
          "pull_request_review[event]": "approve",
          "pull_request_review[body]": "",
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
