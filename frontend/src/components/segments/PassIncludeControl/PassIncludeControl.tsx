import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { defaultSelectedPassIds } from "../../../lib/defaultSelectedPasses";
import { formatRelativePast } from "../../../lib/formatRelativePast";
import {
  applyPassSelectMode,
  filterPassesByQuery,
  isSimplePassSelectionPath,
  sortPasses,
  type PassListSort,
  type PassSelectMode,
} from "../../../lib/passSelectModes";
import type { SegmentPass } from "../../../types";
import { formatDuration } from "../../../utils";
import { Button, CollapsibleSection, MutedSpan, Switch } from "../../ui";
import { passIncludeControlStyles as styles } from "./PassIncludeControl.styles";

type PassIncludeControlProps = {
  matchedPasses: ReadonlyArray<SegmentPass>;
  includedPassIdSet: ReadonlySet<number>;
  onSetPassIncluded: (pass: SegmentPass, included: boolean) => void;
  onApplySelection: (ids: ReadonlyArray<number>) => void;
  passColorForId?: (passId: number) => string | undefined;
  className?: string;
};

const MENU_OFFSET_PX = 4;

const MODE_BUTTONS: ReadonlyArray<{ mode: PassSelectMode; label: string }> = [
  { mode: "default", label: "Default" },
  { mode: "fastest", label: "Fastest" },
  { mode: "latest", label: "Latest" },
  { mode: "spaced2w", label: "~2 weeks" },
  { mode: "spaced1mo", label: "~1 month" },
  { mode: "all", label: "All" },
];

const sameIdSet = (
  selected: ReadonlyArray<number>,
  expected: ReadonlyArray<number>,
): boolean => {
  if (selected.length !== expected.length) return false;
  const expectedSet = new Set(expected);
  return selected.every((id) => expectedSet.has(id));
};

const passDateIso = (pass: SegmentPass): string | null => {
  if (pass.started_at && Number.isFinite(Date.parse(pass.started_at))) return pass.started_at;
  if (pass.created_at && Number.isFinite(Date.parse(pass.created_at))) return pass.created_at;
  return null;
};

const passWhenLabel = (pass: SegmentPass): string => {
  const iso = passDateIso(pass);
  if (!iso) return "—";
  return formatRelativePast(iso) ?? "—";
};

const computePopoverPlacement = (
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
): { top: number; left: number } => {
  let left = anchorRect.left;
  left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

  let top = anchorRect.bottom + MENU_OFFSET_PX;
  if (top + menuHeight > window.innerHeight - 12) {
    top = Math.max(12, anchorRect.top - menuHeight - MENU_OFFSET_PX);
  }

  return { top, left };
};

const PassRow = ({
  pass,
  included,
  onSetPassIncluded,
  color,
}: {
  pass: SegmentPass;
  included: boolean;
  onSetPassIncluded: (pass: SegmentPass, included: boolean) => void;
  color?: string;
}) => (
  <div className={styles.row}>
    <Switch
      size="sm"
      checked={included}
      aria-label={`Include ${pass.activity_name}`}
      onChange={(e) => onSetPassIncluded(pass, e.target.checked)}
    />
    {color ? (
      <span className={styles.chipDot} style={{ background: color }} aria-hidden />
    ) : null}
    <div className={styles.rowBody}>
      <div className={styles.rowTitle}>
        {pass.activity_name}
        {pass.pass_number > 1 ? <MutedSpan> · pass {pass.pass_number}</MutedSpan> : null}
      </div>
      <div className={styles.rowMeta}>
        <span>{formatDuration(pass.duration_sec)}</span>
        <span>{passWhenLabel(pass)}</span>
      </div>
    </div>
  </div>
);

