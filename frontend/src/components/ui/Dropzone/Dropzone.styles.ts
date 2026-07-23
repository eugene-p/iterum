import { cn } from "../../../lib/cn";
import { buttonStyles } from "../Button/Button.styles";

export const dropzoneStyles = {
  root: (state?: "dragover" | "uploading" | "upload-done") =>
    cn(
      "flex flex-col items-center gap-[0.65rem] rounded-[10px] border border-dashed border-border-strong p-4 text-center text-subtle",
      state === "dragover" && "border-primary bg-card-active",
      state === "uploading" && "pointer-events-none border-solid border-primary bg-card-active",
      state === "upload-done" && "border-success bg-success-surface",
    ),
  compact: "p-[0.65rem]",
  footer: (state?: "dragover" | "uploading" | "upload-done") =>
    cn(
      "flex w-full flex-row flex-nowrap items-center justify-between gap-3 rounded-none border-x-0 border-b-0 border-t border-dashed border-border-strong px-0 py-1.5 text-left",
      state === "dragover" && "border-primary bg-card-active",
      state === "uploading" && "pointer-events-none border-solid border-primary bg-card-active",
      state === "upload-done" && "border-success bg-success-surface",
    ),
  label: "m-0 mb-[0.45rem] text-[0.82rem]",
  footerLabel: "m-0 min-w-0 truncate text-xs leading-none text-subtle",
  filePicker: cn(buttonStyles.base(), "mt-[0.15rem]"),
  footerFilePicker: cn(buttonStyles.base(), buttonStyles.sm, "mt-0 shrink-0"),
  fileInputHidden: "hidden",
  uploadStatus: "flex items-center justify-center gap-[0.6rem] font-semibold text-fg",
  footerUploadStatus: "w-full min-w-0 justify-start gap-2 text-xs font-medium",
  uploadStatusOk: "text-success",
  uploadCheck:
    "inline-flex size-5 items-center justify-center rounded-full bg-success-muted text-xs",
} as const;