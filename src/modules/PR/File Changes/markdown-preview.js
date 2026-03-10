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
  DEBOUNCE_MS: 3000,

  /** Scan for unprocessed comment forms and enhance them. */
  enhance() {
    this._enhanceReactStyle();
  },

  /**
   * Handle React-style MarkdownEditor containers (Files Changed + inline comments).
   * These use [class*="MarkdownEditor-module__container"] with CSS-module class toggling.
   *
   * To avoid exhausting GitHub's preview API, we keep the Write tab active while
   * the user is typing and only switch to Preview after a debounce period.
   */
  _enhanceReactStyle() {
    const containers = document.querySelectorAll(
      PRitty.Selectors.MD_EDITOR_REACT + ':not([' + this.ENHANCED_ATTR + '])'
    );

    containers.forEach(container => {
      // Mark immediately to prevent re-processing
      container.setAttribute(this.ENHANCED_ATTR, 'true');

      const tabs = container.querySelectorAll('button[role="tab"]');
      const previewTab = Array.from(tabs)
        .find(btn => btn.textContent.trim() === 'Preview');
      const writeTab = Array.from(tabs)
        .find(btn => btn.textContent.trim() === 'Write');
      if (!previewTab) return;

      // Click Preview once to populate the preview panel, then switch back to Write
      previewTab.click();

      requestAnimationFrame(() => {
        this._removeDisplayNone(container);
        container.classList.add('pritty-side-by-side-preview');

        // Switch back to Write to stop continuous preview API requests
        if (writeTab) writeTab.click();

        const textarea = container.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          this._addDebouncedPreview(container, textarea, writeTab, previewTab);
        }

        // Watch for GitHub re-adding displayNone on tab interactions
        this._observeReactToggle(container);
      });
    });
  },

  /**
   * Debounced input handler: while the user is typing the Write tab stays
   * active (no preview API calls). After DEBOUNCE_MS of inactivity the
   * Preview tab is clicked once, triggering a single render request.
   */
  _addDebouncedPreview(container, textarea, writeTab, previewTab) {
    if (!writeTab || !previewTab) return;

    let timer = null;
    textarea.addEventListener('input', () => {
      // Ensure Write tab is active to stop any ongoing preview requests
      writeTab.click();

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        previewTab.click();
      }, this.DEBOUNCE_MS);
    });
  },

  /**
   * Remove whichever CSS-module classes contain "displayNone" from elements
   * inside the container.  Targets both the textarea span and the preview
   * panel so that both remain visible in side-by-side mode.
   * @param {HTMLElement} container - The MarkdownEditor container
   */
  _removeDisplayNone(container) {
    container.querySelectorAll('[class*="displayNone"]').forEach(el => {
      const cls = Array.from(el.classList).find(c => c.includes('displayNone'));
      if (cls) el.classList.remove(cls);
    });
  },

  /**
   * Set up a MutationObserver to re-remove displayNone if GitHub re-adds it.
   * Uses subtree: true so it covers both the textarea span and the preview
   * panel (whose exact class names are hashed and may change).
   * @param {HTMLElement} container - The MarkdownEditor container
   */
  _observeReactToggle(container) {
    const observer = new MutationObserver(() => {
      this._removeDisplayNone(container);
    });

    observer.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  },
};
