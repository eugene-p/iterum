import { useMemo } from "react";
import { Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { TrackPoint } from "../../../types";

type PathHighlightProps = {
  points: TrackPoint[];
  glowColor: string;
  lineColor: string;
  glowWeight?: number;
  lineWeight?: number;
  glowOpacity?: number;
  lineOpacity?: number;
  dashed?: boolean;
};

export const PathHighlight = ({
  points,
  glowColor,
  lineColor,
  glowWeight = 18,
  lineWeight = 5,
  glowOpacity = 0.32,
  lineOpacity = 0.95,
  dashed = false,
}: PathHighlightProps) => {
  const positions = useMemo(
    () => points.map((p) => [p.lat, p.lon] as LatLngExpression),
    [points],
  );

  if (positions.length < 2) return null;

  return (
    <>
      <Polyline
        positions={positions}
        color={glowColor}
        weight={glowWeight}
        opacity={glowOpacity}
        interactive={false}
        lineCap="round"
        lineJoin="round"
      />
      <Polyline
        positions={positions}
        color={lineColor}
        weight={lineWeight}
        opacity={lineOpacity}
        interactive={false}
        lineCap="round"
        lineJoin="round"
        dashArray={dashed ? "10 8" : undefined}
      />
    </>
  );
};