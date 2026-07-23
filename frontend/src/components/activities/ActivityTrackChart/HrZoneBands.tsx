import type { HrZoneBand } from "../../../lib/hrZones";

type HrZoneBandsProps = {
  bands: HrZoneBand[];
};

export const HrZoneBands = ({ bands }: HrZoneBandsProps) =>
  bands.map((band) => (
    <rect
      key={`zone-band-${band.id}`}
      x={0}
      y={band.yTop}
      width={100}
      height={Math.max(band.yBottom - band.yTop, 0)}
      fill={band.color}
      fillOpacity={0.22}
    />
  ));