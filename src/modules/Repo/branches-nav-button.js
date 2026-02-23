/**
 * PRitty — Branches Nav Button
 * Injects a "Branches" tab into GitHub's repository-level nav bar,
 * positioned after the "Code" tab. Works on all repo pages and
 * updates the active state on SPA (Turbo) navigation.
 */

PRitty.BranchesNavButton = {
  NAV_ATTR: 'data-pritty-branches-nav',

  // octicon-git-branch (16px) path data
  BRANCH_ICON_PATH: 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z',

  _getRepoBase() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return `/${parts[0]}/${parts[1]}`;
  },

  _isActive(repoBase) {
    const p = window.location.pathname;
    return p === `${repoBase}/branches` || p.startsWith(`${repoBase}/branches/`);
  },

  // Selector strips data-react-nav/data-hotkey attrs from clone, so this always finds the original
  _getCodeLink(nav) {
    return nav.querySelector('a[data-react-nav="code-view"], a[data-hotkey="g c"]');
  },

  inject() {
    document.querySelector(`[${this.NAV_ATTR}]`)?.remove();

    const repoBase = this._getRepoBase();
    if (!repoBase) return;

    const nav = document.querySelector(PRitty.Selectors.REPO_NAV);
    if (!nav) return;

    const codeLink = this._getCodeLink(nav);
    if (!codeLink) return;
    const codeLi = codeLink.closest('li');
    if (!codeLi) return;

    // Clone Code li — inherits all GitHub CSS classes automatically
    const li = codeLi.cloneNode(true);
    li.setAttribute(PRitty.INJECTED_ATTR, 'true');
    li.setAttribute(this.NAV_ATTR, 'true');

    const a = li.querySelector('a');
    a.href = `${repoBase}/branches`;
    a.removeAttribute('aria-current');
    a.removeAttribute('data-react-nav');
    a.removeAttribute('data-react-nav-anchor');
    a.removeAttribute('data-hotkey');

    // Swap Code icon → git-branch icon (same SVG element, just update class + path)
    const svg = a.querySelector('svg');
    if (svg) {
      svg.classList.remove('octicon-code');
      svg.classList.add('octicon-git-branch');
      const path = svg.querySelector('path');
      if (path) path.setAttribute('d', this.BRANCH_ICON_PATH);
    }

    const textSpan = a.querySelector('[data-component="text"]');
    if (textSpan) {
      textSpan.textContent = 'Branches';
      textSpan.setAttribute('data-content', 'Branches');
    }
    a.querySelector('[data-component="counter"]')?.remove();

    if (this._isActive(repoBase)) {
      a.setAttribute('aria-current', 'page');
    }

    codeLi.insertAdjacentElement('afterend', li);
  },

  init() {
    this.inject();

    let _rafId = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(_rafId);
      _rafId = requestAnimationFrame(() => {
        if (!document.querySelector(`[${this.NAV_ATTR}]`)) {
          this.inject();
        } else {
          const a = document.querySelector(`[${this.NAV_ATTR}] a`);
          if (!a) return;
          const repoBase = this._getRepoBase();
          const active = repoBase && this._isActive(repoBase);
          if (active) {
            if (!a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
          } else {
            if (a.hasAttribute('aria-current')) a.removeAttribute('aria-current');
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
};

// Self-bootstrap (this module has its own content_scripts entry, not orchestrated by content.js)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PRitty.BranchesNavButton.init());
} else {
  PRitty.BranchesNavButton.init();
}
