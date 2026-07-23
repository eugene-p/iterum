import { useEffect, useMemo } from "react";
import type { Map } from "leaflet";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type FitBoundsProps = {
  positions: LatLngExpression[];
  padding?: [number, number];
  animate?: boolean;
};

const fittedBoundsByMap = new WeakMap<Map, string>();

const boundsKeyFromPositions = (positions: LatLngExpression[]): string => {
  if (positions.length === 0) return "0";
  const first = positions[0];
  const last = positions[positions.length - 1];
  return `${positions.length}:${JSON.stringify(first)}:${JSON.stringify(last)}`;
};

export const FitBounds = ({
  positions,
  padding = [24, 24],
  animate = false,
}: FitBoundsProps) => {
  const map = useMap();
  const boundsKey = useMemo(() => boundsKeyFromPositions(positions), [positions]);

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