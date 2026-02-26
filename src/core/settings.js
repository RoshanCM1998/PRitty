/**
 * PRitty — Settings
 * Loads user-configured toggles from chrome.storage.sync.
 * Call `await PRitty.Settings.load()` once before reading any values.
 * Then use `PRitty.Settings.get(key)` synchronously throughout the session.
 */

PRitty.Settings = {
  _cache: null,

  defaults: {
    commentShortcut: true,   // Remove "Start a review" + Ctrl+Enter direct comment
    showActionBar: true,     // Show floating action buttons bar
    showConvActivity: false, // Show hidden label/project/milestone events
    convSorting: true,       // Sort conversation timeline newest-first
  },

  async load() {
    const stored = await chrome.storage.sync.get(this.defaults);
    this._cache = { ...this.defaults, ...stored };
  },

  /**
   * Get a setting value synchronously (after load() has resolved).
   * Falls back to defaults if load() hasn't been called yet.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this._cache?.[key] ?? this.defaults[key];
  },
};
