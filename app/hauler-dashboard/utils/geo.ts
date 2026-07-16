// Haversine formula to calculate distance between two GPS coordinates in meters
export const calculateDistanceInMeters = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// ✅ UPDATED: Calculate total distance, safely handling undefined coordinates
export const calculateTotalDistanceKm = (stops: { latitude?: number; longitude?: number }[]): number => {
  let totalDistance = 0;
  
  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = stops[i];
    const p2 = stops[i + 1];
    
    // Only calculate if both points have valid coordinates
    if (p1.latitude !== undefined && p1.longitude !== undefined && 
        p2.latitude !== undefined && p2.longitude !== undefined) {
      
      totalDistance += calculateDistanceInMeters(
        p1.latitude, p1.longitude,
        p2.latitude, p2.longitude
      );
    }
  }
  
  return totalDistance / 1000; // Convert to km
};