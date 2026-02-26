/**
 * PRitty — Popup Settings
 * Reads/writes feature toggles via chrome.storage.sync.
 * Each checkbox id corresponds directly to a settings key.
 */

const DEFAULTS = {
  commentShortcut: true,
};

const KEYS = Object.keys(DEFAULTS);

chrome.storage.sync.get(DEFAULTS, (stored) => {
  KEYS.forEach(key => {
    const el = document.getElementById(key);
    if (!el) return;

    el.checked = stored[key];

    el.addEventListener('change', () => {
      chrome.storage.sync.set({ [key]: el.checked });
    });
  });
});
