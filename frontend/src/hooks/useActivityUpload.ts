import { useEffect, useRef, useState } from "react";
import type { DropzoneState } from "../components/ui/Dropzone/Dropzone";
import type { UploadPhase } from "../lib/uploadStatus";
import { uploadStatusText } from "../lib/uploadStatus";
import { useUploadActivityMutation } from "../queries/activities";
import type { ActivitySummary } from "../types";

type UseActivityUploadOptions = {
  profileId: number;
  onRefresh: () => Promise<void>;
  onError?: (message: string) => void;
  onComplete?: (uploaded: ActivitySummary[]) => void;
};

export const useActivityUpload = ({
  profileId,
  onRefresh,
  onError,
  onComplete,
}: UseActivityUploadOptions) => {
  const uploadMutation = useUploadActivityMutation();
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDoneCount, setUploadDoneCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadPhase !== "done") return;
    const timer = window.setTimeout(() => setUploadPhase("idle"), 4000);
    return () => window.clearTimeout(timer);
  }, [uploadPhase]);

  const uploading = uploadPhase === "uploading" || uploadPhase === "refreshing";
  const statusText = uploadStatusText({
    phase: uploadPhase,
    fileName: uploadFileName,
    index: uploadIndex,
    total: uploadTotal,
    doneCount: uploadDoneCount,
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    const fileList = Array.from(files);
    setUploadTotal(fileList.length);
    setUploadDoneCount(0);
    setUploadIndex(0);
    setUploadFileName(null);
    setUploadPhase("uploading");
    const uploaded: ActivitySummary[] = [];
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadIndex(i + 1);
        setUploadFileName(file.name);
        const activity = await uploadMutation.mutateAsync({ file, profileId });
        uploaded.push(activity);
        setUploadDoneCount(i + 1);
      }
      setUploadPhase("refreshing");
      await onRefresh();
      setUploadPhase("done");
      onComplete?.(uploaded);
    } catch (err) {
      setUploadPhase("idle");
      onError?.(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const dropzoneState: DropzoneState = uploading
    ? "uploading"
    : uploadPhase === "done"
      ? "done"
      : dragOver
        ? "dragover"
        : "idle";

  return {
    uploading,
    uploadPhase,
    statusText,
    dragOver,
    setDragOver,
    fileInputRef,
    dropzoneState,
    handleUpload,
  };
};