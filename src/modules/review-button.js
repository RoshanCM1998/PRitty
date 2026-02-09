/**
 * DevHub for GitHub — Submit Review Button
 * Creates the "Submit Review" button for the PR header.
 */

DevHub.ReviewButton = {

  /**
   * Build and return the Submit Review button element.
   * @returns {HTMLButtonElement}
   */
  create() {
    const btn = document.createElement("button");
    btn.className = "devhub-btn devhub-btn-review";
    btn.innerHTML = `${DevHub.Icons.review} Submit Review`;
    btn.title = "Open review submission dialog";

    btn.addEventListener("click", () => {
      const currentTab = DevHub.GitHubState.getCurrentTab();
      if (currentTab === "files") {
        DevHub.ReviewButton._clickNative();
      } else {
        const filesTab = DevHub.Utils.findTab("Files changed");
        if (filesTab) {
          filesTab.click();
          setTimeout(() => DevHub.ReviewButton._clickNative(), 1500);
        }
      }
    });

    return btn;
  },

  /** @private Click the native "Submit review" button on the Files Changed tab. */
  _clickNative() {
    const native = DevHub.Utils.findButtonByText("Submit review");
    if (native) {
      native.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => native.click(), 300);
    }
  },
};
