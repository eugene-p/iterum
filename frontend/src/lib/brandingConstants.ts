export const APP_NAME = "Iterum";
export const APP_TAGLINE = "Import • Define • Compare";

/** Browser tab title. Pass `pageTitle` later for route-specific titles. */
export const buildDocumentTitle = (pageTitle?: string): string =>
  pageTitle ? `${pageTitle} · ${APP_NAME}` : `${APP_NAME} · ${APP_TAGLINE}`;

export const applyDocumentTitle = (pageTitle?: string) => {
  document.title = buildDocumentTitle(pageTitle);
};
