/**
 * PRitty — Timeline Reorder
 * Detects old/new GitHub DOM and applies CSS classes for layout.
 * CSS column-reverse handles timeline item reversal.
 * CSS order properties control section positioning.
 */

PRitty.TimelineReorder = {
  REORDERED_ATTR: "data-pritty-reordered",

  apply() {
    const S = PRitty.Selectors;
    const discussion = document.querySelector(S.CONV_TIMELINE);
    if (!discussion || discussion.hasAttribute(this.REORDERED_ATTR)) return;

    // --- Detect DOM version ---
    const newOuter = document.querySelector(S.CONV_OUTER);
    const oldOuter = document.querySelector(S.CONV_OUTER_OLD);
    const timelineActions = document.querySelector(".discussion-timeline-actions");
    const isNewDOM = !!newOuter && (!timelineActions || timelineActions.children.length === 0);

    const outer = isNewDOM ? newOuter : oldOuter;
    if (!outer) return;

    // --- Find PR body ---
    const prBody = discussion.querySelector(S.CONV_PR_BODY);

    if (isNewDOM) {
      // New DOM: use flex + order to arrange sections
      outer.classList.add("pritty-conv-outer");
      discussion.classList.add("pritty-conv-timeline");

      if (prBody) {
        outer.insertBefore(prBody, discussion);
        prBody.classList.add("pritty-pr-body");
      }
    } else {
      // Old DOM: column-reverse on outer, prepend PR body to timeline-actions
      outer.classList.add("pritty-conv-outer-legacy");
      discussion.classList.add("pritty-conv-timeline");

      if (prBody && timelineActions) {
        timelineActions.prepend(prBody);
        prBody.classList.add("pritty-pr-body");
      }
    }

    discussion.setAttribute(this.REORDERED_ATTR, "true");
  },
};
