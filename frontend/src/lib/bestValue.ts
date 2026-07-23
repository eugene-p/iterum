/** Pure helper: pick the best numeric value from a list (SRP — shared by comparison tables). */
export const bestValue = (
  values: ReadonlyArray<number | null | undefined>,
  lowerIsBetter = false,
): number | null => {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return lowerIsBetter ? Math.min(...nums) : Math.max(...nums);
};