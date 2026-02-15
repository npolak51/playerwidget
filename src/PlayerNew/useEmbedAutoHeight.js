import { useEffect } from "react";

// Local copy (isolated to PlayerNew/) so this folder is easy to revert later.
export function useEmbedAutoHeight(deps = []) {
  useEffect(() => {
    // When embedded, make the page background transparent (so the parent page shows through).
    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add("embed");
    }

    const postHeight = () => {
      const root = document.getElementById("root");
      const height = root ? root.scrollHeight : document.body.scrollHeight;

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "playerwidget:height", height }, "*");
      }
    };

    postHeight();
    const raf = window.requestAnimationFrame(postHeight);
    const t = window.setTimeout(postHeight, 250);

    window.addEventListener("resize", postHeight);
    window.addEventListener("load", postHeight);

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => postHeight());
      const root = document.getElementById("root");
      if (root) ro.observe(root);
      else if (document.body) ro.observe(document.body);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", postHeight);
      window.removeEventListener("load", postHeight);
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

