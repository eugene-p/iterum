import type { DragEvent, ReactNode, Ref } from "react";
import { cn } from "../../../lib/cn";
import { dropzoneStyles } from "./Dropzone.styles";

export type DropzoneState = "idle" | "dragover" | "uploading" | "done";

type DropzoneProps = {
  state?: DropzoneState;
  compact?: boolean;
  footer?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList) => void;
  onDragActiveChange?: (active: boolean) => void;
  children: ReactNode;
  className?: string;
};

const stateMap: Record<DropzoneState, "dragover" | "uploading" | "upload-done" | undefined> = {
  idle: undefined,
  dragover: "dragover",
  uploading: "uploading",
  done: "upload-done",
};

export const Dropzone = ({
  state = "idle",
  compact = false,
  footer = false,
  disabled = false,
  onFiles,
  onDragActiveChange,
  children,
  className,
}: DropzoneProps) => {
  const handleDragOver = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    onDragActiveChange?.(true);
  };

  const handleDragLeave = () => {
    onDragActiveChange?.(false);
  };

  const handleDrop = (e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    onDragActiveChange?.(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        footer ? dropzoneStyles.footer(stateMap[state]) : dropzoneStyles.root(stateMap[state]),
        !footer && compact && dropzoneStyles.compact,
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

type FilePickerProps = {
  accept?: string;
  multiple?: boolean;
  label: string;
  footer?: boolean;
  onFiles: (files: FileList | null) => void;
  inputRef?: Ref<HTMLInputElement>;
};

export const FilePicker = ({
  accept,
  multiple,
  label,
  footer = false,
  onFiles,
  inputRef,
}: FilePickerProps) => (
  <label className={footer ? dropzoneStyles.footerFilePicker : dropzoneStyles.filePicker}>
    {label}
    <input
      ref={inputRef}
      className={dropzoneStyles.fileInputHidden}
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={(e) => onFiles(e.target.files)}
    />
  </label>
);

type UploadStatusProps = {
  ok?: boolean;
  footer?: boolean;
  children: ReactNode;
};

export const UploadStatus = ({ ok = false, footer = false, children }: UploadStatusProps) => (
  <div
    className={cn(
      dropzoneStyles.uploadStatus,
      footer && dropzoneStyles.footerUploadStatus,
      ok && dropzoneStyles.uploadStatusOk,
    )}
  >
    {ok && (
      <span className={dropzoneStyles.uploadCheck} aria-hidden="true">
        ✓
      </span>
    )}
    {children}
  </div>
);

export const DropzoneLabel = ({
  children,
  footer = false,
}: {
  children: ReactNode;
  footer?: boolean;
}) =>
  footer ? (
    <span className={dropzoneStyles.footerLabel}>{children}</span>
  ) : (
    <p className={dropzoneStyles.label}>{children}</p>
  );