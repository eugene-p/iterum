const sidebarListPlural = (singular: string): string => {
  if (singular === "activity") return "activities";
  return `${singular}s`;
};

export const formatSidebarListCount = (
  visible: number,
  total: number,
  singular: string,
): string => {
  const noun = total === 1 ? singular : sidebarListPlural(singular);
  if (visible === total) return `${total} ${noun}`;
  return `${visible} of ${total} ${noun}`;
};