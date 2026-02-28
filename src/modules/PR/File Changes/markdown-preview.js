/**
 * PRitty — Markdown Preview (Side-by-Side)
 * Controlled by the `sideBySidePreview` setting (toggle in popup).
 *
 * Shows the markdown textarea and rendered preview simultaneously in PR
 * comment forms, instead of GitHub's default toggle between Write/Preview tabs.
 *
 * Strategy:
 * 1. Detect comment forms (React-style MarkdownEditor containers)
 * 2. Auto-click the Preview tab to activate live rendering
 * 3. Remove the `displayNone` CSS-module class from the textarea so both are visible
 * 4. Apply a layout class for stacked (textarea on top, preview below) display
 * 5. MutationObserver re-removes displayNone if GitHub re-adds it on tab switches
 */

PRitty.MarkdownPreview = {
  ENHANCED_ATTR: 'data-pritty-preview-enhanced',

  /** Scan for unprocessed comment forms and enhance them. */
  enhance() {
    this._enhanceReactStyle();
  },

  /**
   * Handle React-style MarkdownEditor containers (Files Changed + inline comments).
   * These use [class*="MarkdownEditor-module__container"] with CSS-module class toggling.
   */
  _enhanceReactStyle() {
    const containers = document.querySelectorAll(
      PRitty.Selectors.MD_EDITOR_REACT + ':not([' + this.ENHANCED_ATTR + '])'
    );

    containers.forEach(container => {
      // Mark immediately to prevent re-processing
      container.setAttribute(this.ENHANCED_ATTR, 'true');

      // Find and click the Preview tab
      const previewTab = Array.from(container.querySelectorAll('button[role="tab"]'))
        .find(btn => btn.textContent.trim() === 'Preview');
      if (!previewTab) return;

      previewTab.click();

      // Wait for React to update DOM after the click, then unhide the textarea
      requestAnimationFrame(() => {
        this._removeDisplayNone(container);
        container.classList.add('pritty-side-by-side-preview');

        // Focus the textarea so user can start typing immediately
        const textarea = container.querySelector('textarea');
        if (textarea) textarea.focus();

        // Watch for GitHub re-adding displayNone on tab interactions
        this._observeReactToggle(container);
      });
    });
  },

  /**
   * Remove whichever CSS-module class contains "displayNone" from the textarea span.
   * The class name includes a hash that may change between GitHub deploys,
   * so we match dynamically rather than hardcoding the full class name.
   * @param {HTMLElement} container - The MarkdownEditor container
   */
  _removeDisplayNone(container) {
    const span = container.querySelector(PRitty.Selectors.MD_TEXTAREA_SPAN);
    if (!span) return;

    const cls = Array.from(span.classList).find(c => c.includes('displayNone'));
    if (cls) span.classList.remove(cls);
  },

  /**
   * Set up a MutationObserver to re-remove displayNone if GitHub re-adds it.
   * This handles cases where the user clicks Write/Preview tabs or GitHub
   * re-renders the form internally.
   * @param {HTMLElement} container - The MarkdownEditor container
   */
  _observeReactToggle(container) {
    const span = container.querySelector(PRitty.Selectors.MD_TEXTAREA_SPAN);
    if (!span) return;

    const observer = new MutationObserver(() => {
      this._removeDisplayNone(container);
    });

    observer.observe(span, { attributes: true, attributeFilter: ['class'] });
  },
};
