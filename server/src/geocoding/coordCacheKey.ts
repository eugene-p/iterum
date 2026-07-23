export const coordCacheKey = (lat: number, lon: number, precision = 3): string => {
  const factor = 10 ** precision;
  const roundedLat = Math.round(lat * factor) / factor;
  const roundedLon = Math.round(lon * factor) / factor;
  return `${roundedLat}_${roundedLon}`;
};