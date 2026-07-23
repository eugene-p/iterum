export const formatTags = (tags: readonly string[] | null | undefined): string | null => {
  if (!tags?.length) return null;
  return tags.join(" · ");
};