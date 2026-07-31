import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { appStyles } from "../../App.styles";
import { AppEmptyMain } from "../../components/app";
import { ScreenPlaceholder } from "../../components/ui/ScreenPlaceholder";
import type { PageLayout } from "../pageLayout";

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

const ScreenFallback = () => <ScreenPlaceholder />;

const RedirectEditSegment = () => {
  const { segmentId } = useParams();
  return <Navigate to={`/segments/${segmentId}`} replace />;
};

export const ScreenRouter = ({ pageLayout }: { pageLayout: PageLayout }) => {
  const routeContent = (content: ReactNode) =>
    pageLayout === "empty" ? <AppEmptyMain /> : content;

  return (
    <div className={appStyles.screenOutlet}>
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/segments" replace />} />
          <Route path="/segments" element={<AppEmptyMain />} />
          <Route path="/activities" element={<AppEmptyMain />} />
          <Route
            path="/activities/:activityId"
            element={routeContent(<ActivityScreenContainer />)}
          />
          <Route
            path="/activities/:activityId/segments/new"
            element={routeContent(<CreateSegmentScreenContainer />)}
          />
          <Route
            path="/segments/:segmentId"
            element={routeContent(<SegmentScreenContainer />)}
          />
          <Route
            path="/segments/:segmentId/edit"
            element={routeContent(<RedirectEditSegment />)}
          />
          <Route
            path="/segments/:segmentId/subset"
            element={routeContent(<RedirectEditSegment />)}
          />
        </Routes>
      </Suspense>
    </div>
  );
};
