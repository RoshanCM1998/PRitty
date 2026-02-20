/**
 * PRitty — Header Actions Feature
 * Assembles all header-level UI elements into a single container.
 */

PRitty.HeaderActions = {

  /**
   * Create the container with all header action elements.
   * @returns {HTMLElement}
   */
  createAll() {
    const container = document.createElement("div");
    container.className = "pritty-actions";
    container.setAttribute(PRitty.INJECTED_ATTR, "true");

    container.appendChild(PRitty.CompleteButton.create());
    container.appendChild(PRitty.ReviewButton.create());

    return container;
  },
};
