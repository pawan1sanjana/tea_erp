import React, { useState, useEffect } from 'react';
import './FieldMap.css';

export default function FieldMap({ onFieldSelect, selectedField, mapData }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 }); // India center
  const [zoom, setZoom] = useState(4);

  useEffect(() => {
    // Fetch fields from API
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      } else {
        // Mock data for demonstration
        setFields(mockFields);
      }
    } catch (error) {
      console.log('Using mock data:', error);
      setFields(mockFields);
    }
    setLoading(false);
  };

  const mockFields = [
    {
      id: 1,
      name: 'North Field',
      area: 5.2,
      lat: 20.5937,
      lng: 78.9629,
      crop: 'Wheat',
      status: 'Active'
    },
    {
      id: 2,
      name: 'South Field',
      area: 3.8,
      lat: 20.5800,
      lng: 78.9500,
      crop: 'Rice',
      status: 'Active'
    },
    {
      id: 3,
      name: 'East Field',
      area: 4.1,
      lat: 20.6000,
      lng: 78.9750,
      crop: 'Corn',
      status: 'Inactive'
    }
  ];

  const handleFieldClick = (field) => {
    onFieldSelect(field);
    setMapCenter({ lat: field.lat, lng: field.lng });
    setZoom(10);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 1));
  };

  const resetMap = () => {
    setMapCenter({ lat: 20.5937, lng: 78.9629 });
    setZoom(4);
  };

  if (loading) {
    return <div className="loading">Loading fields...</div>;
  }

  return (
    <div className="field-map-container">
      <div className="map-wrapper">
        <div className="map-canvas">
          <div className="map-placeholder">
            <p>Interactive GIS Map</p>
            <p className="map-info">
              Center: {mapCenter.lat.toFixed(4)}°, {mapCenter.lng.toFixed(4)}° | Zoom: {zoom}
            </p>
            {selectedField && (
              <div className="selected-field-info">
                <h3>{selectedField.name}</h3>
                <p>Location: {selectedField.lat}°, {selectedField.lng}°</p>
                <p>Area: {selectedField.area} hectares</p>
              </div>
            )}
          </div>

          <div className="map-controls">
            <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
              +
            </button>
            <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
              −
            </button>
            <button className="control-btn" onClick={resetMap} title="Reset Map">
              ↺
            </button>
          </div>
        </div>

        <div className="map-sidebar">
          <div className="sidebar-header">
            <h3>Fields List</h3>
            <button className="btn-refresh" onClick={fetchFields}>
              🔄 Refresh
            </button>
          </div>

          <div className="fields-list">
            {fields.map((field) => (
              <div
                key={field.id}
                className={`field-item ${selectedField?.id === field.id ? 'active' : ''}`}
                onClick={() => handleFieldClick(field)}
              >
                <div className="field-name">{field.name}</div>
                <div className="field-details">
                  <span className="detail-badge">{field.crop}</span>
                  <span className={`status-badge ${field.status.toLowerCase()}`}>
                    {field.status}
                  </span>
                </div>
                <div className="field-meta">
                  <small>Area: {field.area} ha</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#27ae60' }}></span>
            <span>Active Field</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
            <span>Inactive Field</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#3498db' }}></span>
            <span>Selected Field</span>
          </div>
        </div>
      </div>
    </div>
  );
}
