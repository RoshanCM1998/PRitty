/**
 * DevHub for GitHub — Checks Status Badge
 * Creates the clickable checks summary pill in the PR header.
 */

DevHub.ChecksBadge = {

  /**
   * Build and return the checks badge element.
   * @returns {HTMLElement}
   */
  create() {
    const checks = DevHub.GitHubState.getChecksInfo();

    const badge = document.createElement("span");
    let cssModifier = "devhub-checks-summary--none";
    let icon = DevHub.Icons.pending;
    let text = "No checks";

    if (checks.total > 0) {
      if (checks.unknown) {
        text = `${checks.total} check${checks.total > 1 ? "s" : ""}`;
        cssModifier = "devhub-checks-summary--pending";
      } else if (checks.failed > 0) {
        text = `${checks.failed} failed, ${checks.passed} passed`;
        cssModifier = "devhub-checks-summary--fail";
        icon = DevHub.Icons.x;
      } else if (checks.pending > 0) {
        text = `${checks.pending} pending, ${checks.passed} passed`;
        cssModifier = "devhub-checks-summary--pending";
      } else {
        text = `${checks.passed} passed`;
        cssModifier = "devhub-checks-summary--pass";
        icon = DevHub.Icons.check;
      }
    }

    badge.className = `devhub-checks-summary ${cssModifier}`;
    badge.innerHTML = `${icon} ${text}`;
    badge.title = "PR Checks Status";
    badge.style.cursor = "pointer";

    badge.addEventListener("click", () => {
      const tab = DevHub.Utils.findTab("Checks");
      if (tab) tab.click();
    });

    return badge;
  },
};
