import { memo, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Segment, TrackPoint } from "../../../types";
import { FitBounds } from "../shared/FitBounds";
import { MapResizeHandler } from "../shared/MapResizeHandler";
import { LatLonClickHandler } from "../shared/MapClickHandler";
import { PathHighlight } from "../shared/PathHighlight";
import { mapPalette } from "../shared/mapPalette";
import { activityMapStyles } from "./ActivityMap.styles";

type SegmentDraft = {
  start_lat?: number;
  start_lon?: number;
  end_lat?: number;
  end_lon?: number;
};

export type ActivityRoute = {
  id: number;
  points: TrackPoint[];
  selected: boolean;
};

export type StretchOverlay = {
  id: number | string;
  points: TrackPoint[];
  color: string;
};

export type MapPointMarker = {
  id: string;
  lat: number;
  lon: number;
  color?: string;
};

type ActivityMapProps = {
  routes: ActivityRoute[];
  segment?: Segment | null;
  segmentDraft?: SegmentDraft;
  segmentHighlight?: TrackPoint[];
  draftHighlight?: TrackPoint[];
  stretchOverlays?: StretchOverlay[];
  /** Extra point markers (e.g. live split cut). */
  pointMarkers?: MapPointMarker[];
  segmentMode: "none" | "start" | "end";
  onMapClick?: (lat: number, lon: number) => void;
};

const areActivityMapPropsEqual = (prev: ActivityMapProps, next: ActivityMapProps) =>
  prev.routes === next.routes &&
  prev.segment?.id === next.segment?.id &&
  prev.segmentHighlight === next.segmentHighlight &&
  prev.draftHighlight === next.draftHighlight &&
  prev.stretchOverlays === next.stretchOverlays &&
  prev.pointMarkers === next.pointMarkers &&
  prev.segmentMode === next.segmentMode &&
  prev.onMapClick === next.onMapClick;

export const ActivityMap = memo(function ActivityMap({
  routes,
  segment,
  segmentDraft,
  segmentHighlight = [],
  draftHighlight = [],
  stretchOverlays = [],
  pointMarkers = [],
  segmentMode,
  onMapClick,
}: ActivityMapProps) {
  const allPositions = useMemo(() => {
    const positions: LatLngExpression[] = [];
    for (const route of routes) {
      for (const point of route.points) {
        positions.push([point.lat, point.lon]);
      }
    }
    return positions;
  }, [routes]);

  const fitPositions = useMemo(() => {
    const stretchOverlay = stretchOverlays.find((overlay) => overlay.points.length > 1);
    if (stretchOverlay) {
      return stretchOverlay.points.map((p) => [p.lat, p.lon] as LatLngExpression);
    }
    if (draftHighlight.length > 1) {
      return draftHighlight.map((p) => [p.lat, p.lon] as LatLngExpression);
    }
    if (segmentHighlight.length > 1) {
      return segmentHighlight.map((p) => [p.lat, p.lon] as LatLngExpression);
    }
    return allPositions;
  }, [stretchOverlays, draftHighlight, segmentHighlight, allPositions]);

  const picking = segmentMode !== "none";
  const hasSegmentHighlight = segmentHighlight.length > 1;
  const hasDraftHighlight = draftHighlight.length > 1;
  const hasStretchOverlays = stretchOverlays.some((overlay) => overlay.points.length > 1);

  const sortedRoutes = useMemo(
    () =>
      routes
        .filter((route) => route.points.length > 1)
        .slice()
        .sort((a, b) => Number(a.selected) - Number(b.selected)),
    [routes],
  );

  const center: LatLngExpression = allPositions[0] ?? [48.2, 16.37];
  const selectedRoute = sortedRoutes.find((route) => route.selected) ?? sortedRoutes[0];
  const routeStart = selectedRoute?.points[0];
  const routeEnd = selectedRoute?.points[selectedRoute.points.length - 1];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className={picking ? activityMapStyles.picking : undefined}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={fitPositions} padding={[8, 8]} />
      <MapResizeHandler />
      <LatLonClickHandler enabled={picking} onClick={onMapClick} />
      {sortedRoutes.map((route) => {
        const positions = route.points.map((p) => [p.lat, p.lon] as LatLngExpression);
        const dimmed = route.selected && (hasSegmentHighlight || hasDraftHighlight || hasStretchOverlays);
        return (
          <Polyline
            key={route.id}
            positions={positions}
            color={route.selected ? mapPalette.routePrimary : mapPalette.routeSecondary}
            weight={route.selected ? 4 : 3}
            opacity={route.selected ? (dimmed ? 0.45 : 1) : 0.42}
            interactive={!picking}
          />
        );
      })}
      {routeStart ? (
        <CircleMarker
          center={[routeStart.lat, routeStart.lon]}
          radius={7}
          pathOptions={{ color: "#f8fafc", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
          interactive={false}
        />
      ) : null}
      {routeEnd ? (
        <CircleMarker
          center={[routeEnd.lat, routeEnd.lon]}
          radius={7}
          pathOptions={{ color: "#f8fafc", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }}
          interactive={false}
        />
      ) : null}
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
      {hasSegmentHighlight && (
        <PathHighlight
          points={segmentHighlight}
          glowColor={mapPalette.selectionGlow}
          lineColor={mapPalette.selectionLine}
          glowOpacity={hasStretchOverlays ? 0.14 : 0.38}
          lineOpacity={hasStretchOverlays ? 0.32 : 0.95}
        />
      )}
      {hasDraftHighlight && (
        <PathHighlight
          points={draftHighlight}
          glowColor="#f5c542"
          lineColor="#ffe08a"
          glowOpacity={0.3}
          dashed
        />
      )}
      {pointMarkers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.lat, marker.lon]}
          radius={8}
          pathOptions={{
            color: marker.color ?? "#f8fafc",
            fillColor: marker.color ?? "#f59e0b",
            fillOpacity: 0.95,
            weight: 2,
          }}
        />
      ))}
      {segmentDraft?.start_lat != null && segmentDraft.start_lon != null && (
        <CircleMarker
          center={[segmentDraft.start_lat, segmentDraft.start_lon]}
          radius={10}
          pathOptions={{
            color: mapPalette.segmentStart,
            fillColor: mapPalette.segmentStart,
            fillOpacity: 0.95,
          }}
          interactive={false}
        />
      )}
      {segmentDraft?.end_lat != null && segmentDraft.end_lon != null && (
        <CircleMarker
          center={[segmentDraft.end_lat, segmentDraft.end_lon]}
          radius={10}
          pathOptions={{
            color: mapPalette.segmentEnd,
            fillColor: mapPalette.segmentEnd,
            fillOpacity: 0.95,
          }}
          interactive={false}
        />
      )}
      {segment && (
        <>
          <CircleMarker
            center={[segment.start_lat, segment.start_lon]}
            radius={8}
            pathOptions={{
              color: mapPalette.segmentStart,
              fillColor: mapPalette.segmentStart,
              fillOpacity: 0.9,
            }}
            interactive={false}
          />
          <CircleMarker
            center={[segment.end_lat, segment.end_lon]}
            radius={8}
            pathOptions={{
              color: mapPalette.segmentEnd,
              fillColor: mapPalette.segmentEnd,
              fillOpacity: 0.9,
            }}
            interactive={false}
          />
        </>
      )}
    </MapContainer>
  );
}, areActivityMapPropsEqual);
