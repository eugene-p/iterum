import { useLayoutEffect } from "react";
import { pinViewportScroll } from "../lib/pinViewportScroll";

/** Keep the viewport pinned so nested panels are the only scroll surfaces. */
export const usePinViewportScroll = (): void => {
  useLayoutEffect(() => {
    pinViewportScroll();
    const onScroll = () => pinViewportScroll();
    window.addEventListener("scroll", onScroll, { capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);
};