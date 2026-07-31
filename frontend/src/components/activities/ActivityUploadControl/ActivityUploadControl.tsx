import { useState } from "react";
import { cn } from "../../../lib/cn";
import { useActivityUpload } from "../../../hooks/useActivityUpload";
import type { ActivitySummary } from "../../../types";
import {
  Dropzone,
  DropzoneLabel,
  ErrorText,
  FilePicker,
  Spinner,
  UploadStatus,
} from "../../ui";
import { activityUploadControlStyles } from "./ActivityUploadControl.styles";

export const ACTIVITY_UPLOAD_ACCEPT = ".gpx,.tcx,.kml,.kmz,.fitlog,.csv,.fit";

type ActivityUploadControlProps = {
  variant: "footer" | "main";
  profileId: number;
  onRefresh: () => Promise<void>;
  onComplete?: (uploaded: ActivitySummary[]) => void;
  onActivityJobsEnqueued?: () => void;
  className?: string;
  dropzoneClassName?: string;
};

export const ActivityUploadControl = ({
  variant,
  profileId,
  onRefresh,
  onComplete,
  onActivityJobsEnqueued,
  className,
  dropzoneClassName,
}: ActivityUploadControlProps) => {
  const [error, setError] = useState<string | null>(null);
  const isFooter = variant === "footer";

  const upload = useActivityUpload({
    profileId,
    onRefresh,
    onError: setError,
    onComplete: (uploaded) => {
      setError(null);
      onComplete?.(uploaded);
    },
    onActivityJobsEnqueued,
  });

  return (
    <div className={isFooter ? className : cn(activityUploadControlStyles.mainWrap, className)}>
      {error && (
        <ErrorText className={isFooter ? undefined : activityUploadControlStyles.mainError}>
          {error}
        </ErrorText>
      )}
      <Dropzone
        footer={isFooter}
        disabled={upload.uploading}
        state={upload.dropzoneState}
        onDragActiveChange={upload.setDragOver}
        onFiles={(files) => void upload.handleUpload(files)}
        className={
          isFooter
            ? dropzoneClassName
            : cn(activityUploadControlStyles.mainDropzone, dropzoneClassName)
        }
      >
        {upload.uploading ? (
          <UploadStatus footer={isFooter}>
            <Spinner />
            <span className="truncate">{upload.statusText}</span>
          </UploadStatus>
        ) : upload.uploadPhase === "done" ? (
          <UploadStatus footer={isFooter} ok>
            <span className="truncate">{upload.statusText}</span>
          </UploadStatus>
        ) : (
          <>
            <DropzoneLabel footer={isFooter}>
              {isFooter
                ? "Drop GPX, TCX, KML, fitlog, or CSV"
                : "Drop GPX, TCX, KML, fitlog, or CSV here"}
            </DropzoneLabel>
            <FilePicker
              footer={isFooter}
              inputRef={upload.fileInputRef}
              accept={ACTIVITY_UPLOAD_ACCEPT}
              multiple
              label="Choose file"
              onFiles={(files) => void upload.handleUpload(files)}
            />
          </>
        )}
      </Dropzone>
    </div>
  );
};
