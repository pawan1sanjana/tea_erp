/**
 * GIS Utility Functions for Field Mapping
 * Provides helper functions for coordinate calculations, distance measurements, and geospatial operations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate the area of a polygon using Shoelace formula
 * @param {Array<{lat: number, lng: number}>} points - Array of coordinate points
 * @returns {number} Area in square kilometers
 */
export const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += (p2.lng - p1.lng) * (p2.lat + p1.lat) / 2;
  }

  // Approximate conversion from lat/lng degrees to km
  return Math.abs(area * 111 * 111);
};

/**
 * Calculate perimeter of a polygon
 * @param {Array<{lat: number, lng: number}>} points - Array of coordinate points
 * @returns {number} Perimeter in kilometers
 */
export const calculatePerimeter = (points) => {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    perimeter += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
  }

  return perimeter;
};

/**
 * Convert hectares to square kilometers
 * @param {number} hectares - Value in hectares
 * @returns {number} Value in square kilometers
 */
export const hectaresToSqKm = (hectares) => {
  return hectares / 100;
};

/**
 * Convert square kilometers to hectares
 * @param {number} sqKm - Value in square kilometers
 * @returns {number} Value in hectares
 */
export const sqKmToHectares = (sqKm) => {
  return sqKm * 100;
};

/**
 * Check if a point is inside a polygon using Ray Casting algorithm
 * @param {number} lat - Point latitude
 * @param {number} lng - Point longitude
 * @param {Array<{lat: number, lng: number}>} polygon - Polygon points
 * @returns {boolean} True if point is inside polygon
 */
export const isPointInPolygon = (lat, lng, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];

    const xi = pi.lng;
    const yi = pi.lat;
    const xj = pj.lng;
    const yj = pj.lat;

    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Calculate the bounding box of a set of points
 * @param {Array<{lat: number, lng: number}>} points - Array of coordinate points
 * @returns {Object} Object with north, south, east, west boundaries
 */
export const calculateBoundingBox = (points) => {
  if (points.length === 0) return null;

  let north = points[0].lat;
  let south = points[0].lat;
  let east = points[0].lng;
  let west = points[0].lng;

  for (const point of points) {
    if (point.lat > north) north = point.lat;
    if (point.lat < south) south = point.lat;
    if (point.lng > east) east = point.lng;
    if (point.lng < west) west = point.lng;
  }

  return { north, south, east, west };
};

/**
 * Get the center point of a polygon
 * @param {Array<{lat: number, lng: number}>} points - Array of coordinate points
 * @returns {Object} Center point with lat and lng
 */
export const getPolygonCenter = (points) => {
  if (points.length === 0) return { lat: 0, lng: 0 };

  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length
  };
};

/**
 * Convert decimal degrees to DMS (Degrees, Minutes, Seconds)
 * @param {number} decimal - Decimal degree value
 * @returns {Object} Object with degrees, minutes, seconds
 */
export const decimalToDMS = (decimal) => {
  const d = Math.floor(Math.abs(decimal));
  const m = Math.floor((Math.abs(decimal) - d) * 60);
  const s = ((Math.abs(decimal) - d) * 60 - m) * 60;

  return {
    degrees: d,
    minutes: m,
    seconds: s.toFixed(2),
    direction: decimal < 0 ? (decimal === parseFloat(decimal) ? 'W' : 'S') : (decimal === parseFloat(decimal) ? 'E' : 'N')
  };
};

/**
 * Convert DMS to decimal degrees
 * @param {number} degrees - Degrees value
 * @param {number} minutes - Minutes value
 * @param {number} seconds - Seconds value
 * @param {string} direction - Direction (N, S, E, W)
 * @returns {number} Decimal degree value
 */
export const dmsToDecimal = (degrees, minutes, seconds, direction) => {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
};

/**
 * Get nearby fields within a certain radius
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {Array<Object>} fields - Array of field objects with lat/lng
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array<Object>} Fields within the radius
 */
export const getNearbyFields = (lat, lng, fields, radiusKm) => {
  return fields.filter(field => {
    const distance = calculateDistance(lat, lng, field.lat, field.lng);
    return distance <= radiusKm;
  });
};

/**
 * Format coordinates as readable string
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Formatted coordinate string
 */
export const formatCoordinates = (lat, lng) => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};

/**
 * Validate latitude and longitude values
 * @param {number} lat - Latitude to validate
 * @param {number} lng - Longitude to validate
 * @returns {boolean} True if valid
 */
export const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Export field data to GeoJSON format
 * @param {Object} field - Field object
 * @param {Array<{lat: number, lng: number}>} points - Boundary points
 * @returns {string} GeoJSON string
 */
export const exportToGeoJSON = (field, points) => {
  const coordinates = points.map(p => [p.lng, p.lat]);
  
  const geoJSON = {
    type: 'Feature',
    properties: {
      name: field.name,
      id: field.id,
      area: field.area,
      crop: field.crop
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  };

  return JSON.stringify(geoJSON, null, 2);
};
