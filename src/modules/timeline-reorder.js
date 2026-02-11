/**
 * DevHub for GitHub — Timeline Reorder
 * Reorders the PR conversation tab: PR body first, then merge/comment area,
 * then all timeline events in descending (newest-first) order.
 */

DevHub.TimelineReorder = {
  REORDERED_ATTR: "data-devhub-reordered",

  apply() {
    const discussion = document.querySelector(".js-discussion");
    if (!discussion || discussion.hasAttribute(this.REORDERED_ATTR)) return;

    const prBody = discussion.querySelector(
      ":scope > .js-command-palette-pull-body"
    );
    if (!prBody) return;

    // Move merge actions and comment box into the discussion, right after PR body
    const mergeActions = document.querySelector(".discussion-timeline-actions");
    const commentBox = document.querySelector("#issue-comment-box");

    if (mergeActions) prBody.after(mergeActions);
    if (commentBox) (mergeActions || prBody).after(commentBox);

    // Reverse timeline items (newest first)
    const items = [
      ...discussion.querySelectorAll(":scope > .js-timeline-item"),
    ];
    items.reverse().forEach((item) => discussion.appendChild(item));

    discussion.setAttribute(this.REORDERED_ATTR, "true");
  },
};
