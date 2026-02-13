/**
 * PRitty — Scroll to Top Button
 * Floating button at the bottom-right corner to scroll back to top.
 */

PRitty.ScrollTop = {
  create() {
    if (document.querySelector(".pritty-scroll-top")) return;

    const btn = document.createElement("button");
    btn.className = "pritty-scroll-top";
    btn.setAttribute(PRitty.INJECTED_ATTR, "true");
    btn.setAttribute("aria-label", "Scroll to top");
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">' +
      '<path d="M3.22 9.78a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018L8 6.06 4.28 9.78a.75.75 0 0 1-1.06 0Z"/>' +
      "</svg>";

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.body.appendChild(btn);
  },
};
