import { useCallback, useState, type ReactNode } from "react";
import { EmptySurface, Modal, ModalHeader } from "../../ui";
import { expandableDetailMapStyles as styles } from "./ExpandableDetailMap.styles";

type ExpandableDetailMapProps = {
  title: string;
  hasContent: boolean;
  emptyMessage?: string;
  /** Render the map. Called for the demoted pane, or the modal when expanded (not both). */
  renderMap: () => ReactNode;
  expandLabel?: string;
};

/**
 * Demoted always-on map pane with optional fullscreen expand.
 * Only one map instance mounts at a time (pane or modal) to avoid dual Leaflet.
 */
export const ExpandableDetailMap = ({
  title,
  hasContent,
  emptyMessage = "Loading route…",
  renderMap,
  expandLabel = "Expand",
}: ExpandableDetailMapProps) => {
  const [expanded, setExpanded] = useState(false);
  const openExpand = useCallback(() => setExpanded(true), []);
  const closeExpand = useCallback(() => setExpanded(false), []);

  const mapOrEmpty = hasContent ? (
    renderMap()
  ) : (
    <EmptySurface style={{ height: "100%" }}>{emptyMessage}</EmptySurface>
  );

  return (
    <div className={styles.root}>
      <div className={styles.mapSurface}>
        {!expanded ? mapOrEmpty : null}
        <button
          type="button"
          className={styles.expandBtn}
          onClick={openExpand}
          disabled={!hasContent}
          aria-label={`${expandLabel} map`}
        >
          {expandLabel}
        </button>
      </div>
      <Modal open={expanded} onClose={closeExpand} panelClassName={styles.modalPanel}>
        <ModalHeader title={title} onClose={closeExpand} />
        <div className={styles.modalBody}>
          <div className={styles.modalMap}>{expanded ? mapOrEmpty : null}</div>
        </div>
      </Modal>
    </div>
  );
};

/** Fullscreen-only map modal (when no demoted pane is mounted). */
export const DetailMapModal = ({
  open,
  onClose,
  title,
  hasContent,
  emptyMessage = "Loading route…",
  renderMap,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hasContent: boolean;
  emptyMessage?: string;
  renderMap: () => ReactNode;
}) => (
  <Modal open={open} onClose={onClose} panelClassName={styles.modalPanel}>
    <ModalHeader title={title} onClose={onClose} />
    <div className={styles.modalBody}>
      <div className={styles.modalMap}>
        {hasContent ? (
          renderMap()
        ) : (
          <EmptySurface style={{ height: "100%" }}>{emptyMessage}</EmptySurface>
        )}
      </div>
    </div>
  </Modal>
);
