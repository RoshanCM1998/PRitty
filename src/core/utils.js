/**
 * PRitty — Utility Functions
 * Shared DOM helpers used by multiple modules.
 */

PRitty.Utils = {

  /**
   * Wait for an element to appear in the DOM.
   * @param {string} selector - CSS selector to wait for
   * @param {number} timeout  - Max wait in ms (default 10s)
   * @returns {Promise<Element>}
   */
  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`[PRitty] Timeout waiting for ${selector}`));
      }, timeout);
    });
  },

  /**
   * Find a tab element by its label text.
   * @param {string} label - Partial text to match (e.g. "Checks", "Files changed")
   * @returns {Element|null}
   */
  findTab(label) {
    return Array.from(document.querySelectorAll(PRitty.Selectors.TAB))
      .find((t) => t.textContent.includes(label)) || null;
  },

  /**
   * Check if an element is inside the PRitty-injected UI.
   * @param {Element} el
   * @returns {boolean}
   */
  isPRittyElement(el) {
    return !!el.closest(`[${PRitty.INJECTED_ATTR}]`);
  },

  /**
   * Find a button by its exact trimmed text content (excludes PRitty UI).
   * @param {string} text - Exact text to match
   * @returns {Element|null}
   */
  findButtonByText(text) {
    return Array.from(document.querySelectorAll("button"))
      .find((b) => !this.isPRittyElement(b) && b.textContent.trim() === text) || null;
  },

  /**
   * Find a button whose text starts with the given prefix (excludes PRitty UI).
   * @param {string} prefix
   * @returns {Element|null}
   */
  findButtonByPrefix(prefix) {
    return Array.from(document.querySelectorAll("button"))
      .find((b) => !this.isPRittyElement(b) && b.textContent.trim().startsWith(prefix)) || null;
  },

  /**
   * Scroll an element into view and click it immediately.
   * Uses instant scroll — no timing delays needed.
   * @param {Element} el - The element to scroll to and click
   */
  scrollAndClick(el) {
    el.scrollIntoView({ block: "center" });
    el.click();
  },
};
