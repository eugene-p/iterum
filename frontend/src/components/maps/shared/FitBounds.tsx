import { useEffect, useMemo } from "react";
import type { Map } from "leaflet";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type FitBoundsProps = {
  positions: LatLngExpression[];
  padding?: [number, number];
  animate?: boolean;
  /** Extra key so distinct targets re-fit even if endpoints match. */
  fitKey?: string;
};

const fittedBoundsByMap = new WeakMap<Map, string>();

const boundsKeyFromPositions = (positions: LatLngExpression[], fitKey = ""): string => {
  if (positions.length === 0) return `0:${fitKey}`;
  const first = positions[0];
  const last = positions[positions.length - 1];
  const mid = positions[Math.floor(positions.length / 2)];
  return `${fitKey}:${positions.length}:${JSON.stringify(first)}:${JSON.stringify(mid)}:${JSON.stringify(last)}`;
};

export const FitBounds = ({
  positions,
  padding = [24, 24],
  animate = false,
  fitKey = "",
}: FitBoundsProps) => {
  const map = useMap();
  const boundsKey = useMemo(
    () => boundsKeyFromPositions(positions, fitKey),
    [positions, fitKey],
  );

  useEffect(() => {
    if (fittedBoundsByMap.get(map) === boundsKey) return;
    fittedBoundsByMap.set(map, boundsKey);

    if (positions.length > 1) {
      map.fitBounds(positions as [number, number][], { padding, animate });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14, { animate });
    }
  }, [map, boundsKey, positions, padding, animate]);

  return null;
};