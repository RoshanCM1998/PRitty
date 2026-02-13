/**
 * PRitty — GitHub Page State Reader
 * Reads PR status, checks info, and active tab from the DOM.
 */

PRitty.GitHubState = {

  /**
   * Parse check/CI status from the Checks tab counter and merge status area.
   * @returns {{ total: number, passed: number, failed: number, pending: number, unknown: boolean }}
   */
  getChecksInfo() {
    const checksTab = PRitty.Utils.findTab("Checks");

    let totalChecks = 0;
    if (checksTab) {
      const match = checksTab.textContent.match(/Checks\s*(\d+)/);
      if (match) totalChecks = parseInt(match[1], 10);
    }

    const statusItems = document.querySelectorAll(
      '.merge-status-list .merge-status-item, [data-testid="status-check"]'
    );

    let passed = 0;
    let failed = 0;
    let pending = 0;

    statusItems.forEach((item) => {
      const icon = item.querySelector(".octicon");
      if (!icon) return;
      const cls = icon.className;
      if (cls.includes("color-fg-success") || cls.includes("octicon-check")) {
        passed++;
      } else if (cls.includes("color-fg-danger") || cls.includes("octicon-x")) {
        failed++;
      } else {
        pending++;
      }
    });

    if (statusItems.length === 0 && totalChecks > 0) {
      return { total: totalChecks, passed: 0, failed: 0, pending: 0, unknown: true };
    }

    return {
      total: passed + failed + pending || totalChecks,
      passed,
      failed,
      pending,
      unknown: false,
    };
  },

  /**
   * Detect the PR's merge/draft/conflict state.
   * @returns {{ isDraft: boolean, isMerged: boolean, isClosed: boolean, hasConflicts: boolean, mergeEnabled: boolean, mergeBtn: Element|null }}
   */
  getPRState() {
    const stateLabel = document.querySelector(PRitty.Selectors.STATE_LABEL);
    const title = stateLabel?.getAttribute("title") || "";
    const classes = stateLabel?.className || "";
    const labelText = stateLabel?.textContent?.trim() || "";

    const isDraft = stateLabel?.getAttribute("reviewable_state") === "draft"
                 || title.includes("Draft")
                 || labelText.includes("Draft");

    const isMerged = classes.includes("State--merged")
                  || title.includes("Merged")
                  || labelText.includes("Merged");

    const isClosed = classes.includes("State--closed")
                  || title.includes("Closed")
                  || labelText.includes("Closed");
    const hasConflicts = !!document.querySelector(PRitty.Selectors.CONFLICT_INDICATOR);

    const mergeBtn =
      PRitty.Utils.findButtonByPrefix("Merge pull request") ||
      PRitty.Utils.findButtonByPrefix("Squash and merge") ||
      PRitty.Utils.findButtonByPrefix("Rebase and merge");
    const mergeEnabled = mergeBtn ? !mergeBtn.disabled : false;

    return { isDraft, isMerged, isClosed, hasConflicts, mergeEnabled, mergeBtn };
  },

  /**
   * Which PR tab is currently selected.
   * @returns {"conversation"|"commits"|"checks"|"files"}
   */
  getCurrentTab() {
    const sel = document.querySelector(PRitty.Selectors.SELECTED_TAB);
    if (!sel) return "conversation";
    const text = sel.textContent.toLowerCase();
    if (text.includes("files")) return "files";
    if (text.includes("checks")) return "checks";
    if (text.includes("commits")) return "commits";
    return "conversation";
  },
};