export const PassIncludeControl = ({
  matchedPasses,
  includedPassIdSet,
  onSetPassIncluded,
  onApplySelection,
  passColorForId,
  className,
}: PassIncludeControlProps) => {
  const matchedCount = matchedPasses.length;
  const matchedActivityCount = useMemo(
    () => new Set(matchedPasses.map((pass) => pass.activity_id)).size,
    [matchedPasses],
  );
  const includedPasses = useMemo(
    () => matchedPasses.filter((pass) => includedPassIdSet.has(pass.id)),
    [matchedPasses, includedPassIdSet],
  );
  const defaultIds = useMemo(() => defaultSelectedPassIds(matchedPasses), [matchedPasses]);
  const selectedIds = useMemo(() => includedPasses.map((pass) => pass.id), [includedPasses]);
  const isDefault = sameIdSet(selectedIds, defaultIds);
  const simplePath = isSimplePassSelectionPath(matchedCount);

  const [pickerOpen, setPickerOpen] = useState(false);
  /** Simple path (≤5): collapsed by default; expand only when changing includes. */
  const [simpleListOpen, setSimpleListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PassListSort>("latest");
  const [placement, setPlacement] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const closePicker = () => {
    setPickerOpen(false);
    setPlacement(null);
    setQuery("");
    triggerRef.current?.focus();
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!pickerOpen) return;
    const anchor = triggerRef.current;
    const panel = panelRef.current;
    if (!anchor) return;
    const anchorRect = anchor.getBoundingClientRect();
    const menuWidth = panel?.offsetWidth ?? 360;
    const menuHeight = panel?.offsetHeight ?? 0;
    setPlacement(computePopoverPlacement(anchorRect, menuWidth, menuHeight));
  }, [pickerOpen, query, sort, includedPassIdSet, matchedPasses]);

  useLayoutEffect(() => {
    if (!pickerOpen) return;
    searchInputRef.current?.focus();
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;

    const syncPlacement = () => {
      const anchor = triggerRef.current;
      const panel = panelRef.current;
      if (!anchor) return;
      const anchorRect = anchor.getBoundingClientRect();
      const menuWidth = panel?.offsetWidth ?? 360;
      const menuHeight = panel?.offsetHeight ?? 0;
      setPlacement(computePopoverPlacement(anchorRect, menuWidth, menuHeight));
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closePicker();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", syncPlacement);
    window.addEventListener("scroll", syncPlacement, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", syncPlacement);
      window.removeEventListener("scroll", syncPlacement, true);
    };
  }, [pickerOpen]);

  const pickerPasses = useMemo(() => {
    const filtered = filterPassesByQuery(matchedPasses, query);
    return sortPasses(filtered, sort);
  }, [matchedPasses, query, sort]);

  const includedInPicker = pickerPasses.filter((pass) => includedPassIdSet.has(pass.id));
  const excludedInPicker = pickerPasses.filter((pass) => !includedPassIdSet.has(pass.id));

  const handleMode = (mode: PassSelectMode) => {
    const next = applyPassSelectMode(matchedPasses, mode);
    // Empty mode result (undated / no durations): keep current selection.
    if (!next.length) return;
    if (sameIdSet(next, selectedIds)) return;
    onApplySelection(next);
  };

  /** Keep the summary bar one row tall; full list is in the picker. */
  const CHIP_VISIBLE_MAX = 3;
  const visibleChips = includedPasses.slice(0, CHIP_VISIBLE_MAX);
  const hiddenChipCount = Math.max(0, includedPasses.length - CHIP_VISIBLE_MAX);

  const openPicker = () => setPickerOpen(true);

  const metaLabel = simplePath
    ? `${includedPassIdSet.size} of ${matchedCount} included`
    : isDefault
      ? `Default · ${includedPassIdSet.size} of ${matchedCount}`
      : `${includedPassIdSet.size} of ${matchedCount} included`;
  const activitySummary = `${matchedActivityCount} matched ${
    matchedActivityCount === 1 ? "activity" : "activities"
  } · ${matchedCount} ${matchedCount === 1 ? "pass" : "passes"}`;

  if (!matchedCount) {
    return (
      <div className={cn(styles.root, className)}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Matched activities</h2>
        </div>
        <p className={styles.empty}>No matched activities yet.</p>
      </div>
    );
  }

  if (simplePath) {
    return (
      <CollapsibleSection
        variant="panel"
        title="Matched activities"
        headingLevel="h2"
        expanded={simpleListOpen}
        onToggle={() => setSimpleListOpen((open) => !open)}
        meta={`${activitySummary} · ${metaLabel}`}
        className={className}
        bodyClassName={styles.simpleList}
      >
        {matchedPasses.map((pass) => (
          <PassRow
            key={pass.id}
            pass={pass}
            included={includedPassIdSet.has(pass.id)}
            onSetPassIncluded={onSetPassIncluded}
            color={passColorForId?.(pass.id)}
          />
        ))}
      </CollapsibleSection>
    );
  }

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Matched activities</h2>
        <span className={styles.sectionCaption}>{activitySummary}</span>
      </div>
      <div className={styles.bar}>
        <span className={styles.meta}>{metaLabel}</span>
        <div className={styles.chips}>
          {visibleChips.map((pass) => (
            <span
              key={pass.id}
              className={styles.chip}
              title={`${pass.activity_name} · ${formatDuration(pass.duration_sec)}`}
            >
              {passColorForId ? (
                <span
                  className={styles.chipDot}
                  style={{ background: passColorForId(pass.id) }}
                  aria-hidden
                />
              ) : null}
              <span className={styles.chipLabel}>
                {pass.activity_name}
                {pass.pass_number > 1 ? ` · ${pass.pass_number}` : ""}
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Exclude ${pass.activity_name}`}
                onClick={() => onSetPassIncluded(pass, false)}
              >
                ×
              </button>
            </span>
          ))}
          {hiddenChipCount > 0 ? (
            <button
              type="button"
              className={styles.chipOverflow}
              title="Show all included passes"
              aria-label={`${hiddenChipCount} more included passes`}
              onClick={openPicker}
            >
              +{hiddenChipCount}
            </button>
          ) : null}
        </div>
        <div className={styles.barActions}>
          {!isDefault && (
            <Button size="sm" onClick={() => handleMode("default")}>
              Reset
            </Button>
          )}
          <Button
            ref={triggerRef}
            size="sm"
            variant="primary"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            aria-controls={pickerOpen ? panelId : undefined}
            onClick={() => {
              if (pickerOpen) closePicker();
              else openPicker();
            }}
          >
            Change…
          </Button>
        </div>
      </div>

      {pickerOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Choose matched passes"
            className={styles.popover}
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              visibility: placement ? "visible" : "hidden",
            }}
          >
            <div className={styles.popoverHead}>
              <div className={styles.popoverTools}>
                <input
                  ref={searchInputRef}
                  className={styles.search}
                  type="search"
                  placeholder="Search activity…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search activities"
                />
                <select
                  className={styles.sort}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as PassListSort)}
                  aria-label="Sort passes"
                >
                  <option value="latest">Latest</option>
                  <option value="fastest">Fastest</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className={styles.modes}>
                {MODE_BUTTONS.map(({ mode, label }) => (
                  <Button
                    key={mode}
                    size="sm"
                    className={styles.modeBtn}
                    onClick={() => handleMode(mode)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className={styles.popoverList}>
              {includedInPicker.length > 0 && (
                <>
                  <div className={styles.groupLabel}>Included ({includedInPicker.length})</div>
                  {includedInPicker.map((pass) => (
                    <PassRow
                      key={pass.id}
                      pass={pass}
                      included
                      onSetPassIncluded={onSetPassIncluded}
                      color={passColorForId?.(pass.id)}
                    />
                  ))}
                </>
              )}
              {excludedInPicker.length > 0 && (
                <>
                  <div className={styles.groupLabel}>Not included ({excludedInPicker.length})</div>
                  {excludedInPicker.map((pass) => (
                    <PassRow
                      key={pass.id}
                      pass={pass}
                      included={false}
                      onSetPassIncluded={onSetPassIncluded}
                      color={passColorForId?.(pass.id)}
                    />
                  ))}
                </>
              )}
              {!pickerPasses.length && (
                <p className={styles.empty}>No passes match this search.</p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
