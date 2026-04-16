/**
 * PRitty — Markdown Blob Preview
 * Toggles enhanced styling for .md file previews on repo pages.
 * Controlled by the `markdownBlobPreview` setting (toggle in popup).
 *
 * Strategy:
 * - CSS rules in markdown-blob-preview.css are scoped under body.pritty-md-blob-preview
 * - This module reads the setting and adds/removes the class on <body>
 * - MutationObserver re-applies the class on SPA (Turbo) navigation
 */

PRitty.MarkdownBlobPreview = {
  BODY_CLASS: 'pritty-md-blob-preview',

  async init() {
    await PRitty.Settings.load();

    if (PRitty.Settings.get('markdownBlobPreview')) {
      document.body.classList.add(this.BODY_CLASS);
    }

    // Re-apply on SPA navigation (GitHub Turbo may reset body classes)
    let _rafId = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(() => {
        const enabled = PRitty.Settings.get('markdownBlobPreview');
        document.body.classList.toggle(this.BODY_CLASS, enabled);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
};

// Self-bootstrap (this module has its own content_scripts entry, not orchestrated by content.js)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PRitty.MarkdownBlobPreview.init());
} else {
  PRitty.MarkdownBlobPreview.init();
}
