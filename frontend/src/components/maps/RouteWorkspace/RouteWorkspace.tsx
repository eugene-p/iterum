import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { routeWorkspaceStyles as styles } from "./RouteWorkspace.styles";

type RouteWorkspaceProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  sidePanel?: ReactNode;
  children: ReactNode;
  className?: string;
  workspaceClassName?: string;
  mapClassName?: string;
  sidePanelClassName?: string;
  overlayClassName?: string;
};

/** A compact, expandable map workspace with its route action in context. */
export const RouteWorkspace = ({
  title,
  description,
  action,
  sidePanel,
  children,
  className,
  workspaceClassName,
  mapClassName,
  sidePanelClassName,
  overlayClassName,
}: RouteWorkspaceProps) => (
  <section className={cn(styles.root, className)} aria-labelledby="route-workspace-title">
    <div className={cn(styles.workspace, sidePanel && styles.workspaceWithSidePanel, workspaceClassName)}>
      <div className={cn(styles.mapPane, mapClassName)}>
        {children}
      <div className={cn(styles.overlay, overlayClassName)}>
        <h2 id="route-workspace-title" className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
      </div>
      {sidePanel ? <aside className={cn(styles.sidePanel, sidePanelClassName)}>{sidePanel}</aside> : null}
    </div>
  </section>
);
