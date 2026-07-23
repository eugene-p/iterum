import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Keeps tile alignment when the map container is resized (e.g. collapsible panels). */
export const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const scheduleInvalidate = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          map.invalidateSize({ pan: false, animate: false });
        });
      }, 100);
    };

    const observer = new ResizeObserver(scheduleInvalidate);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
};