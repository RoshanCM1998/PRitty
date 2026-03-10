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
  DEBOUNCE_MS: 2000,

  /** Scan for unprocessed comment forms and enhance them. */
  enhance() {
    this._enhanceReactStyle();
  },

  /**
   * Handle React-style MarkdownEditor containers (Files Changed + inline comments).
   * These use [class*="MarkdownEditor-module__container"] with CSS-module class toggling.
   *
   * To avoid exhausting GitHub's preview API, after a debounce period of
   * inactivity we cycle Write→Preview to trigger a single re-render.
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

      // Click Preview to populate the preview panel and stay on it
      previewTab.click();

      requestAnimationFrame(() => {
        this._removeDisplayNone(container);
        container.classList.add('pritty-side-by-side-preview');

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

    // Create persistent preview cache element (outside React's control)
    const cachedPreview = document.createElement('div');
    cachedPreview.setAttribute('data-pritty-injected', '');
    cachedPreview.className = 'pritty-cached-preview markdown-body';
    cachedPreview.style.display = 'none';
    // Insert right after the textarea's parent span so it sits below the typing area
    const textareaSpan = container.querySelector(PRitty.Selectors.MD_TEXTAREA_SPAN);
    if (textareaSpan) {
      textareaSpan.after(cachedPreview);
    } else {
      container.appendChild(cachedPreview);
    }

    let timer = null;
    let previewActive = true; // starts true — init leaves Preview tab active

    textarea.addEventListener('input', () => {
      if (previewActive) {
        // Cache current live preview content before switching away
        const livePreview = container.querySelector(
          '[class*="MarkdownEditor-module__previewViewerWrapper"] .markdown-body'
        );
        cachedPreview.innerHTML = livePreview ? livePreview.innerHTML : '';
        cachedPreview.style.display = 'block';

        writeTab.click();
        previewActive = false;

        requestAnimationFrame(() => {
          this._removeDisplayNone(container);
        });
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        cachedPreview.style.display = 'none';
        previewTab.click();
        previewActive = true;
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
