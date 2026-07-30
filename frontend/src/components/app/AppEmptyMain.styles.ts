export const appEmptyMainStyles = {
  root: "min-h-0 flex-1 overflow-y-auto bg-surface",
  canvas: "mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 sm:p-8 lg:p-10",
  hero: "flex flex-col items-start gap-2",
  grid: "grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(20rem,1fr)]",
  uploadSection:
    "flex min-h-[26rem] flex-col gap-5 rounded-xl border border-border bg-drop-surface p-5 sm:p-7",
  sideColumn: "flex min-w-0 flex-col gap-6",
  section: "flex w-full flex-col gap-3 rounded-xl border border-border bg-drop-surface p-5",
  sectionHead: "flex flex-col gap-1",
  title: "m-0 text-lg font-semibold text-fg",
  uploadControl: "min-h-0 max-w-none flex-1",
  uploadDropzone: "min-h-[19rem] flex-1 justify-center px-6 py-10 sm:min-h-[24rem]",
  profileSection: "flex w-full flex-col",
  resumeSection: "flex w-full flex-col gap-3",
  resumeList: "flex w-full flex-col gap-2",
  resumeButton: "w-full justify-start truncate",
} as const;
