export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  const cacheLoadedResources = () => {
    const urls = performance
      .getEntriesByType("resource")
      .map((e) => (e as PerformanceResourceTiming).name)
      .filter((url) => {
        try {
          const u = new URL(url);
          return (
            u.origin === location.origin ||
            u.hostname.endsWith(".gstatic.com") ||
            u.hostname.endsWith(".googleapis.com")
          );
        } catch {
          return false;
        }
      });
    if (!urls.length) return;
    navigator.serviceWorker.ready
      .then((reg) => {
        const sw = navigator.serviceWorker.controller || reg.active;
        sw?.postMessage({ type: "CACHE_URLS", urls });
      })
      .catch(() => {
        /* offline support is best-effort */
      });
  };

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        cacheLoadedResources();
        navigator.serviceWorker.addEventListener("controllerchange", cacheLoadedResources);
      })
      .catch(() => {
        /* offline support is best-effort */
      });
  });
}
