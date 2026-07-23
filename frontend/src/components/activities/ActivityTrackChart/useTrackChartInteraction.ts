import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

export const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

export type TrackChartHover = {
  fraction: number;
  x: number;
  y: number;
};

type UseTrackChartInteractionOptions = {
  interactive: boolean;
  hoverProbe: boolean;
  onPositionFractionChange?: (fraction: number) => void;
};

export const useTrackChartInteraction = ({
  interactive,
  hoverProbe,
  onPositionFractionChange,
}: UseTrackChartInteractionOptions) => {
  const [hover, setHover] = useState<TrackChartHover | null>(null);

  const fractionFromPointer = useCallback((target: Element, clientX: number) => {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return clampFraction((clientX - rect.left) / rect.width);
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!onPositionFractionChange) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      onPositionFractionChange(fractionFromPointer(event.currentTarget, event.clientX));
    },
    [fractionFromPointer, onPositionFractionChange],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!onPositionFractionChange || !event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      onPositionFractionChange(fractionFromPointer(event.currentTarget, event.clientX));
    },
    [fractionFromPointer, onPositionFractionChange],
  );

  const updateHover = useCallback((target: HTMLDivElement, clientX: number, clientY: number) => {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;
    setHover({
      fraction: clampFraction((clientX - rect.left) / rect.width),
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }, []);

  const handleHoverPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!hoverProbe) return;
      updateHover(event.currentTarget, event.clientX, event.clientY);
    },
    [hoverProbe, updateHover],
  );

  const handleHoverLeave = useCallback(() => {
    setHover(null);
  }, []);

  const wrapHandlers = useMemo(
    () =>
      hoverProbe
        ? {
            onPointerMove: handleHoverPointerMove,
            onPointerLeave: handleHoverLeave,
          }
        : {},
    [handleHoverLeave, handleHoverPointerMove, hoverProbe],
  );

  const svgHandlers = useMemo(
    () =>
      interactive
        ? {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
          }
        : {},
    [handlePointerDown, handlePointerMove, interactive],
  );

  return {
    hover,
    wrapHandlers,
    svgHandlers,
  };
};
