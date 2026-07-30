export const appEmptyMainStyles = {
  root: "min-h-0 flex-1 overflow-y-auto bg-surface",
  canvas: "mx-auto flex w-full max-w-6xl flex-col gap-4 p-3 sm:p-4 lg:p-5",
  grid: "grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(20rem,1fr)]",
  uploadSection:
    "flex min-h-[26rem] flex-col gap-5 p-4 sm:p-5",
  sideColumn: "flex min-w-0 flex-col gap-4",
  section: "flex w-full flex-col gap-3",
  sectionHead: "flex flex-col gap-1",
  title: "m-0 text-lg font-semibold text-fg",
  uploadBody: "flex min-h-0 flex-1 flex-col",
  uploadControl: "min-h-0 max-w-none flex-1",
  uploadDropzone: "min-h-[19rem] flex-1 justify-center px-6 py-10 sm:min-h-[24rem]",
  profileSection: "flex w-full flex-col",
  resumeSection: "flex w-full flex-col",
  resumeBody: "mt-3",
} as const;
