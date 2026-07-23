export type UploadPhase = "idle" | "uploading" | "refreshing" | "done";

export type UploadProgress = {
  phase: UploadPhase;
  fileName: string | null;
  index: number;
  total: number;
  doneCount: number;
};

export const uploadStatusText = ({
  phase,
  fileName,
  index,
  total,
  doneCount,
}: UploadProgress): string | null => {
  if (phase === "uploading" && fileName) {
    const progress = total > 1 ? ` (${index} of ${total})` : "";
    return `Uploading and processing ${fileName}${progress}…`;
  }
  if (phase === "refreshing") return "Updating activity list…";
  if (phase === "done") {
    return doneCount === 1
      ? "Activity imported successfully."
      : `${doneCount} activities imported successfully.`;
  }
  return null;
};