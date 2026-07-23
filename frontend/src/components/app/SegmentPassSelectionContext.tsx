import { createContext, useContext, type ReactNode } from "react";
import { useSegmentPassSelection } from "../../app/useSegmentPassSelection";
import type { AppLocation, AppSearchParams } from "../../app/appRoutes";
import type { StretchPassMetrics } from "../../stretchUtils";
import type { SegmentCompare, SegmentPass, Stretch, TrackPoint } from "../../types";

type SegmentPassSelectionValue = {
  selectedPassIds: ReadonlyArray<number>;
  includedPassIdSet: ReadonlySet<number>;
  fullPassMetrics: StretchPassMetrics[];
  stretchPassMetrics: StretchPassMetrics[];
  setPassIncluded: (pass: SegmentPass, included: boolean) => void;
  excludePass: (pass: SegmentPass) => void;
  applyPassSelection: (ids: ReadonlyArray<number>) => void;
};

const SegmentPassSelectionContext = createContext<SegmentPassSelectionValue | null>(null);

type SegmentPassSelectionProviderProps = {
  segmentId: number;
  comparison: SegmentCompare | null;
  selectedStretch: Stretch | null;
  activityTracks: Record<number, TrackPoint[]>;
  pathname: string;
  location: AppLocation;
  searchParams: AppSearchParams;
  children: ReactNode;
};

export const SegmentPassSelectionProvider = ({
  children,
  ...options
}: SegmentPassSelectionProviderProps) => {
  const value = useSegmentPassSelection(options);
  return (
    <SegmentPassSelectionContext.Provider value={value}>
      {children}
    </SegmentPassSelectionContext.Provider>
  );
};

export const useSegmentPassSelectionContext = (): SegmentPassSelectionValue => {
  const value = useContext(SegmentPassSelectionContext);
  if (!value) {
    throw new Error("useSegmentPassSelectionContext requires SegmentPassSelectionProvider");
  }
  return value;
};