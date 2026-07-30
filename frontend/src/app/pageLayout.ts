import {
  APP_VIEW,
  parseAppLocation,
  parseAppSearchParams,
} from "./appRoutes";
import type { SidebarLayout } from "./appShellTypes";

/** The three application-level presentations owned by the app shell. */
export type PageLayout = "empty" | "data" | "map";

export type ResolvePageLayoutInput = {
  pathname: string;
  search?: string;
  /** A missing profile always wins over a directly-entered detail URL. */
  hasActiveProfile: boolean;
};

const isCreateSegmentPath = (pathname: string): boolean =>
  /^\/activities\/\d+\/segments\/new$/.test(pathname);

/**
 * Resolve shell presentation from URL state and profile readiness.  Screens must
 * not independently choose a shell: this is the single source of truth.
 */
export const resolvePageLayout = ({
  pathname,
  search = "",
  hasActiveProfile,
}: ResolvePageLayoutInput): PageLayout => {
  if (!hasActiveProfile) return "empty";

  if (isCreateSegmentPath(pathname)) return "map";

  const location = parseAppLocation(pathname);
  if (location.type === "list") return "empty";

  const params = parseAppSearchParams(search);
  if (
    location.type === "segment" &&
    (params.view === APP_VIEW.COMPARE || params.view === APP_VIEW.STRETCHES)
  ) {
    return "map";
  }

  return "data";
};

/** Empty pages always expose navigation; task and detail pages can collapse to a rail. */
export const resolveSidebarLayout = (
  pageLayout: PageLayout,
  sidebarExpanded: boolean,
): SidebarLayout => (pageLayout === "empty" || sidebarExpanded ? "full" : "rail");
