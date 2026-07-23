export type PopoverPlacement = {
  top: number;
  left: number;
  width: number;
};

export const computePopoverPlacement = (
  anchorRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
): PopoverPlacement => {
  const top = Math.max(12, Math.min(anchorRect.top, window.innerHeight - popoverHeight - 12));
  let left = anchorRect.right + 12;
  if (left + popoverWidth > window.innerWidth - 12) {
    left = Math.max(12, anchorRect.left - popoverWidth - 12);
  }
  return { top, left, width: popoverWidth };
};