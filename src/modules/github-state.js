/**
 * DevHub for GitHub — GitHub Page State Reader
 * Reads PR status, checks info, and active tab from the DOM.
 */

DevHub.GitHubState = {

  /**
   * Parse check/CI status from the Checks tab counter and merge status area.
   * @returns {{ total: number, passed: number, failed: number, pending: number, unknown: boolean }}
   */
  getChecksInfo() {
    const checksTab = DevHub.Utils.findTab("Checks");

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
    const stateLabel = document.querySelector(DevHub.Selectors.STATE_LABEL);
    const labelText = stateLabel?.textContent || "";

    const isDraft = labelText.includes("Draft");
    const isMerged = labelText.includes("Merged");
    const isClosed = labelText.includes("Closed");
    const hasConflicts = !!document.querySelector(DevHub.Selectors.CONFLICT_INDICATOR);

    const mergeBtn =
      DevHub.Utils.findButtonByPrefix("Merge pull request") ||
      DevHub.Utils.findButtonByPrefix("Squash and merge") ||
      DevHub.Utils.findButtonByPrefix("Rebase and merge");
    const mergeEnabled = mergeBtn ? !mergeBtn.disabled : false;

    return { isDraft, isMerged, isClosed, hasConflicts, mergeEnabled, mergeBtn };
  },

  /**
   * Which PR tab is currently selected.
   * @returns {"conversation"|"commits"|"checks"|"files"}
   */
  getCurrentTab() {
    const sel = document.querySelector(DevHub.Selectors.SELECTED_TAB);
    if (!sel) return "conversation";
    const text = sel.textContent.toLowerCase();
    if (text.includes("files")) return "files";
    if (text.includes("checks")) return "checks";
    if (text.includes("commits")) return "commits";
    return "conversation";
  },
};
