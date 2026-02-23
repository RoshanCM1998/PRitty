/**
 * PRitty — Split Diff Resizer
 * Adds a draggable vertical separator between the left/right panes in GitHub PR split view.
 */

PRitty.SplitDiffResizer = {
  ENHANCED_ATTR: "data-pritty-split-resizer",
  _HANDLE_CLASS: "pritty-split-handle",
  _MIN_CODE_PX: 80,
  _splitRatio: 0.5,
  _lastDiffsListWidth: 0,
  _observer: null,
  _resizeObserver: null,
  _diffsList: null,

  _getAllTables() {
    return (this._diffsList || document).querySelectorAll('table[role="grid"]');
  },

  _gutterPx(col) {
    return parseInt(col?.getAttribute("width") || col?.style.width) || 44;
  },

  // Apply ratio to one table. Pass pre-read codeWidth to avoid triggering reflow in hot paths.
  // Returns leftPx set, or -1 if the table was skipped.
  _applyRatioToTable(table, codeWidth) {
    const cols = table.querySelectorAll(":scope > colgroup > col");
    if (cols.length !== 4) return -1;
    if (codeWidth === undefined)
      codeWidth = table.offsetWidth - this._gutterPx(cols[0]) - this._gutterPx(cols[2]);
    if (codeWidth <= 0) return -1;
    const leftPx = Math.round(
      Math.max(this._MIN_CODE_PX, Math.min(codeWidth - this._MIN_CODE_PX, codeWidth * this._splitRatio))
    );
    cols[1].style.width = leftPx + "px";
    cols[3].style.width = codeWidth - leftPx + "px";
    table.style.setProperty("--pritty-left-col", leftPx + "px");
    table.style.setProperty("--pritty-right-col", codeWidth - leftPx + "px");
    return leftPx;
  },

  // Batch-reads all offsetWidths before any writes to avoid layout thrashing (N reflows → 1).
  _applyRatioToAll() {
    const tables = [...this._getAllTables()];
    const data = tables.map((t) => {                          // Phase 1: batch reads
      const cols = t.querySelectorAll(":scope > colgroup > col");
      return {
        codeWidth:  t.offsetWidth - this._gutterPx(cols[0]) - this._gutterPx(cols[2]),
        leftGutter: this._gutterPx(cols[0]),
      };
    });
    for (let i = 0; i < tables.length; i++) {                // Phase 2: all writes
      const leftPx = this._applyRatioToTable(tables[i], data[i].codeWidth);
      if (leftPx < 0) continue;
      const handle = tables[i].parentElement?.querySelector("." + this._HANDLE_CLASS);
      if (handle) handle.style.left = data[i].leftGutter + leftPx + "px";
    }
  },

  _injectHandle(table) {
    const wrapper = table.parentElement;
    if (!wrapper || wrapper.querySelector("." + this._HANDLE_CLASS)) return;

    // cols[1].style.width is already set by _applyRatioToTable called just before this
    const cols = table.querySelectorAll(":scope > colgroup > col");
    const leftGutter  = this._gutterPx(cols[0]);
    const rightGutter = this._gutterPx(cols[2]);
    const leftPx = parseInt(cols[1]?.style.width)
      || Math.round((table.offsetWidth - leftGutter - rightGutter) / 2);

    const handle = document.createElement("div");
    handle.className = this._HANDLE_CLASS;
    handle.setAttribute(PRitty.INJECTED_ATTR, "true");
    handle.insertAdjacentHTML("beforeend", '<div class="pritty-split-handle-line"></div>');
    handle.style.left = leftGutter + leftPx + "px";

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();

      // Read all table widths + handle refs ONCE at drag start.
      // Table widths don't change during drag, so this snapshot stays valid.
      // Avoids the forced synchronous reflow that _applyRatioToAll() causes
      // every RAF frame when it reads offsetWidth after each write.
      const tables = [...this._getAllTables()];
      const snapshot = tables.map((t) => {
        const cols = t.querySelectorAll(":scope > colgroup > col");
        const lg = this._gutterPx(cols[0]);
        const rg = this._gutterPx(cols[2]);
        return {
          table:      t,
          codeWidth:  t.offsetWidth - lg - rg,
          leftGutter: lg,
          handle:     t.parentElement?.querySelector("." + this._HANDLE_CLASS),
        };
      });

      const draggedEntry = snapshot.find((s) => s.table === table);
      if (!draggedEntry || draggedEntry.codeWidth <= 0) return;

      const startX = e.clientX;
      const startRatio = this._splitRatio;
      handle.classList.add("pritty-dragging");
      let rafId = 0;

      const onMouseMove = (e) => {
        this._splitRatio = Math.max(
          0,
          Math.min(1, startRatio + (e.clientX - startX) / draggedEntry.codeWidth)
        );
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // Write-only loop — no offsetWidth reads, no forced reflow.
          for (const { table, codeWidth, leftGutter, handle } of snapshot) {
            const leftPx = this._applyRatioToTable(table, codeWidth);
            if (leftPx >= 0 && handle) handle.style.left = leftGutter + leftPx + "px";
          }
        });
      };

      const onMouseUp = () => {
        cancelAnimationFrame(rafId);
        handle.classList.remove("pritty-dragging");
        this._applyRatioToAll(); // Final pass: fresh reads to normalise any subpixel drift.
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    handle.addEventListener("dblclick", () => {
      this._splitRatio = 0.5;
      this._applyRatioToAll();
    });

    wrapper.appendChild(handle);
  },

  /** Initialize: inject handles into all current split diff tables and start observers. */
  init() {
    const diffsList = document.querySelector('[data-testid="progressive-diffs-list"]');
    if (!diffsList || !document.querySelector("td.right-side-diff-cell")) return;

    this._diffsList = diffsList;
    diffsList.setAttribute(this.ENHANCED_ATTR, "true");

    for (const table of this._getAllTables()) {
      this._applyRatioToTable(table);
      this._injectHandle(table);
    }

    // Watch for lazily-loaded diff tables; skip mutations that added no new tables
    this._observer = new MutationObserver((mutations) => {
      const hasNewTable = mutations.some((m) =>
        [...m.addedNodes].some(
          (n) => n.querySelector?.('table[role="grid"]') || n.matches?.('table[role="grid"]')
        )
      );
      if (!hasNewTable) return;
      for (const table of this._getAllTables()) {
        const wrapper = table.parentElement;
        if (wrapper && !wrapper.querySelector("." + this._HANDLE_CLASS)) {
          this._applyRatioToTable(table);
          this._injectHandle(table);
        }
      }
    });
    this._observer.observe(diffsList, { childList: true, subtree: true });

    // Reapply ratio only when the container WIDTH changes (window/layout resize).
    // Height-only changes (content wrapping) must NOT trigger a re-read of offsetWidth —
    // that causes rounding drift and makes col widths grow on every wrap/unwrap cycle.
    this._lastDiffsListWidth = Math.round(diffsList.getBoundingClientRect().width);
    this._resizeObserver = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === this._lastDiffsListWidth) return;
      this._lastDiffsListWidth = w;
      this._applyRatioToAll();
    });
    this._resizeObserver.observe(diffsList);
  },

  /** Destroy: remove all handles, reset col widths, disconnect observers. */
  destroy() {
    this._observer?.disconnect();
    this._observer = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    document.querySelectorAll("." + this._HANDLE_CLASS).forEach((el) => el.remove());

    for (const table of this._getAllTables()) {
      const cols = table.querySelectorAll(":scope > colgroup > col");
      if (cols.length >= 4) {
        cols[1].style.width = "";
        cols[3].style.width = "";
        table.style.removeProperty("--pritty-left-col");
        table.style.removeProperty("--pritty-right-col");
      }
    }

    this._diffsList?.removeAttribute(this.ENHANCED_ATTR);
    this._diffsList = null;
    this._splitRatio = 0.5;
    this._lastDiffsListWidth = 0;
  },
};
