/** Reset any document-level scroll that would shift the fixed app shell. */
export const pinViewportScroll = (): void => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;
};