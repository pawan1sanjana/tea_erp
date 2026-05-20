# GIS Module Integration Guide

This guide explains how to integrate the GIS Mapping Module into your ERP application.

## Quick Start

### 1. Add Route to Main App

```jsx
// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import GISMapping from './pages/GISMapping';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/gis" element={<GISMapping />} />
      {/* Other routes */}
    </Routes>
  );
}

export default App;
```

### 2. Add Navigation Link

```jsx
// In your navigation component
<nav>
  <Link to="/gis">
    <span>🗺️</span> GIS Mapping
  </Link>
</nav>
```

### 3. Configure API Base URL

Make sure your API client is properly configured in `src/api/client.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default client;
```

## Using the Custom Hook

The `useGISMapping` hook provides a convenient way to manage GIS state and operations:

```jsx
import { useGISMapping } from '../hooks/useGISMapping';

function MyComponent() {
  const {
    fields,
    selectedField,
    gpsPoints,
    metrics,
    loadFields,
    addGPSPoint,
    calculateFieldMetrics
  } = useGISMapping();

  return (
    <div>
      <h2>Fields: {fields.length}</h2>
      <p>Selected: {selectedField?.name}</p>
      <p>GPS Points: {gpsPoints.length}</p>
      <p>Field Area: {metrics.area} ha</p>
    </div>
  );
}
```

## Backend API Requirements

Your backend needs to implement the following endpoints:

### Fields Endpoints

```javascript
// GET /api/gis/fields
// Fetch all fields
Response: Array<Field>

// GET /api/gis/fields/:id
// Fetch specific field
Response: Field

// POST /api/gis/fields
// Create new field
Body: { name, area, crop, lat, lng, ... }
Response: Field

// PUT /api/gis/fields/:id
// Update field
Body: Partial<Field>
Response: Field

// DELETE /api/gis/fields/:id
// Delete field
Response: { success: boolean }
```

### Field Schema Example

```javascript
{
  id: number,
  name: string,
  area: number,           // hectares
  crop: string,
  soilType: string,
  moisture: number,       // percentage
  pH: number,
  temperature: number,    // celsius
  lat: number,
  lng: number,
  status: 'Active' | 'Inactive',
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Boundaries Endpoints

```javascript
// GET /api/gis/boundaries?fieldId=:fieldId
// Fetch boundaries for a field
Response: Array<Boundary>

// POST /api/gis/boundaries
// Save new boundary
Body: {
  fieldId: number,
  points: Array<{lat, lng, accuracy}>,
  metrics: { area, perimeter },
  timestamp: Date
}
Response: Boundary

// PUT /api/gis/boundaries/:id
// Update boundary
Body: Partial<Boundary>
Response: Boundary

// DELETE /api/gis/boundaries/:id
// Delete boundary
Response: { success: boolean }
```

### GPS Tracking Endpoints

```javascript
// GET /api/gis/tracking?fieldId=:fieldId
// Fetch tracking history
Response: Array<TrackingData>

// POST /api/gis/tracking
// Save tracking data
Body: {
  fieldId: number,
  points: Array<{lat, lng, accuracy, timestamp}>,
  duration: number,
  distance: number
}
Response: TrackingData
```

### Metrics & Analysis

```javascript
// POST /api/gis/metrics/calculate
// Calculate field metrics
Body: { fieldId: number }
Response: { area, perimeter, boundingBox }

// GET /api/gis/fields/:id/soil-analysis
// Get soil analysis
Response: SoilAnalysis

// GET /api/gis/fields/:id/geojson
// Export as GeoJSON
Response: GeoJSON

// POST /api/gis/reports/generate
// Generate field report
Body: { fieldId, format, dateRange }
Response: Report
```

## Environment Variables

Add these to your `.env` file:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_GEOLOCATION_ENABLED=true
REACT_APP_MAP_PROVIDER=openstreetmap
REACT_APP_MAPBOX_TOKEN=your_token_here
```

## Using Geolocation API

The GPS Field Mapping component uses the browser's Geolocation API. Make sure your application runs over HTTPS in production.

**Browser Requirements:**
- User must grant location permission
- HTTPS protocol required (except localhost)
- Modern browser with Geolocation API support

