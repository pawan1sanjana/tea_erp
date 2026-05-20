/**
 * Custom Hook: useGISMapping
 * Manages GIS mapping state and functionality
 */

import { useState, useCallback, useEffect } from 'react';
import * as gisService from '../api/gisService';
import * as gisUtils from '../utils/gisUtils';

export const useGISMapping = () => {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    area: 0,
    perimeter: 0,
    boundingBox: null
  });

  // Fetch all fields
  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gisService.fetchAllFields();
      setFields(data);
      setError(null);
    } catch (err) {
      setError('Failed to load fields');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specific field
  const loadField = useCallback(async (fieldId) => {
    setLoading(true);
    try {
      const field = await gisService.fetchFieldById(fieldId);
      setSelectedField(field);
      
      // Also load boundaries for this field
      const fieldBoundaries = await gisService.fetchBoundaries(fieldId);
      setBoundaries(fieldBoundaries);
      setError(null);
    } catch (err) {
      setError(`Failed to load field ${fieldId}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update field data
  const updateFieldData = useCallback(async (fieldId, fieldData) => {
    try {
      const updated = await gisService.updateField(fieldId, fieldData);
      setSelectedField(updated);
      setFields(prev => prev.map(f => f.id === fieldId ? updated : f));
      setError(null);
      return updated;
    } catch (err) {
      setError('Failed to update field');
      console.error(err);
      throw err;
    }
  }, []);

  // Add GPS point
  const addGPSPoint = useCallback((point) => {
    const newPoint = {
      id: Date.now(),
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy || 0,
      timestamp: new Date().toISOString()
    };
    
    setGpsPoints(prev => [...prev, newPoint]);
    return newPoint;
  }, []);

  // Remove GPS point
  const removeGPSPoint = useCallback((pointId) => {
    setGpsPoints(prev => prev.filter(p => p.id !== pointId));
  }, []);

  // Clear all GPS points
  const clearGPSPoints = useCallback(() => {
    setGpsPoints([]);
  }, []);

  // Calculate field metrics
  const calculateFieldMetrics = useCallback(() => {
    if (gpsPoints.length < 3) {
      setMetrics({ area: 0, perimeter: 0, boundingBox: null });
      return;
    }

    const area = gisUtils.calculatePolygonArea(gpsPoints);
    const perimeter = gisUtils.calculatePerimeter(gpsPoints);
    const boundingBox = gisUtils.calculateBoundingBox(gpsPoints);

    setMetrics({
      area: gisUtils.sqKmToHectares(area),
      perimeter,
      boundingBox
    });
  }, [gpsPoints]);

  // Save field boundary
  const saveBoundary = useCallback(async (fieldId) => {
    if (gpsPoints.length < 3) {
      throw new Error('Need at least 3 points to create a boundary');
    }

    try {
      const boundaryData = {
        fieldId,
        points: gpsPoints,
        metrics,
        timestamp: new Date().toISOString()
      };

      const saved = await gisService.saveBoundary(boundaryData);
      setBoundaries(prev => [...prev, saved]);
      setError(null);
      return saved;
    } catch (err) {
      setError('Failed to save boundary');
      console.error(err);
      throw err;
    }
  }, [gpsPoints, metrics]);

  // Export to GeoJSON
  const exportAsGeoJSON = useCallback((fieldId) => {
    if (!selectedField || gpsPoints.length < 3) {
      throw new Error('Invalid field or points');
    }

    return gisUtils.exportToGeoJSON(selectedField, gpsPoints);
  }, [selectedField, gpsPoints]);

  // Get nearby fields
  const getNearby = useCallback(async (lat, lng, radiusKm) => {
    try {
      const nearby = await gisService.getNearbyFields(lat, lng, radiusKm);
      return nearby;
    } catch (err) {
      console.error('Failed to get nearby fields:', err);
      throw err;
    }
  }, []);

  // Get weather data
  const getWeather = useCallback(async (lat, lng) => {
    try {
      const weather = await gisService.getWeatherForLocation(lat, lng);
      return weather;
    } catch (err) {
      console.error('Failed to get weather data:', err);
      throw err;
    }
  }, []);

  // Get soil analysis
  const getSoilData = useCallback(async (fieldId) => {
    try {
      const soil = await gisService.getSoilAnalysis(fieldId);
      return soil;
    } catch (err) {
      console.error('Failed to get soil analysis:', err);
      throw err;
    }
  }, []);

  // Generate field report
  const generateFieldReport = useCallback(async (fieldId, options) => {
    try {
      const report = await gisService.generateReport(fieldId, options);
      return report;
    } catch (err) {
      console.error('Failed to generate report:', err);
      throw err;
    }
  }, []);

  // Load fields on mount
  useEffect(() => {
    loadFields();
  }, [loadFields]);

  return {
    // State
    fields,
    selectedField,
    gpsPoints,
    boundaries,
    loading,
    error,
    metrics,

    // Field management
    setSelectedField,
    loadField,
    loadFields,
    updateFieldData,

    // GPS point management
    addGPSPoint,
    removeGPSPoint,
    clearGPSPoints,

    // Calculations & Analysis
    calculateFieldMetrics,
    saveBoundary,
    exportAsGeoJSON,

    // Data retrieval
    getNearby,
    getWeather,
    getSoilData,
    generateFieldReport
  };
};

export default useGISMapping;
