import { cn } from "../../../lib/cn";
import { stretchKindLabel, formatStretchLabel } from "../../../stretchUtils";
import type { Stretch } from "../../../types";
import { stretchDisplayNumber } from "../../../lib/stretchEdit";
import { formatDistance } from "../../../utils";
import { stretchSelectionListStyles as styles } from "./StretchSelectionList.styles";

type StretchSelectionListProps = {
  stretches: ReadonlyArray<Stretch>;
  selectedStretchIndex: number | null;
  onSelectStretch: (stretch: Stretch) => void;
  onClearSelection: () => void;
  actions?: ReactNode;
  className?: string;
};

/** Map-adjacent stretch selector. Selection state is shown in text as well as colour. */
export const StretchSelectionList = ({
  stretches,
  selectedStretchIndex,
  onSelectStretch,
  onClearSelection,
  actions,
  className,
}: StretchSelectionListProps) => (
  <section className={cn(styles.root, className)} aria-labelledby="stretch-selector-title">
    <div className={styles.header}>
      <div>
        <h3 id="stretch-selector-title" className={styles.title}>Stretches</h3>
        <p className={styles.description}>Suggested from elevation changes; edit them to define your benchmark.</p>
      </div>
      <div className={styles.headerActions}>
        <span className={styles.meta}>
          {stretches.length ? `${stretches.length} total` : "Unavailable"}
        </span>
        {actions}
      </div>
    </div>
    {!stretches.length ? (
      <p className={styles.empty}>No stretches yet. Adjust thresholds below to suggest sections from this route.</p>
    ) : (
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={cn(styles.item, selectedStretchIndex == null && styles.itemSelected)}
            aria-pressed={selectedStretchIndex == null}
            onClick={onClearSelection}
          >
            <span className={styles.number}>All</span>
            <span className={styles.body}>
              <span className={styles.name}>Full segment</span>
              <span className={styles.details}>Compare all included passes</span>
            </span>
            {selectedStretchIndex == null ? <span className={styles.state}>Selected</span> : null}
          </button>
        </li>
        {stretches.map((stretch, arrayIndex) => {
          const selected =
            arrayIndex === selectedStretchIndex || stretch.index === selectedStretchIndex;
          return (
            <li key={stretch.index}>
              <button
                type="button"
                className={cn(styles.item, selected && styles.itemSelected)}
                aria-pressed={selected}
                onClick={() => onSelectStretch(stretch)}
              >
                <span className={styles.number}>{stretchDisplayNumber(arrayIndex)}</span>
                <span className={styles.body}>
                  <span className={styles.name}>{formatStretchLabel(stretch)} · {stretchKindLabel(stretch.kind)}</span>
                  <span className={styles.details}>
                    {formatDistance(stretch.length_m)} · {stretch.avg_grade_pct.toFixed(1)}% grade
                  </span>
                </span>
                {selected ? <span className={styles.state}>Selected</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);
import type { ReactNode } from "react";
