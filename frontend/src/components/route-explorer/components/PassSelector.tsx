import type { SegmentPass } from "../../../types";
import { PassDateProfileRow } from "../../profiles/PassDateProfileRow";
import { MutedSpan, MutedText, Switch } from "../../ui";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

type PassSelectorProps = {
  matchedPasses: SegmentPass[];
  selectedPassIdSet: ReadonlySet<number>;
  expanded: boolean;
  onToggleExpanded: () => void;
  onSetPassIncluded: (pass: SegmentPass, included: boolean) => void;
};

export const PassSelector = ({
  matchedPasses,
  selectedPassIdSet,
  expanded,
  onToggleExpanded,
  onSetPassIncluded,
}: PassSelectorProps) => (
  <section className={`${routeExplorerStyles.section} ${routeExplorerStyles.sectionCollapsible}`}>
    <button
      type="button"
      className={routeExplorerStyles.sectionToggle}
      aria-expanded={expanded}
      onClick={onToggleExpanded}
    >
      <span className={routeExplorerStyles.sectionToggleMain}>
        <h3 className={routeExplorerStyles.sectionTitle}>Matched passes</h3>
        <MutedText className={routeExplorerStyles.sectionToggleMeta}>
          {selectedPassIdSet.size} of {matchedPasses.length} selected
        </MutedText>
      </span>
      <span className={routeExplorerStyles.sectionChevron} aria-hidden="true">
        {expanded ? "▾" : "▸"}
      </span>
    </button>
    {expanded && (
      <>
        <MutedText className={routeExplorerStyles.sectionHint}>
          Choose which activities to compare at each position and time.
        </MutedText>
        <div className={routeExplorerStyles.passSwitches}>
          {matchedPasses.map((pass) => (
            <Switch
              key={pass.id}
              className={routeExplorerStyles.passSwitch}
              size="sm"
              checked={selectedPassIdSet.has(pass.id)}
              onChange={(e) => onSetPassIncluded(pass, e.target.checked)}
              label={
                <span className={routeExplorerStyles.passSwitchLabel}>
                  <span>
                    {pass.activity_name}
                    {pass.pass_number > 1 && <MutedSpan> · pass {pass.pass_number}</MutedSpan>}
                  </span>
                  <PassDateProfileRow
                    pass={pass}
                    className={routeExplorerStyles.passDateTime}
                    started_at={pass.started_at}
                    name={pass.activity_name}
                    source_filename={pass.source_filename}
                  />
                </span>
              }
            />
          ))}
        </div>
      </>
    )}
  </section>
);