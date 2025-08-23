function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Convert lat/lon degrees to km approx
  const kmPerDegreeLat = 111; // ~111 km per 1 degree latitude
  const kmPerDegreeLon = 111 * Math.cos((lat1 * Math.PI) / 180); // adjust for longitude

  const dx = (lon2 - lon1) * kmPerDegreeLon;
  const dy = (lat2 - lat1) * kmPerDegreeLat;

  return Math.sqrt(dx * dx + dy * dy); // Euclidean distance
}

export default getDistanceKm;