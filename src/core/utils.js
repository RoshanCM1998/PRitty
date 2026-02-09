/**
 * DevHub for GitHub — Utility Functions
 * Shared DOM helpers used by multiple modules.
 */

DevHub.Utils = {

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
        reject(new Error(`[DevHub] Timeout waiting for ${selector}`));
      }, timeout);
    });
  },

  /**
   * Find a tab element by its label text.
   * @param {string} label - Partial text to match (e.g. "Checks", "Files changed")
   * @returns {Element|null}
   */
  findTab(label) {
    return Array.from(document.querySelectorAll(DevHub.Selectors.TAB))
      .find((t) => t.textContent.includes(label)) || null;
  },

  /**
   * Check if an element is inside the DevHub-injected UI.
   * @param {Element} el
   * @returns {boolean}
   */
  isDevHubElement(el) {
    return !!el.closest(`[${DevHub.INJECTED_ATTR}]`);
  },

  /**
   * Find a button by its exact trimmed text content (excludes DevHub UI).
   * @param {string} text - Exact text to match
   * @returns {Element|null}
   */
  findButtonByText(text) {
    return Array.from(document.querySelectorAll("button"))
      .find((b) => !this.isDevHubElement(b) && b.textContent.trim() === text) || null;
  },

  /**
   * Find a button whose text starts with the given prefix (excludes DevHub UI).
   * @param {string} prefix
   * @returns {Element|null}
   */
  findButtonByPrefix(prefix) {
    return Array.from(document.querySelectorAll("button"))
      .find((b) => !this.isDevHubElement(b) && b.textContent.trim().startsWith(prefix)) || null;
  },
};
