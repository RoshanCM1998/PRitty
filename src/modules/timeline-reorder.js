/**
 * PRitty — Timeline Reorder
 * Moves the PR description to the top of the conversation tab.
 * CSS column-reverse handles the visual reversal of all other timeline items.
 */

PRitty.TimelineReorder = {
  REORDERED_ATTR: "data-pritty-reordered",

  apply() {
    const discussion = document.querySelector(".js-discussion");
    if (!discussion || discussion.hasAttribute(this.REORDERED_ATTR)) return;

    const prBody = discussion.querySelector(
      ":scope > .js-command-palette-pull-body"
    );
    if (!prBody) return;

    // Prepend PR body to top of merge/comment container so it appears first
    const timelineActions = document.querySelector(".discussion-timeline-actions");
    if (timelineActions) timelineActions.prepend(prBody);

    discussion.setAttribute(this.REORDERED_ATTR, "true");
  },
};
