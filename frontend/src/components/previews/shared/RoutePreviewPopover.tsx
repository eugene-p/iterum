import { useEffect, useState } from "react";
import {
  PREVIEW_MAP_HEIGHT,
  PREVIEW_MAP_WIDTH,
} from "../../maps/ActivityPreviewMap/activityPreviewMapSize";
import { MutedText, Popover, Spinner } from "../../ui";
import { computePopoverPlacement } from "./computePopoverPlacement";

type RoutePreviewPopoverProps = {
  title: string;
  anchorRect: DOMRect | null;
  ariaLabel: string;
  previewUrl: string;
};

export const RoutePreviewPopover = ({
  title,
  anchorRect,
  ariaLabel,
  previewUrl,
}: RoutePreviewPopoverProps) => {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setImageState("loading");
  }, [previewUrl]);

  if (!anchorRect) return null;

  const popoverWidth = PREVIEW_MAP_WIDTH + 16;
  const popoverHeight = PREVIEW_MAP_HEIGHT + 52;
  const placement = computePopoverPlacement(anchorRect, popoverWidth, popoverHeight);

  return (
    <Popover title={title} ariaLabel={ariaLabel} placement={placement}>
      {imageState === "error" ? (
        <div className="flex h-[260px] w-[380px] flex-col items-center justify-center gap-[0.45rem]">
          <MutedText className="text-[0.78rem]">No route</MutedText>
        </div>
      ) : (
        <div className="relative">
          {imageState === "loading" ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[0.45rem]">
              <Spinner />
              <MutedText className="text-[0.78rem]">Loading route…</MutedText>
            </div>
          ) : null}
          <img
            src={previewUrl}
            alt=""
            width={PREVIEW_MAP_WIDTH}
            height={PREVIEW_MAP_HEIGHT}
            className={`block cursor-default bg-map ${imageState === "loaded" ? "" : "invisible"}`}
            draggable={false}
            onLoad={() => setImageState("loaded")}
            onError={() => setImageState("error")}
          />
          {imageState === "loaded" ? (
            <p className="m-0 px-2 py-1 text-[0.65rem] text-subtle">© OpenStreetMap contributors</p>
          ) : null}
        </div>
      )}
    </Popover>
  );
};