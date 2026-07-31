import { cn } from "../../../lib/cn";
import { screenPlaceholderStyles as styles } from "./ScreenPlaceholder.styles";

type ScreenPlaceholderProps = {
  /** Accessible status label for assistive tech. */
  label?: string;
  className?: string;
};

/** Full-main grayed page chrome while a detail route is transitioning. */
export const ScreenPlaceholder = ({
  label = "Loading…",
  className,
}: ScreenPlaceholderProps) => (
  <div
    className={cn(styles.root, className)}
    role="status"
    aria-busy="true"
    aria-label={label}
  >
    <div className={styles.header} aria-hidden="true">
      <div className={styles.badge} />
      <div className={styles.title} />
      <div className={styles.meta} />
      <div className={styles.action} />
    </div>
    <div className={styles.body} aria-hidden="true">
      <div className={styles.map} />
      <div className={styles.line} />
      <div className={styles.lineShort} />
      <div className={styles.panel} />
    </div>
  </div>
);
