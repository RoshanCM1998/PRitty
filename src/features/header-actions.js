/**
 * DevHub for GitHub — Header Actions Feature
 * Assembles all header-level UI elements into a single container.
 */

DevHub.HeaderActions = {

  /**
   * Create the container with all header action elements.
   * @returns {HTMLElement}
   */
  createAll() {
    const container = document.createElement("div");
    container.className = "devhub-actions";
    container.setAttribute(DevHub.INJECTED_ATTR, "true");

    container.appendChild(DevHub.ChecksBadge.create());
    container.appendChild(DevHub.CompleteButton.create());
    container.appendChild(DevHub.ReviewButton.create());

    return container;
  },
};
