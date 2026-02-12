# Scroll to Top Button

**Files:** `src/modules/scroll-top.js`, `styles/base.css`
**Module:** `DevHub.ScrollTop`

## What It Does

A small circular floating button fixed to the bottom-right corner of the page. Clicking it smoothly scrolls the page back to the top. Useful on long PR conversations.

## How It Works

### Creation (`create()`)

```js
DevHub.ScrollTop = {
  create() {
    // 1. Guard: skip if .devhub-scroll-top already exists
    if (document.querySelector(".devhub-scroll-top")) return;

    // 2. Create button element
    const btn = document.createElement("button");
    btn.className = "devhub-scroll-top";
    btn.setAttribute(DevHub.INJECTED_ATTR, "true");  // marks as DevHub element
    btn.setAttribute("aria-label", "Scroll to top");
    btn.innerHTML = /* upward chevron SVG (16x16) */;

    // 3. Click handler: smooth scroll to top
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 4. Append to document.body
    document.body.appendChild(btn);
  }
};
```

The SVG icon is an upward-pointing chevron arrow, defined inline.

### Lifecycle

- Created once by `content.js` during `init()`
- The duplicate guard (`querySelector` check) prevents multiple buttons if `create()` is called again
- Marked with `data-devhub-injected` so it gets cleaned up during re-injection via `inject()` in `content.js`

## CSS (in `base.css`)

```css
.devhub-scroll-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;           /* circular */
  border: 1px solid #d0d7de;
  background: #f6f8fa;          /* light gray */
  color: #656d76;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  z-index: 99;
  opacity: 0.6;                 /* subtle by default */
  transition: opacity 0.15s ease;
}

.devhub-scroll-top:hover {
  opacity: 1;                   /* fully visible on hover */
}
```

## Dependencies

- `DevHub.INJECTED_ATTR` — for cleanup tagging
- No other module dependencies (fully standalone)
