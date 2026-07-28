import { PassIncludeControl } from "../../segments/PassIncludeControl";
import type { SegmentPass } from "../../../types";
import { passIdentityColorForPass } from "../passIdentityColors";

type PassSelectorProps = {
  matchedPasses: SegmentPass[];
  selectedPassIdSet: ReadonlySet<number>;
  onSetPassIncluded: (pass: SegmentPass, included: boolean) => void;
  onApplySelection: (ids: ReadonlyArray<number>) => void;
};

export const PassSelector = ({
  matchedPasses,
  selectedPassIdSet,
  onSetPassIncluded,
  onApplySelection,
}: PassSelectorProps) => (
  <PassIncludeControl
    matchedPasses={matchedPasses}
    includedPassIdSet={selectedPassIdSet}
    onSetPassIncluded={onSetPassIncluded}
    onApplySelection={onApplySelection}
    passColorForId={(passId) => passIdentityColorForPass(passId, matchedPasses)}
  />
);
