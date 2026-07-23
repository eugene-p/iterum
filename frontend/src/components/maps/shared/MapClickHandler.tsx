import { useMapEvents } from "react-leaflet";
import type { TrackPoint } from "../../../types";
import { nearestTrackPointIndex } from "../../../utils";

type LatLonClickHandlerProps = {
  enabled: boolean;
  onClick?: (lat: number, lon: number) => void;
};

export const LatLonClickHandler = ({ enabled, onClick }: LatLonClickHandlerProps) => {
  useMapEvents({
    click: (e) => {
      if (!enabled || !onClick) return;
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

type IndexClickHandlerProps = {
  route: TrackPoint[];
  enabled: boolean;
  onClick?: (index: number) => void;
};

export const IndexClickHandler = ({ route, enabled, onClick }: IndexClickHandlerProps) => {
  useMapEvents({
    click: (e) => {
      if (!enabled || !onClick || route.length < 2) return;
      const index = nearestTrackPointIndex(route, e.latlng.lat, e.latlng.lng);
      if (index >= 0) onClick(index);
    },
  });
  return null;
};