/**
 * PRitty — Submit Review Button
 * Creates the "Submit Review" button for the PR header.
 */

PRitty.ReviewButton = {

  /**
   * Build and return the Submit Review button element.
   * @returns {HTMLButtonElement}
   */
  create() {
    const btn = document.createElement("button");
    btn.className = "pritty-btn pritty-btn-review";
    btn.innerHTML = `${PRitty.Icons.review} Submit Review`;
    btn.title = "Open review submission dialog";

    btn.addEventListener("click", () => {
      const currentTab = PRitty.GitHubState.getCurrentTab();
      if (currentTab === "files") {
        PRitty.ReviewButton._clickNative();
      } else {
        const filesTab = PRitty.Utils.findTab("Files changed");
        if (filesTab) {
          filesTab.click();
          setTimeout(() => PRitty.ReviewButton._clickNative(), 1500);
        }
      }
    });

    return btn;
  },

  /** @private Click the native "Submit review" button on the Files Changed tab. */
  _clickNative() {
    const native = PRitty.Utils.findButtonByText("Submit review");
    if (native) {
      native.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => native.click(), 300);
    }
  },
};
