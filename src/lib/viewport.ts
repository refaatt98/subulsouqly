/**
 * Keeps CSS vars in sync with the *visual* viewport so fixed bottom UI
 * never hides behind mobile browser toolbars or embedded/iframe chrome.
 *
 * --app-h     : usable height (px)
 * --vv-bottom : distance from layout-viewport bottom to visual-viewport bottom
 */
export function trackViewport() {
  const root = document.documentElement;

  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }
  if (embedded) root.classList.add("is-embedded");

  // Extra clearance for the iOS Safari bottom toolbar, which overlays the
  // layout viewport. Inside an iframe the frame box is the visible area, so
  // no extra gap is needed there.
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|od|ad)/.test(ua) || (/Mac/.test(ua) && "ontouchend" in document);
  const isSmallTouch = window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error legacy iOS flag
    navigator.standalone === true;
  const chromeGap = !embedded && !standalone && isIOS && isSmallTouch ? 56 : 0;
  root.style.setProperty("--chrome-gap", `${chromeGap}px`);


  const apply = () => {
    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const bottomGap = vv
      ? Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)))
      : 0;

    root.style.setProperty("--app-h", `${Math.round(height)}px`);
    root.style.setProperty("--vv-bottom", `${bottomGap}px`);
  };

  apply();


  const vv = window.visualViewport;
  vv?.addEventListener("resize", apply);
  vv?.addEventListener("scroll", apply);
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
}
