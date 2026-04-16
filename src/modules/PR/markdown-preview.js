/**
 * PRitty — Markdown Preview (Quick Preview)
 * Controlled by the `quickPreview` setting (toggle in popup).
 *
 * Shows the markdown textarea and a live-rendered preview simultaneously
 * in PR comment forms on both the Conversation and Files Changed tabs.
 *
 * Uses marked.js for local markdown rendering — no GitHub API calls,
 * no Write/Preview tab cycling. The textarea is never touched
 * programmatically, so there are no cursor or character-loss issues.
 *
 * Two different GitHub comment form architectures:
 *
 * FILES CHANGED TAB (Primer React MarkdownEditor):
 *   Selector: [class*="MarkdownEditor-module__container"]  (CSS-module hashed)
 *   Structure: MarkdownEditor-module__container
 *                └─ MarkdownInput-module__inputWrapper
 *                     └─ InlineAutocomplete-module__container
 *                          └─ MarkdownInput-module__textArea  ← gets displayNone on Preview
 *                               ├─ textarea
 *                               └─ .pritty-local-preview  ← inserted here (hides with parent)
 *   CSS override: flex-wrap:wrap on textArea span so preview wraps below textarea.
 *
 * CONVERSATION TAB (standard GitHub tab-container web component):
 *   Selector: tab-container.js-previewable-comment-form
 *     - <tab-container> is a custom HTML element (stable, won't change)
 *     - .js-previewable-comment-form is a js- behavior class (stable convention)
 *   Structure: tab-container.js-previewable-comment-form
 *                ├─ div.tabnav.CommentBox-header  (Write/Preview tabs)
 *                ├─ file-attachment[role="tabpanel"]  ← hidden by GitHub on Preview tab
 *                │    ├─ div.js-write-bucket
 *                │    │    └─ div.CommentBox-container
 *                │    │         └─ textarea
 *                │    └─ .pritty-local-preview  ← inserted here (hides with parent)
 *                └─ div.js-preview-panel[role="tabpanel"]  (GitHub's own preview)
 */

// Strip raw HTML from marked output to prevent XSS (marked v15 passes HTML through by default).
// Markdown-generated tags (<h1>, <p>, <code>, etc.) are unaffected — they use marked's own
// renderer methods, not the `html` renderer which handles raw HTML blocks/inline.
marked.use({
  renderer: {
    html() { return ''; },
  },
});

PRitty.MarkdownPreview = {
  ENHANCED_ATTR: 'data-pritty-preview-enhanced',
  DEBOUNCE_MS: 300,

  /** Scan for unprocessed comment forms and enhance them. */
  enhance() {
    const not = ':not([' + this.ENHANCED_ATTR + '])';
    const selectors = [
      // Conversation tab: <tab-container> web component (main comment box + inline replies)
      PRitty.Selectors.MD_COMMENT_FORM + not,
      // Files Changed tab: Primer React MarkdownEditor (inline diff comments)
      PRitty.Selectors.MD_EDITOR_REACT + not,
    ].join(', ');

    document.querySelectorAll(selectors).forEach(c => this._enhance(c));
  },

  _enhance(container) {
    container.setAttribute(this.ENHANCED_ATTR, 'true');

    const textarea = container.querySelector('textarea');
    if (!textarea) return;

    // Create our own preview div using GitHub's markdown-body class for styling
    const preview = document.createElement('div');
    preview.setAttribute('data-pritty-injected', '');
    preview.className = 'pritty-local-preview markdown-body';

    // Insert inside the write area so preview auto-hides when Preview tab is active.
    //
    // Files Changed tab: insert inside textareaSpan (MarkdownInput-module__textArea).
    //   That span gets displayNone when Preview tab is clicked → our preview hides with it.
    //   CSS adds flex-wrap:wrap so our div wraps below the textarea.
    //
    // Conversation tab: insert inside file-attachment[role="tabpanel"] (the write panel).
    //   GitHub hides this panel when Preview tab is active → our preview hides with it.
    const textareaSpan = container.querySelector(PRitty.Selectors.MD_TEXTAREA_SPAN);
    const writePanel = container.querySelector('file-attachment[role="tabpanel"]');
    if (textareaSpan) {
      // Files Changed tab
      textareaSpan.appendChild(preview);
    } else if (writePanel) {
      // Conversation tab
      writePanel.appendChild(preview);
    } else {
      container.appendChild(preview);
    }

    const render = () => {
      preview.innerHTML = marked.parse(textarea.value || '');
    };

    // Initial render + re-render on focus (catches pre-filled text from edits)
    render();
    textarea.addEventListener('focus', render, { once: true });

    // Debounced input → render
    let timer = null;
    textarea.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(render, this.DEBOUNCE_MS);
    });

    container.classList.add('pritty-quick-preview');
  },
};
