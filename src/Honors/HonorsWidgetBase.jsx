import { useEffect } from "react";

export function useEmbedAutoHeight(deps = []) {
  useEffect(() => {
    // When embedded, make the page background transparent (so the parent page shows through).
    if (window.parent && window.parent !== window) {
      document.documentElement.classList.add("embed");
    }

    const postHeight = () => {
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        html?.clientHeight ?? 0,
        html?.scrollHeight ?? 0,
        html?.offsetHeight ?? 0
      );

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
      if (document.body) ro.observe(document.body);
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

export function HonorsShell({
  title,
  subtitle,
  children,
  headerClassName,
  titleClassName,
  subtitleClassName,
}) {
  const headerCls =
    headerClassName ??
    "bg-gradient-to-r from-yellow-400 to-yellow-300 px-4 sm:px-6 py-4 border-b border-yellow-500";
  const titleCls = titleClassName ?? "text-blue-900 text-center text-xl sm:text-2xl font-bold";
  const subtitleCls = subtitleClassName ?? "mt-1 text-center text-blue-900/80 text-sm";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full max-w-6xl mx-auto border border-gray-200">
      <div className={headerCls}>
        <h2 className={titleCls}>{title}</h2>
        {subtitle ? (
          <div className={subtitleCls}>{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

