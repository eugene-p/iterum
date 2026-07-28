import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { appStyles } from "../../App.styles";
import { AppEmptyMain } from "../../components/app";
import { LoadingState } from "../../components/ui/LoadingState/LoadingState";

const ActivityScreenContainer = lazy(() =>
  import("./ActivityScreenContainer").then((module) => ({
    default: module.ActivityScreenContainer,
  })),
);

const CreateSegmentScreenContainer = lazy(() =>
  import("./CreateSegmentScreenContainer").then((module) => ({
    default: module.CreateSegmentScreenContainer,
  })),
);

const SegmentScreenContainer = lazy(() =>
  import("./SegmentScreenContainer").then((module) => ({
    default: module.SegmentScreenContainer,
  })),
);

const ScreenFallback = () => <LoadingState message="Loading…" className="h-full" />;

const RedirectEditSegment = () => {
  const { segmentId } = useParams();
  return <Navigate to={`/segments/${segmentId}`} replace />;
};

export const ScreenRouter = () => (
  <div className={appStyles.screenOutlet}>
    <Suspense fallback={<ScreenFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/segments" replace />} />
        <Route path="/segments" element={<AppEmptyMain />} />
        <Route path="/activities" element={<AppEmptyMain />} />
        <Route path="/activities/:activityId" element={<ActivityScreenContainer />} />
        <Route
          path="/activities/:activityId/segments/new"
          element={<CreateSegmentScreenContainer />}
        />
        <Route path="/segments/:segmentId" element={<SegmentScreenContainer />} />
        <Route path="/segments/:segmentId/edit" element={<RedirectEditSegment />} />
        <Route path="/segments/:segmentId/subset" element={<RedirectEditSegment />} />
      </Routes>
    </Suspense>
  </div>
);
