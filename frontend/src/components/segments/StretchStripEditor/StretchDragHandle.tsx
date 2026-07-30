import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { stretchStripEditorStyles as styles } from "./StretchStripEditor.styles";

type StretchDragHandleProps = {
  /** Inclusive distance range the handle may occupy. */
  minM: number;
  maxM: number;
  valueM: number;
  ariaLabel: string;
  /**
   * Track element that defines the horizontal range for mapping clientX → meters
   * and for positioning the handle (0–1 along that track).
   */
  trackRef: RefObject<HTMLElement | null>;
  onChange: (distanceM: number) => void;
  /** Fired when the user finishes a drag (pointer up). */
  onDragEnd?: () => void;
};

/** Thin draggable grip positioned along a track by path distance. */
export const StretchDragHandle = ({
  minM,
  maxM,
  valueM,
  ariaLabel,
  trackRef,
  onChange,
  onDragEnd,
}: StretchDragHandleProps) => {
  const handleRef = useRef<HTMLButtonElement>(null);

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return valueM;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return valueM;
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const span = maxM - minM;
      if (span <= 0) return minM;
      return minM + t * span;
    },
    [maxM, minM, valueM, trackRef],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(valueFromClientX(event.clientX));
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onChange(valueFromClientX(event.clientX));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onDragEnd?.();
  };

  const span = Math.max(maxM - minM, 1e-6);
  const fraction = Math.max(0, Math.min(1, (valueM - minM) / span));

  return (
    <button
      ref={handleRef}
      type="button"
      className={styles.handle}
      style={{ left: `${fraction * 100}%` }}
      aria-label={ariaLabel}
      aria-valuemin={minM}
      aria-valuemax={maxM}
      aria-valuenow={valueM}
      role="slider"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
};
