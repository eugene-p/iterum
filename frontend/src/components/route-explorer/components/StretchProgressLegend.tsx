import { STRETCH_PROGRESS_COLORS } from "../../../stretchUtils";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

const LEGEND_ITEMS = [
  { color: STRETCH_PROGRESS_COLORS[0], label: "Furthest ahead" },
  { color: STRETCH_PROGRESS_COLORS[1], label: "1 behind" },
  { color: STRETCH_PROGRESS_COLORS[2], label: "2 behind" },
  { color: STRETCH_PROGRESS_COLORS[3], label: "3+ behind" },
] as const;

type StretchProgressLegendProps = {
  mode?: "segment" | "stretch";
};

export const StretchProgressLegend = ({ mode = "segment" }: StretchProgressLegendProps) => (
  <div
    className={routeExplorerStyles.positionLegend}
    aria-label={mode === "stretch" ? "Ahead in this stretch" : "Ahead on segment"}
  >
    <span className={routeExplorerStyles.positionLegendItem}>
      {mode === "stretch" ? "In this stretch:" : "Ahead:"}
    </span>
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
