import { STRETCH_PROGRESS_COLORS } from "../../../stretchUtils";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

const LEGEND_ITEMS = [
  { color: STRETCH_PROGRESS_COLORS[0], label: "Furthest ahead" },
  { color: STRETCH_PROGRESS_COLORS[1], label: "1 behind" },
  { color: STRETCH_PROGRESS_COLORS[2], label: "2 behind" },
  { color: STRETCH_PROGRESS_COLORS[3], label: "3+ behind" },
] as const;

export const StretchProgressLegend = () => (
  <div className={routeExplorerStyles.positionLegend} aria-label="Stretch position colors">
    <span className={routeExplorerStyles.positionLegendItem}>Position:</span>
    {LEGEND_ITEMS.map((item) => (
      <span key={item.label} className={routeExplorerStyles.positionLegendItem}>
        <span
          className={routeExplorerStyles.positionLegendSwatch}
          style={{ background: item.color }}
          aria-hidden="true"
        />
        {item.label}
      </span>
    ))}
  </div>
);