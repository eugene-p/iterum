import { Fragment, useMemo } from "react";
import { cn } from "../../../../lib/cn";
import { computeHrZoneTimes, HR_ZONES } from "../../../../lib/hrZones";
import { formatDuration } from "../../../../utils";
import {
  activityTrackChartStyles,
  type ActivityTrackChartSize,
} from "../../../activities/ActivityTrackChart/ActivityTrackChart.styles";
import { passCompareTrackChartStyles } from "./passCompareTrackChartStyles";
import type { PassCompareTrackPass } from "./passCompareTrackChartUtils";

const passColorFill = (color: string, opacity = 0.12): string =>
  `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;

type PassComparePassLegendProps = {
  passes: PassCompareTrackPass[];
  maxHr?: number | null;
  hasElevation?: boolean;
  size?: ActivityTrackChartSize;
};

const PassLegendRow = ({
  pass,
  isLarge,
}: {
  pass: PassCompareTrackPass;
  isLarge: boolean;
}) => (
  <div
    className={cn(
      passCompareTrackChartStyles.legendItem,
      isLarge && passCompareTrackChartStyles.legendItemLarge,
    )}
    title={pass.label}
  >
    <span
      className={passCompareTrackChartStyles.legendIndex}
      style={{ background: pass.color }}
      aria-hidden
    >
      {pass.seriesIndex + 1}
    </span>
    <span
      className={passCompareTrackChartStyles.legendLinePreview}
      style={{
        borderColor: pass.color,
        borderStyle: pass.dasharray ? "dashed" : "solid",
      }}
      aria-hidden
    />
    <span className="min-w-0 truncate">{pass.label}</span>
  </div>
);

export const PassComparePassLegend = ({
  passes,
  maxHr = null,
  hasElevation = false,
  size = "compact",
}: PassComparePassLegendProps) => {
  const isLarge = size === "large";

  const zoneTimesByPass = useMemo(
    () =>
      passes.map((pass) => ({
        color: pass.color,
        seriesIndex: pass.seriesIndex,
        zones: maxHr != null ? computeHrZoneTimes(pass.points, maxHr, pass.durationSec) : [],
      })),
    [maxHr, passes],
  );

  const activeZones = useMemo(() => {
    if (maxHr == null) return [];
    return HR_ZONES.filter((zone) =>
      zoneTimesByPass.some((pass) => {
        const zoneTime = pass.zones.find((item) => item.id === zone.id);
        return (zoneTime?.seconds ?? 0) > 0;
      }),
    );
  }, [maxHr, zoneTimesByPass]);

  const showZoneGrid = maxHr != null && activeZones.length > 0;

  if (!showZoneGrid) {
    return (
      <div className={passCompareTrackChartStyles.legend}>
        {passes.map((pass) => (
          <PassLegendRow key={`${pass.seriesIndex}-${pass.label}`} pass={pass} isLarge={isLarge} />
        ))}
        {hasElevation ? (
          <span
            className={cn(
              activityTrackChartStyles.legendItem,
              isLarge && activityTrackChartStyles.legendItemLarge,
            )}
          >
            <span className={activityTrackChartStyles.legendElev} aria-hidden />
            Elevation
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        passCompareTrackChartStyles.passLegendGrid,
        isLarge && passCompareTrackChartStyles.passLegendGridLarge,
      )}
      style={{
        gridTemplateColumns: `minmax(0, 1fr) repeat(${activeZones.length}, minmax(2.75rem, auto))`,
      }}
    >
      <div aria-hidden />
      {activeZones.map((zone) => (
        <div key={zone.id} className={passCompareTrackChartStyles.zoneGridHead}>
          <span
            className={passCompareTrackChartStyles.zoneGridZoneSwatch}
            style={{ backgroundColor: zone.color }}
            aria-hidden
          />
          {zone.label}
        </div>
      ))}

      {passes.map((pass) => {
        const zoneTimes = zoneTimesByPass.find((entry) => entry.seriesIndex === pass.seriesIndex);
        return (
          <Fragment key={`${pass.seriesIndex}-${pass.label}`}>
            <PassLegendRow pass={pass} isLarge={isLarge} />
            {activeZones.map((zone) => {
              const seconds = zoneTimes?.zones.find((item) => item.id === zone.id)?.seconds ?? 0;
              return (
                <div
                  key={zone.id}
                  className={cn(
                    passCompareTrackChartStyles.zoneGridCell,
                    seconds <= 0 && passCompareTrackChartStyles.zoneGridCellEmpty,
                  )}
                  style={seconds > 0 ? { backgroundColor: passColorFill(pass.color) } : undefined}
                >
                  {seconds > 0 ? formatDuration(seconds) : "—"}
                </div>
              );
            })}
          </Fragment>
        );
      })}

      {hasElevation ? (
        <>
          <span
            className={cn(
              activityTrackChartStyles.legendItem,
              isLarge && activityTrackChartStyles.legendItemLarge,
            )}
          >
            <span className={activityTrackChartStyles.legendElev} aria-hidden />
            Elevation
          </span>
          {activeZones.map((zone) => (
            <div key={`elev-${zone.id}`} aria-hidden />
          ))}
        </>
      ) : null}
    </div>
  );
};