**Test Locally:**
```bash
# Enable HTTPS for localhost testing
npm run dev -- --https
```

## Styling Customization

Override default styles in your CSS:

```css
:root {
  --gis-primary-green: #27ae60;
  --gis-primary-blue: #3498db;
  --gis-text-color: #2c3e50;
  --gis-background: #f8f9fa;
}

.gis-mapping-container {
  /* Your custom styles */
}
```

## Data Export

### Export to CSV

```jsx
import { useGISMapping } from '../hooks/useGISMapping';

function ExportButton() {
  const { gpsPoints } = useGISMapping();

  const handleExport = () => {
    const csv = [
      ['Latitude', 'Longitude', 'Accuracy', 'Timestamp'],
      ...gpsPoints.map(p => [p.lat, p.lng, p.accuracy, p.timestamp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gps_data.csv';
    a.click();
  };

  return <button onClick={handleExport}>Export CSV</button>;
}
```

### Export to GeoJSON

```jsx
import { exportToGeoJSON } from '../utils/gisUtils';

function ExportGeoJSON() {
  const { selectedField, gpsPoints } = useGISMapping();

  const handleExport = () => {
    const geojson = exportToGeoJSON(selectedField, gpsPoints);
    const blob = new Blob([geojson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field_boundary.geojson';
    a.click();
  };

  return <button onClick={handleExport}>Export GeoJSON</button>;
}
```

## Advanced Usage

### Real-time Field Monitoring

```jsx
import { useGISMapping } from '../hooks/useGISMapping';
import { useEffect } from 'react';

function RealTimeMonitoring() {
  const { selectedField, getWeather, getSoilData } = useGISMapping();

  useEffect(() => {
    if (selectedField) {
      // Fetch weather every 5 minutes
      const interval = setInterval(() => {
        getWeather(selectedField.lat, selectedField.lng);
        getSoilData(selectedField.id);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [selectedField, getWeather, getSoilData]);

  return <div>Real-time monitoring active</div>;
}
```

### Field Recommendations

```jsx
function FieldRecommendations({ fieldId }) {
  const { getSoilData } = useGISMapping();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    getSoilData(fieldId).then(soil => {
      // Generate recommendations based on soil analysis
      const recs = generateRecommendations(soil);
      setRecommendations(recs);
    });
  }, [fieldId]);

  return (
    <div className="recommendations">
      {recommendations.map(rec => (
        <div key={rec.id} className="recommendation-card">
          {rec.text}
        </div>
      ))}
    </div>
  );
}
```

## Performance Optimization

### Lazy Loading

```jsx
import { lazy, Suspense } from 'react';

const GISMapping = lazy(() => import('./pages/GISMapping'));

function App() {
  return (
    <Suspense fallback={<div>Loading GIS Module...</div>}>
      <GISMapping />
    </Suspense>
  );
}
```

### Memoization

```jsx
import { useMemo } from 'react';

function FieldList({ fields }) {
  const sortedFields = useMemo(() => {
    return [...fields].sort((a, b) => a.name.localeCompare(b.name));
  }, [fields]);

  return <div>{/* ... */}</div>;
}
```

## Troubleshooting

### Geolocation Not Working

1. Check browser console for permission errors
2. Ensure HTTPS is enabled (except localhost)
3. Check browser geolocation settings
4. Verify user has granted location permission

### API Errors

1. Check API endpoint URLs in gisService.js
2. Verify backend server is running
3. Check API response format matches expected schema
4. Enable CORS if needed

### Map Not Loading

1. Check if map container has proper height
2. Verify CSS is loaded correctly
3. Check browser console for errors
4. Ensure coordinates are valid (lat: -90 to 90, lng: -180 to 180)

## Support & Resources

- [Geolocation API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [GeoJSON Format](https://geojson.org/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [OpenStreetMap](https://www.openstreetmap.org/)

## Next Steps

1. Implement backend API endpoints
2. Configure environment variables
3. Add route to main application
4. Test with sample data
5. Customize styling to match your branding
6. Integrate with other modules
7. Set up real map provider (optional)
8. Deploy to production

## License

This integration guide is part of the Agricultural ERP System.
