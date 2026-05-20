/**
 * GIS Mapping API Service
 * Handles all API calls related to GIS field mapping functionality
 */

import client from './client';

const API_BASE = '/api/gis';

/**
 * Fetch all fields for the user
 * @returns {Promise<Array>} Array of field objects
 */
export const fetchAllFields = async () => {
  try {
    const response = await client.get(`${API_BASE}/fields`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fields:', error);
    throw error;
  }
};

/**
 * Fetch specific field data by ID
 * @param {number} fieldId - Field ID to fetch
 * @returns {Promise<Object>} Field object with metadata
 */
export const fetchFieldById = async (fieldId) => {
  try {
    const response = await client.get(`${API_BASE}/fields/${fieldId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Update field data
 * @param {number} fieldId - Field ID to update
 * @param {Object} fieldData - Updated field data
 * @returns {Promise<Object>} Updated field object
 */
export const updateField = async (fieldId, fieldData) => {
  try {
    const response = await client.put(`${API_BASE}/fields/${fieldId}`, fieldData);
    return response.data;
  } catch (error) {
    console.error(`Error updating field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Create a new field
 * @param {Object} fieldData - New field data
 * @returns {Promise<Object>} Created field object
 */
export const createField = async (fieldData) => {
  try {
    const response = await client.post(`${API_BASE}/fields`, fieldData);
    return response.data;
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
};

/**
 * Delete a field
 * @param {number} fieldId - Field ID to delete
 * @returns {Promise<Object>} Success response
 */
export const deleteField = async (fieldId) => {
  try {
    const response = await client.delete(`${API_BASE}/fields/${fieldId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Save field boundary from GPS points
 * @param {Object} boundaryData - Boundary data with GPS points
 * @returns {Promise<Object>} Saved boundary object
 */
export const saveBoundary = async (boundaryData) => {
  try {
    const response = await client.post(`${API_BASE}/boundaries`, boundaryData);
    return response.data;
  } catch (error) {
    console.error('Error saving boundary:', error);
    throw error;
  }
};

/**
 * Fetch field boundaries
 * @param {number} fieldId - Field ID to fetch boundaries for
 * @returns {Promise<Array>} Array of boundary objects
 */
export const fetchBoundaries = async (fieldId) => {
  try {
    const response = await client.get(`${API_BASE}/boundaries?fieldId=${fieldId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching boundaries for field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Update field boundary
 * @param {number} boundaryId - Boundary ID to update
 * @param {Object} boundaryData - Updated boundary data
 * @returns {Promise<Object>} Updated boundary object
 */
export const updateBoundary = async (boundaryId, boundaryData) => {
  try {
    const response = await client.put(`${API_BASE}/boundaries/${boundaryId}`, boundaryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating boundary ${boundaryId}:`, error);
    throw error;
  }
};

/**
 * Delete field boundary
 * @param {number} boundaryId - Boundary ID to delete
 * @returns {Promise<Object>} Success response
 */
export const deleteBoundary = async (boundaryId) => {
  try {
    const response = await client.delete(`${API_BASE}/boundaries/${boundaryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting boundary ${boundaryId}:`, error);
    throw error;
  }
};

/**
 * Save GPS tracking data
 * @param {Object} trackingData - GPS tracking data
 * @returns {Promise<Object>} Saved tracking object
 */
export const saveTrackingData = async (trackingData) => {
  try {
    const response = await client.post(`${API_BASE}/tracking`, trackingData);
    return response.data;
  } catch (error) {
    console.error('Error saving tracking data:', error);
    throw error;
  }
};

/**
 * Fetch GPS tracking history
 * @param {number} fieldId - Field ID to fetch tracking for
 * @param {Object} options - Query options (startDate, endDate, etc.)
 * @returns {Promise<Array>} Array of tracking records
 */
export const fetchTrackingHistory = async (fieldId, options = {}) => {
  try {
    const params = new URLSearchParams({ fieldId, ...options });
    const response = await client.get(`${API_BASE}/tracking?${params}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tracking history for field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Calculate field metrics (area, perimeter, etc.)
 * @param {number} fieldId - Field ID to calculate metrics for
 * @returns {Promise<Object>} Field metrics object
 */
export const calculateMetrics = async (fieldId) => {
  try {
    const response = await client.post(`${API_BASE}/metrics/calculate`, { fieldId });
    return response.data;
  } catch (error) {
    console.error(`Error calculating metrics for field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Export field data to GeoJSON
 * @param {number} fieldId - Field ID to export
 * @returns {Promise<Object>} GeoJSON object
 */
export const exportToGeoJSON = async (fieldId) => {
  try {
    const response = await client.get(`${API_BASE}/fields/${fieldId}/geojson`);
    return response.data;
  } catch (error) {
    console.error(`Error exporting field ${fieldId} to GeoJSON:`, error);
    throw error;
  }
};

/**
 * Export field data to KML
 * @param {number} fieldId - Field ID to export
 * @returns {Promise<string>} KML string
 */
export const exportToKML = async (fieldId) => {
  try {
    const response = await client.get(`${API_BASE}/fields/${fieldId}/kml`);
    return response.data;
  } catch (error) {
    console.error(`Error exporting field ${fieldId} to KML:`, error);
    throw error;
  }
};

/**
 * Get nearby fields within radius
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>} Array of nearby fields
 */
export const getNearbyFields = async (lat, lng, radiusKm) => {
  try {
    const response = await client.get(`${API_BASE}/fields/nearby`, {
      params: { lat, lng, radius: radiusKm }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby fields:', error);
    throw error;
  }
};

/**
 * Get weather data for a field location
 * @param {number} lat - Field latitude
 * @param {number} lng - Field longitude
 * @returns {Promise<Object>} Weather data object
 */
export const getWeatherForLocation = async (lat, lng) => {
  try {
    const response = await client.get(`${API_BASE}/weather`, {
      params: { lat, lng }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

/**
 * Get soil analysis data for a field
 * @param {number} fieldId - Field ID
 * @returns {Promise<Object>} Soil analysis data
 */
export const getSoilAnalysis = async (fieldId) => {
  try {
    const response = await client.get(`${API_BASE}/fields/${fieldId}/soil-analysis`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching soil analysis for field ${fieldId}:`, error);
    throw error;
  }
};

/**
 * Generate field report
 * @param {number} fieldId - Field ID
 * @param {Object} options - Report options (format, dateRange, etc.)
 * @returns {Promise<Object>} Generated report
 */
export const generateReport = async (fieldId, options = {}) => {
  try {
    const response = await client.post(`${API_BASE}/reports/generate`, {
      fieldId,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`Error generating report for field ${fieldId}:`, error);
    throw error;
  }
};
