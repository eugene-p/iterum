import type { SegmentPass } from "../../../types";
import { PassDateProfileRow } from "../../profiles/PassDateProfileRow";
import { CollapsibleSection, MutedSpan, MutedText, Switch } from "../../ui";
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
  <CollapsibleSection
    className={routeExplorerStyles.section}
    bodyClassName={routeExplorerStyles.passSelectorBody}
    title="Matched passes"
    headingLevel="h3"
    titleClassName={routeExplorerStyles.sectionTitle}
    expanded={expanded}
    onToggle={onToggleExpanded}
    meta={
      <MutedSpan className={routeExplorerStyles.sectionToggleMeta}>
        {selectedPassIdSet.size} of {matchedPasses.length} selected
      </MutedSpan>
    }
  >
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
  </CollapsibleSection>
);
