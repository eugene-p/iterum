import { useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { TrackPoint } from "../../../types";
import { FitBounds } from "../shared/FitBounds";
import { MapResizeHandler } from "../shared/MapResizeHandler";
import { IndexClickHandler } from "../shared/MapClickHandler";
import { PathHighlight } from "../shared/PathHighlight";
import { routeExplorerMapStyles } from "./RouteExplorerMap.styles";

export type StretchOverlay = {
  id: number;
  points: TrackPoint[];
  color: string;
};

export type ExplorerMarker = {
  id: string | number;
  point: TrackPoint;
  color: string;
  label?: string;
};

type RouteExplorerMapProps = {
  routePoints: TrackPoint[];
  highlightPoints?: TrackPoint[];
  stretchOverlays?: StretchOverlay[];
  markers: ExplorerMarker[];
  onPositionClick?: (index: number) => void;
  clickableRoute?: TrackPoint[];
  /** When set (and ≥2 points), map fits these instead of the full route. */
  fitPoints?: TrackPoint[];
  fitAnimate?: boolean;
  fitKey?: string;
};

export const RouteExplorerMap = ({
  routePoints,
  highlightPoints = [],
  stretchOverlays = [],
  markers,
  onPositionClick,
  clickableRoute,
  fitPoints,
  fitAnimate = false,
  fitKey = "",
}: RouteExplorerMapProps) => {
  const clickRoute = clickableRoute ?? (highlightPoints.length > 1 ? highlightPoints : routePoints);

  const allPositions = useMemo(() => {
    const positions: LatLngExpression[] = [];
    for (const point of routePoints) {
      positions.push([point.lat, point.lon]);
    }
    return positions;
  }, [routePoints]);

  const fitPositions = useMemo(() => {
    const source = fitPoints && fitPoints.length > 1 ? fitPoints : routePoints;
    return source.map((point) => [point.lat, point.lon] as LatLngExpression);
  }, [fitPoints, routePoints]);

  const routeLine = useMemo(
    () => routePoints.map((p) => [p.lat, p.lon] as LatLngExpression),
    [routePoints],
  );

  const center: LatLngExpression = allPositions[0] ?? [48.2, 16.37];
  const hasHighlight = highlightPoints.length > 1;
  const hasStretchOverlays = stretchOverlays.some((overlay) => overlay.points.length > 1);

  const mapInstanceKey = routePoints.length > 0 ? `${routePoints[0].lat},${routePoints[0].lon}` : "explorer-map";

  return (
    <MapContainer
      key={mapInstanceKey}
      center={center}
      zoom={13}
      className={routeExplorerMapStyles.crosshair}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds
        positions={fitPositions}
        padding={[36, 36]}
        animate={fitAnimate}
        fitKey={fitKey}
      />
      <MapResizeHandler />
      <IndexClickHandler route={clickRoute} enabled={!!onPositionClick} onClick={onPositionClick} />
      {routeLine.length > 1 && (
        <Polyline
          positions={routeLine}
          color="#2f6fed"
          weight={4}
          opacity={hasHighlight ? 0.35 : 0.9}
          interactive={false}
        />
      )}
      {stretchOverlays.map((overlay) =>
        overlay.points.length > 1 ? (
          <PathHighlight
            key={overlay.id}
            points={overlay.points}
            glowColor={overlay.color}
            lineColor={overlay.color}
            glowWeight={14}
            lineWeight={5}
            glowOpacity={0.28}
            lineOpacity={0.95}
          />
        ) : null,
      )}
      {hasHighlight && (
        <PathHighlight
          points={highlightPoints}
          glowColor="#5fd38d"
          lineColor="#7dffb0"
          glowOpacity={hasStretchOverlays ? 0.14 : 0.28}
          lineOpacity={hasStretchOverlays ? 0.32 : 0.95}
        />
      )}
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.point.lat, marker.point.lon]}
          radius={9}
          pathOptions={{
            color: marker.color,
            fillColor: marker.color,
            fillOpacity: 0.95,
            weight: 2,
          }}
          interactive={false}
        />
      ))}
    </MapContainer>
  );
};