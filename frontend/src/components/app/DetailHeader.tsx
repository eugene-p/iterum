import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../ui";
import { detailHeaderStyles as styles } from "./DetailHeader.styles";

type DetailHeaderProps = {
  typeLabel: string;
  title: string;
  metadata?: ReactNode;
  actions?: ReactNode;
  className?: string;
  infoClassName?: string;
  titleClassName?: string;
  metadataClassName?: string;
  actionsClassName?: string;
};

/** Shared stable header for an entity detail screen. Layout can be refined by callers. */
export const DetailHeader = ({
  typeLabel,
  title,
  metadata,
  actions,
  className,
  infoClassName,
  titleClassName,
  metadataClassName,
  actionsClassName,
}: DetailHeaderProps) => (
  <header className={cn(styles.root, className)}>
    <div className={cn(styles.info, infoClassName)}>
      <Badge className={styles.typeBadge}>{typeLabel}</Badge>
      <h1 className={cn(styles.title, titleClassName)} title={title}>{title}</h1>
      {metadata ? <div className={cn(styles.metadata, metadataClassName)}>{metadata}</div> : null}
    </div>
    {actions ? <div className={cn(styles.actions, actionsClassName)}>{actions}</div> : null}
  </header>
);
