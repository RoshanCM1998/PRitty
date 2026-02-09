/**
 * DevHub for GitHub — Complete PR Button
 * Creates the "Complete PR" (merge) button for the PR header.
 */

DevHub.CompleteButton = {

  /**
   * Build and return the Complete PR button element.
   * @returns {HTMLButtonElement}
   */
  create() {
    const prState = DevHub.GitHubState.getPRState();
    const canMerge = prState.mergeEnabled && !prState.isDraft && !prState.hasConflicts;

    const btn = document.createElement("button");
    btn.className = "devhub-btn devhub-btn-complete";

    let indicatorClass = "devhub-merge-indicator--ready";
    let label = "Complete PR";

    if (prState.isDraft) {
      indicatorClass = "devhub-merge-indicator--draft";
      label = "Draft";
    } else if (prState.hasConflicts || !prState.mergeEnabled) {
      indicatorClass = "devhub-merge-indicator--blocked";
    }

    btn.innerHTML = `${DevHub.Icons.merge} <span class="devhub-merge-indicator ${indicatorClass}"></span> ${label}`;
    btn.disabled = !canMerge;

    btn.title = prState.isDraft
      ? "This PR is still a draft"
      : prState.hasConflicts
      ? "Resolve conflicts before merging"
      : canMerge
      ? "Merge this pull request"
      : "Cannot merge yet";

    btn.addEventListener("click", () => {
      if (!canMerge) return;
      const state = DevHub.GitHubState.getPRState();
      if (state.mergeBtn) {
        state.mergeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => state.mergeBtn.click(), 400);
      }
    });

    return btn;
  },
};
